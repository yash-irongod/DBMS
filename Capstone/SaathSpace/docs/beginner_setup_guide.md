# SaathSpace — Beginner Setup Guide (Windows)

This guide assumes you are using Windows and are new to PostgreSQL. It uses pgAdmin's graphical interface so you do not need terminal commands for the initial setup.

---

## What you need before starting

- PostgreSQL 18.x installer (Windows 64-bit).
- Free disk space (at least 2–3 GB).
- A master password for your local PostgreSQL `postgres` administrator account. Keep this password safe and private.
- The project files located at your workspace path:
  ```text
  C:\Users\Lenovo\Desktop\Projects\SaathSpace\
  ```

---

## Step 1 — Download and Install PostgreSQL 18

1. Open the official Windows download page: <https://www.postgresql.org/download/windows/>.
2. Download the interactive installer for PostgreSQL **18.x stable** for Windows 64-bit. Avoid PostgreSQL 19 release candidates for coursework stability.
3. Run the installer.
4. When selecting components, ensure **PostgreSQL Server**, **pgAdmin 4**, and **Command Line Tools** are checked. (Stack Builder is optional and not required).
5. Keep the default install and data directory.
6. When prompted for the database superuser (`postgres`) password, enter a secure password and remember it. You will need it to log in.
7. Keep the default port **5432** (unless already in use).
8. Keep the default locale and finish the installation.

---

## Step 2 — Open pgAdmin and Connect

1. Open the Windows Start menu and launch **pgAdmin 4**.
2. If pgAdmin asks for a master password on startup, enter one. This secures pgAdmin's stored credentials.
3. In the left **Browser** tree, expand **Servers**.
4. Click on your local PostgreSQL server (e.g. `PostgreSQL 18`).
5. Enter the `postgres` password you created during installation.
6. The server tree will expand to show **Databases**, **Login/Group Roles**, etc.

---

## Step 3 — Locate the SaathSpace Project Files

Confirm that your project directory is located at:
```text
C:\Users\Lenovo\Desktop\Projects\SaathSpace\
```

Inside this folder, you will find:
- `sql\` — All database setup, schema, view, and verification scripts.
- `data\processed\rental_listings_staging.csv` — The import-ready combined staging file (13,910 rows).
- `docs\` — Documentation, schema designs, and data audits.

---

## Step 4 — Create the `saathspace` Database

1. In pgAdmin's left **Browser** panel, right-click **Databases** under your server.
2. Select **Create → Database...**.
3. In the **General** tab, set **Database** name to: `saathspace`.
4. Leave **Owner** as `postgres`.
5. Click **Save**.
6. You will now see `saathspace` listed under Databases.

*(Note: Because the database is created in pgAdmin, you can skip `sql/00_create_database.sql`.)*

---

## Step 5 — Create the Initial Schemas & Tables

For each script below, follow these steps in pgAdmin:
1. Right-click the `saathspace` database in the left Browser tree and select **Query Tool**.
2. Click the **Open File** icon (folder icon on the toolbar).
3. Browse to `C:\Users\Lenovo\Desktop\Projects\SaathSpace\sql\`.
4. Open the file, then click **Execute/Refresh** (lightning-bolt icon) or press **F5**.
5. Ensure the Messages pane reports `Query returned successfully`.

Execute these three scripts in order:
1. `01_app_schema.sql` — Creates the `app` schema and the 10 core tables (`city`, `locality`, `app_user`, `listing`, `amenity`, `listing_amenity`, `roommate_profile`, `saved_listing`, `enquiry`, `roommate_request`).
2. `02_staging_schema.sql` — Creates the `staging` schema and `staging.rental_listings_raw` landing table.
3. `03_seed_reference_data.sql` — Inserts reference cities (Delhi, Mumbai, Pune) and 12 standard amenities.

---

## Step 6 — Import the Rental CSV Data into Staging

1. In pgAdmin's left Browser panel, expand `saathspace` → **Schemas** → `staging` → **Tables**.
2. Right-click `rental_listings_raw` and select **Import/Export Data...**.
3. In the **General** tab:
   - Select **Import**.
   - Filename: `C:\Users\Lenovo\Desktop\Projects\SaathSpace\data\processed\rental_listings_staging.csv`.
   - Format: **csv**.
   - Encoding: **UTF8**.
4. In the **Options** tab:
   - **Header**: Yes (enabled).
   - **Delimiter**: `,` (comma).
   - **Quote**: `"` (double quote).
   - **Escape**: `"` (double quote).
   - Leave default NULL-string unchanged so literal text such as `'null'` remains available for transformation.
