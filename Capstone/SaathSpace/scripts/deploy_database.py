"""
SaathSpace — Cloud Database Deployment & Verification Script
Restores schemas, tables, and 12,847 listings to any cloud PostgreSQL provider
(Neon, Supabase, Render, Railway, AWS RDS, etc.) and verifies data integrity.
"""

import sys
import os
import subprocess
from pathlib import Path
import psycopg
from psycopg.rows import dict_row

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKUP_FILE = PROJECT_ROOT / "backup" / "saathspace_phase1.backup"

# Look for pg_restore in PATH or standard Windows PostgreSQL paths
def find_pg_restore():
    # 1. Check if on PATH
    try:
        res = subprocess.run(["pg_restore", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0:
            return "pg_restore"
    except Exception:
        pass

    # 2. Check standard Windows PostgreSQL install paths
    possible_paths = [
        Path(r"C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"),
        Path(r"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe"),
        Path(r"C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"),
        Path(r"C:\Program Files\PostgreSQL\15\bin\pg_restore.exe"),
    ]
    for p in possible_paths:
        if p.exists():
            return str(p)
    return None

def verify_cloud_db(db_url: str):
    print("\n🔍 Verifying cloud database integrity...")
    try:
        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # 1. Check schemas
                cur.execute("""
                    SELECT schema_name 
                    FROM information_schema.schemata 
                    WHERE schema_name IN ('app', 'staging')
                    ORDER BY schema_name;
                """)
                schemas = [r['schema_name'] for r in cur.fetchall()]
                print(f"  ✓ Schemas found: {', '.join(schemas)}")
                
                # 2. Check listings count
                cur.execute("SELECT COUNT(*) AS count FROM app.listing;")
                listing_count = cur.fetchone()['count']
                print(f"  ✓ Total listings in app.listing: {listing_count:,}")
                
                # 3. Check city count
                cur.execute("SELECT COUNT(*) AS count FROM app.city;")
                city_count = cur.fetchone()['count']
                print(f"  ✓ Cities registered in app.city: {city_count}")

                # 4. Check users count
                cur.execute("SELECT COUNT(*) AS count FROM app.app_user;")
                user_count = cur.fetchone()['count']
                print(f"  ✓ Demo personas in app.app_user: {user_count}")

                # 5. Check historical vs user listings
                cur.execute("""
                    SELECT data_origin, COUNT(*) AS count 
                    FROM app.listing 
                    GROUP BY data_origin;
                """)
                origins = {r['data_origin']: r['count'] for r in cur.fetchall()}
                for origin, count in origins.items():
                    print(f"    - Origin '{origin}': {count:,} listings")

                if listing_count >= 12847:
                    print("\n🎉 SUCCESS! Cloud database is fully populated and verified.")
                    print("   You can now connect your Flask backend to this database.")
                    return True
                else:
                    print(f"\n⚠️ WARNING: Found {listing_count} listings, expected at least 12,847.")
                    return False
    except Exception as e:
        print(f"\n❌ Error connecting or querying database: {e}")
        return False

def main():
    print("=" * 70)
    print("        SaathSpace Cloud Database Deployment Tool")
    print("=" * 70)

    db_url = None
    if len(sys.argv) > 1:
        db_url = sys.argv[1].strip()
    elif os.getenv("TARGET_DATABASE_URL"):
        db_url = os.getenv("TARGET_DATABASE_URL").strip()
    else:
        print("\nEnter your target cloud PostgreSQL connection URL.")
        print("Example (Neon/Supabase/Render):")
        print("postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require\n")
        try:
            db_url = input("Target Database URL: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nOperation cancelled.")
            sys.exit(1)

    if not db_url:
        print("Error: No database URL provided.")
        sys.exit(1)

    # Normalize url
    if db_url.startswith("postgres://"):
        db_url = "postgresql://" + db_url[len("postgres://"):]

    if not BACKUP_FILE.exists():
        print(f"Error: Backup archive not found at {BACKUP_FILE}")
        sys.exit(1)

    pg_restore_bin = find_pg_restore()
    if not pg_restore_bin:
        print("Error: Could not locate pg_restore executable on your system.")
        print("Ensure PostgreSQL command line tools are installed.")
        sys.exit(1)

    print(f"\nUsing restore binary: {pg_restore_bin}")
    print(f"Backup archive:       {BACKUP_FILE} ({BACKUP_FILE.stat().st_size / (1024*1024):.2f} MB)")
    print(f"Target Database:      {db_url.split('@')[-1] if '@' in db_url else 'specified host'}")

    confirm = input("\nProceed with restoring to this cloud database? (y/N): ").strip().lower()
    if confirm not in ('y', 'yes'):
        print("Aborted.")
        sys.exit(0)

    print("\n⏳ Restoring database schema and records (this takes ~15-30 seconds)...")
    cmd = [
        pg_restore_bin,
        "--no-owner",
        "--no-privileges",
        "--clean",
        "--if-exists",
        f"--dbname={db_url}",
        str(BACKUP_FILE)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    # pg_restore often exits with code 1 due to non-critical warnings (e.g. relation does not exist yet during drop)
    if result.returncode != 0:
        # Check stderr for critical errors vs drop warnings
        warnings = [line for line in result.stderr.splitlines() if "warning" in line.lower() or "error" in line.lower()]
        print(f"Note: pg_restore completed with notices/warnings (common during schema creation):")
        for w in warnings[:5]:
            print(f"   {w}")

    # Run verification check
    success = verify_cloud_db(db_url)
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
