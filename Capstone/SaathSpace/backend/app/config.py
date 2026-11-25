import os
import re
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory if present
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Config:
    # Database connection parameters
    DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')
    
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', '5432'))
    DB_NAME = os.getenv('DB_NAME', 'saathspace')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_SSLMODE = os.getenv('DB_SSLMODE', '')
    
    # Connection pool limits
    DB_POOL_MIN = int(os.getenv('DB_POOL_MIN', '1'))
    DB_POOL_MAX = int(os.getenv('DB_POOL_MAX', '5'))
    
    SECRET_KEY = os.getenv('SECRET_KEY', 'saathspace_secret_key_default')
    FLASK_PORT = int(os.getenv('PORT', os.getenv('FLASK_PORT', '5000')))
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    IS_PRODUCTION = FLASK_ENV.lower() == 'production'
    
    # Session cookie security settings
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax' if not IS_PRODUCTION else 'None')
    # Use secure cookies in production or if explicitly requested
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'true' if IS_PRODUCTION else 'false').lower() in ('true', '1', 'yes')
    PERMANENT_SESSION_LIFETIME = 86400 * 7  # 7 days
    
    # CORS Origins
    raw_cors = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,https://*.vercel.app')
    parsed_origins = []
    for item in raw_cors.split(','):
        item = item.strip()
        if not item:
            continue
        if '*' in item and item != '*':
            # Convert wildcard like https://*.vercel.app into regex
            pattern = re.compile('^' + re.escape(item).replace('\\*', '.*') + '$')
            parsed_origins.append(pattern)
        else:
            parsed_origins.append(item)
    CORS_ORIGINS = parsed_origins

    @classmethod
    def get_db_conninfo(cls):
        # Prefer DATABASE_URL if provided (standard on Render, Neon, Supabase, Railway)
        db_url = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')
        if db_url:
            # Psycopg requires postgresql:// rather than legacy postgres://
            if db_url.startswith('postgres://'):
                db_url = 'postgresql://' + db_url[len('postgres://'):]
            # Ensure sslmode=require for remote cloud hosts if not specified
            if 'localhost' not in db_url and '127.0.0.1' not in db_url and 'sslmode=' not in db_url:
                separator = '&' if '?' in db_url else '?'
                db_url = f"{db_url}{separator}sslmode=require"
            return db_url

        ssl_part = f" sslmode={cls.DB_SSLMODE}" if cls.DB_SSLMODE else ""
        return (
            f"host={cls.DB_HOST} "
            f"port={cls.DB_PORT} "
            f"dbname={cls.DB_NAME} "
            f"user={cls.DB_USER} "
            f"password={cls.DB_PASSWORD}{ssl_part}"
        )
