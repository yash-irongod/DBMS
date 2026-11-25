# SaathSpace — Cloud Deployment Guide

This guide walks you step-by-step through making **SaathSpace** live on the internet using the industry-standard free hosting stack:

- **Frontend:** [Vercel](https://vercel.com) (React 19, TypeScript, Vite, Tailwind CSS on global Edge CDN)
- **Backend API:** [Render](https://render.com) (Python Flask 3 + Gunicorn WSGI)
- **Database:** [Neon](https://neon.tech) (Free Serverless PostgreSQL 16/17/18 with SSL)

---

## Architecture Overview

```
       [User's Web Browser]
                │
                ▼ (HTTPS)
   ┌───────────────────────────┐
   │    Vercel (Frontend)      │  React 19 Single Page App
   │  https://saathspace.vercel.app  │  (Zero-config SPA routing & caching)
   └────────────┬──────────────┘
                │
                │ Fetch API with Credentials
                ▼ (HTTPS)
   ┌───────────────────────────┐
   │     Render (Backend)      │  Python 3 + Flask + Gunicorn
   │ https://saathspace-api.onrender.com │  (Parameterized SQL, Auth, Roommate logic)
   └────────────┬──────────────┘
                │
                │ Encrypted Connection (SSL)
                ▼
   ┌───────────────────────────┐
   │   Neon (Cloud Database)   │  PostgreSQL with 10 core tables
   │   ep-xyz.aws.neon.tech    │  and all 12,847 cleaned listings
   └───────────────────────────┘
```

---

## Step 1: Create Free Cloud PostgreSQL on Neon (3 Minutes)

1. Go to **[neon.tech](https://neon.tech)** and click **Sign Up** (use GitHub or Google).
2. Click **Create Project**:
   - **Project Name:** `saathspace`
   - **Postgres Version:** 16, 17, or 18 (default is fine)
   - **Region:** Choose the region closest to you (e.g. `AWS - us-east-2` or `ap-southeast-1` / `eu-central-1`).
3. Neon will display your **Connection Details**:
   - Select **Connection string** format.
   - It looks like:
     ```text
     postgresql://neondb_owner:npg_AbCd1234@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Click **Copy**.

---

## Step 2: Transfer Your 12,847 Listings to the Cloud (1 Minute)

We have created an automated deployment tool that restores schemas, tables, users, and all 12,847 cleaned listings directly into your cloud database.

### Method A: One-Click Batch Script
Double-click:
```text
C:\Users\Lenovo\Desktop\Projects\SaathSpace\deploy_cloud_db.bat
```
Paste your Neon database connection URL when prompted and press Enter.

### Method B: Terminal Command
Open PowerShell or Command Prompt:
```powershell
cd C:\Users\Lenovo\Desktop\Projects\SaathSpace
python scripts\deploy_database.py "postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz.neon.tech/neondb?sslmode=require"
```

The script will restore `backup/saathspace_phase1.backup` and automatically verify that:
- `app` and `staging` schemas exist.
- `app.listing` contains all 12,847 records.
- All 4 demo personas and reference data are active.

---

## Step 3: Push Your Code to GitHub (2 Minutes)

A Git repository has already been initialized in your project folder with all sensitive credentials (`.env`) safely protected.

1. Open **[github.com/new](https://github.com/new)** in your browser.
2. Create a new repository named `SaathSpace` (public or private).
3. In your local terminal, link and push:
   ```powershell
   cd C:\Users\Lenovo\Desktop\Projects\SaathSpace
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/SaathSpace.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 4: Deploy the Backend API on Render (3 Minutes)

1. Sign in to **[render.com](https://render.com)** (sign in with GitHub).
2. Click **New +** in the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your `SaathSpace` repo.
4. Configure the service:
   - **Name:** `saathspace-api`
   - **Language:** `Python 3`
   - **Region:** Select the same region as your Neon database.
   - **Branch:** `main`
   - **Root Directory:** *(leave empty or set `backend`)*
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
   - **Instance Type:** `Free`
5. Click **Environment Variables** and add the following keys:
   | Key | Value | Description |
   |---|---|---|
   | `DATABASE_URL` | *(Your Neon connection string from Step 1)* | Database URL with SSL |
   | `FLASK_ENV` | `production` | Enables production optimizations |
   | `SECRET_KEY` | `your_secret_random_string` | Used for session cookie signing |
   | `SESSION_COOKIE_SECURE` | `true` | Enforces HTTPS cookies |
   | `SESSION_COOKIE_SAMESITE` | `None` | Allows cross-origin session cookies |
   | `CORS_ORIGINS` | `https://*.vercel.app,http://localhost:5173` | Allows Vercel frontend |
6. Click **Deploy Web Service**.
7. Once deployment finishes (typically 2–3 minutes), copy your backend URL:
   ```text
   https://saathspace-api.onrender.com
   ```
8. Verify it works by opening in your browser: `https://saathspace-api.onrender.com/api/health`. You will see `status: healthy` and `historical_listings: 12847`.

---

## Step 5: Deploy the Frontend on Vercel (2 Minutes)

1. Sign in to **[vercel.com](https://vercel.com)** (sign in with GitHub).
2. Click **Add New...** → **Project**.
3. Import your `SaathSpace` repository from GitHub.
4. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose `frontend`.
   - **Build and Output Settings:** Leave default (`npm run build`, `dist`).
5. Open **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://saathspace-api.onrender.com` |
   *(Replace with your actual Render backend URL from Step 4)*
6. Click **Deploy**.
7. Vercel will build and deploy your site in ~45 seconds and give you a live production URL:
   ```text
   https://saathspace.vercel.app
   ```

---

## Step 6: Test Your Live Application!

Visit your new live URL (`https://saathspace.vercel.app`):
1. **Explore Room Discovery:** Filter and search across the 12,847 cleaned listings in Delhi, Mumbai, and Pune.
2. **Demo Persona Logins:** Use the navbar demo switcher to log in instantly as Aarav, Diya, Kabir, or Mira.
3. **Roommate Compatibility:** View 100-point compatibility score breakdowns and send connection requests.
4. **Owner Portal:** Switch to Host Portal and publish a new room listing with verified availability.
5. **Admin Analytics:** Check live aggregation metrics and price charts.

---

## Summary of Files Prepared for Deployment

- [render.yaml](file:///c:/Users/Lenovo/Desktop/Projects/SaathSpace/render.yaml): Blueprint configuration for Render web service.
- [Procfile](file:///c:/Users/Lenovo/Desktop/Projects/SaathSpace/Procfile): WSGI process declaration for cloud platforms.
- [wsgi.py](file:///c:/Users/Lenovo/Desktop/Projects/SaathSpace/wsgi.py): Production WSGI entrypoint with Gunicorn.
- [vercel.json](file:///c:/Users/Lenovo/Desktop/Projects/SaathSpace/vercel.json): Vercel SPA routing and build configuration.
- [frontend/vercel.json](file:///c:/Users/Lenovo/Desktop/Projects/SaathSpace/frontend/vercel.json): Subdirectory Vercel deployment configuration.
- [scripts/deploy_database.py](file:///c:/Users/Lenovo/Desktop/Projects/SaathSpace/scripts/deploy_database.py): Automated cloud PostgreSQL restore and verification tool.
- [deploy_cloud_db.bat](file:///c:/Users/Lenovo/Desktop/Projects/SaathSpace/deploy_cloud_db.bat): 1-click batch launcher for database cloud migration.