5. In the **Columns** tab, ensure columns match the CSV order (do **not** import generated `staging_id` or `imported_at`):
   ```text
   source_file, source_row_number, import_batch, house_type, house_size, location, city, latitude, longitude, price, currency, num_bathrooms, num_balconies, is_negotiable, price_sq_ft, verification_date, description, security_deposit, furnishing_status
   ```
6. Click **OK** and wait for the import to complete.

---

## Step 7 — Verify the Raw Staging Import

1. In pgAdmin Query Tool connected to `saathspace`, open `sql/04_verify_setup.sql`.
2. Execute the queries (highlight each query and press F5).
3. **Expected results:**
   - Total staged rows: **13,910**.
   - City counts: Delhi **5,000**, Mumbai **5,000**, Pune **3,910**.
   - `app.city` contains Delhi, Mumbai, Pune.
   - `app.amenity` contains 12 starter amenities.

---

## Step 8 — Create and Verify the Cleaned View (Deduplication)

1. Open `C:\Users\Lenovo\Desktop\Projects\SaathSpace\sql\02b_staging_clean_view.sql` in Query Tool.
2. Press **F5** to create the view `staging.v_rental_listings_cleaned`.
3. This view removes 1,063 exact duplicates and fixes city discrepancies (mapping Hisar in the Mumbai file to Mumbai).
4. Run the verification query at the bottom of the script:
   ```sql
   SELECT COUNT(*) AS cleaned_listing_count
   FROM staging.v_rental_listings_cleaned;
   ```
5. **Expected result:** Exactly **12,847 rows**.
   - Delhi: **4,534**
   - Mumbai: **4,629**
   - Pune: **3,684**

---

## Step 9 — Load Cleaned Listings into Application Tables

1. Open `C:\Users\Lenovo\Desktop\Projects\SaathSpace\sql\05_load_clean_listings.sql` in Query Tool.
2. Press **F5** to execute.
3. This script populates `app.locality` and inserts all 12,847 cleaned records into `app.listing`.
4. **Verification:** Confirm `imported_listing_count` returns **12,847**, and all records have `availability_status = 'unverified'` and `data_origin = 'public_dataset'`.

---

## Step 10 — Seed Phase 1 Demonstration Data

1. Open `C:\Users\Lenovo\Desktop\Projects\SaathSpace\sql\06_phase1_demo_seed.sql` in Query Tool.
2. Press **F5** to execute.
3. This creates:
   - 4 synthetic demonstration users (`aarav.demo@example.test`, etc.).
   - 4 roommate lifestyle preference profiles.
   - 4 saved listing relationships.
   - 1 sample roommate connection request.

---

## Step 11 — Run Phase 1 Demonstration Queries

1. Open `C:\Users\Lenovo\Desktop\Projects\SaathSpace\sql\07_phase1_demo_queries.sql` in Query Tool.
2. Highlight and run each DEMO query individually (F5):
   - **DEMO 1:** Data pipeline audit (13,910 raw $\to$ 12,847 cleaned $\to$ 12,847 loaded).
   - **DEMO 2:** Data integrity & check constraint validation (0 invalid rents, 0 invalid sizes).
   - **DEMO 3:** Budget search in Delhi (rent $\le$ ₹15,000).
   - **DEMO 4:** City price aggregates (count, average, min, max rent).
   - **DEMO 5:** Multi-table join across users, bookmarks, listings, localities, and cities.
   - **DEMO 6:** 100-point transparent roommate compatibility scoring algorithm.
   - **DEMO 7:** Referential integrity check (confirm 0 orphan listings).
   - **DEMO 8:** Schema table catalog audit.

---

## Step 12 — Launching the SaathSpace Web Application

Once your database is loaded with the Phase 1 scripts, you can run the full-stack web application:

### Quickest Way: 1-Click Batch Launcher
Double-click **`start_all.bat`** in the project root:
```text
C:\Users\Lenovo\Desktop\Projects\SaathSpace\start_all.bat
```
This automatically starts both the Flask backend API and Vite React frontend in separate command windows and opens `http://localhost:5173`.

### Or Launch From Terminal:
1. **Backend:**
   ```powershell
   cd C:\Users\Lenovo\Desktop\Projects\SaathSpace\backend
   python run.py
   ```
2. **Frontend:**
   ```powershell
   cd C:\Users\Lenovo\Desktop\Projects\SaathSpace\frontend
   npm run dev
   ```

3. Visit **`http://localhost:5173`** in your web browser. You can click any of the 4 demo accounts (Aarav, Diya, Kabir, Mira) from the demo switcher in the navigation bar to log in immediately without typing passwords.

---

## Important Data Integrity Notes

- The imported property listings are historical and unverified. They must not be presented as currently available in any user-facing interface without independent verification.
- Synthetic demo accounts and requests are strictly for testing and coursework demonstration.
- Keep passwords and credentials secure; never commit database passwords to Git.
