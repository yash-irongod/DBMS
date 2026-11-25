# SaathSpace — Smart Room & Roommate Finder

> **Find your space. Find your people.**

SaathSpace is a full-stack proptech platform designed for discovering verified rental rooms and matching with lifestyle-compatible roommates across **Delhi**, **Mumbai**, and **Pune**.

Built on a relational database (**PostgreSQL 18**), SaathSpace features a Python Flask REST API backed by Psycopg 3 connection pooling, paired with a React + Vite TypeScript frontend styled with Tailwind CSS, Lucide icons, and Recharts analytics.

---

## Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | Responsive proptech UI, Lucide icons, Recharts analytics, React Router |
| **Backend API** | Python 3, Flask 3, Werkzeug | RESTful endpoints, secure HTTP-only cookies, parameterized SQL |
| **Database** | PostgreSQL 18.x (`saathspace`) | 10 core 3NF tables in `app`, raw & cleaned data in `staging` |
| **Driver / Pooling** | Psycopg 3 (`psycopg[binary,pool]`) | Robust connection pool with JSON serialization |
| **Test Suite** | Pytest | Automated end-to-end API integration tests |

---

## Quick Start Guide (Windows)

### Option A: One-Click Launch (Easiest)

Simply double-click **`start_all.bat`** in the project root folder.
This will automatically:
1. Open the **Flask Backend API** in a titled terminal window on `http://localhost:5000`.
2. Open the **Vite React Frontend** in a titled terminal window on `http://localhost:5173`.
3. Open your browser to **`http://localhost:5173`**.

You can also run the individual scripts directly:
- `start_backend.bat` — Starts the Flask REST API
- `start_frontend.bat` — Starts the Vite frontend dev server

---

### Option B: Manual Terminal Launch

#### Prerequisites
- **Python 3.10+** (Python 3.14 tested)
- **Node.js v20+** and npm
- **PostgreSQL 18** running locally on port 5432 with database `saathspace`

---

#### Step 1 — Backend Setup & Run

Open a Windows terminal (PowerShell or Command Prompt):

```powershell
# Navigate to the backend directory
cd C:\Users\Lenovo\Desktop\Projects\SaathSpace\backend

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Configure your local database credentials
# Copy .env.example to .env and adjust DB_PASSWORD if necessary:
copy .env.example .env

# Run the automated backend test suite (12 tests)
python -m pytest tests/ -W ignore

# Start the Flask backend server (runs on http://localhost:5000)
python run.py
```

---

### Step 2 — Frontend Setup & Run

Open a **second** Windows terminal:

```powershell
# Navigate to the frontend directory
cd C:\Users\Lenovo\Desktop\Projects\SaathSpace\frontend

# Install dependencies (if not already installed)
npm install

# Verify the TypeScript production build
npm run build

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## Seed Test Personas & Demo Accounts

For instant 1-click test drive, use the **"Demo Personas"** switcher in the navbar or log in directly with any of the 4 Phase 1 accounts:

| Full Name | Demo Email | Password | Target City | Lifestyle Profile |
|---|---|---|---|---|
| **Aarav Demo** | `aarav.demo@example.test` | `Demo@123` | Delhi (₹8k–₹15k) | Vegetarian, Non-smoker, No pets, Night owl |
| **Diya Demo** | `diya.demo@example.test` | `Demo@123` | Delhi (₹9k–₹16k) | Vegetarian, Non-smoker, No pets, Very clean |
| **Kabir Demo** | `kabir.demo@example.test` | `Demo@123` | Pune (₹7k–₹12k) | Non-veg, Smoker OK, Pets OK, Regular sleep |
| **Mira Demo** | `mira.demo@example.test` | `Demo@123` | Mumbai (₹12k–₹22k) | Vegan, Non-smoker, Early riser, Very clean |

*You can also create a new account anytime via `/register`.*

---

## Core Application Modules & User Journeys

1. **Public Home Page (`/`)**
   - Hero room search by city, property kind, and maximum budget.
   - Metro city cards showing average listed rents and catalogued room counts.
   - Curated featured listings with unverified/verified status indicators.
   - Roommate compatibility feature callout and transparent scoring explanation.

2. **Room Discovery (`/listings`)**
   - Search across 12,847 cleaned listings.
   - Multi-dimensional filters: City, Locality, Rent Range, Room Type, Bedrooms, Furnishing status, Confirmed Amenities, and Inventory Origin.
   - Sorting by Price (asc/desc), Property Size, Newest, or Verified First.
   - Badge distinction: `"Historical listing — availability not verified"` for public dataset entries vs `"Verified & Available"` for owner listings.

3. **Property Details & Host Contact (`/listings/:id`)**
   - Full room specifications, description, and confirmed amenities.
   - One-click bookmarking / saved listing toggle.
   - Inquire form submitting directly to `app.enquiry`.
   - Data provenance card displaying exact source database information.

4. **Roommate Finder (`/roommates`)**
   - Rule-based 100-point compatibility scoring:
     - **City Match (25 Pts)**
     - **Budget Overlap (25 Pts)**
     - **Food & Diet (15 Pts)**
     - **Smoking Policy (10 Pts)**
     - **Pet Policy (10 Pts)**
     - **Sleep Schedule (10 Pts)**
     - **Cleanliness Standard (5 Pts)**
   - Click "Breakdown" to view exact category points.
   - Interactive connection requests (`app.roommate_request`) with duplicate prevention.

5. **User Dashboard (`/dashboard`)**
   - Manage lifestyle preferences (updates `app.roommate_profile`).
   - Saved properties management with one-click unsave.
   - Sent enquiries and status tracking (`new`, `responded`, `closed`).
   - Incoming & outgoing roommate connection requests (Accept, Decline, or Cancel).

6. **Property Host Portal (`/owner`)**
   - Publish new rental spaces with real owner binding (`owner_user_id`).
   - Select and confirm standard amenities (populates `app.listing_amenity`).
   - Switch availability status (`available`, `reserved`, `unavailable`, `inactive`).
   - Host Inbox: view tenant enquiries and update enquiry statuses.

7. **DBMS Analytics & Auditing (`/admin`)**
   - Live query metrics across `app` and `staging` schemas.
   - Recharts visualizations: Average rents by city, property kinds, availability status.
   - Strict statistical segregation of historical unverified records vs live owner inventory.

---

## Project Structure & Provenance

```text
SaathSpace/
├── start_all.bat                  # One-click launcher for both backend & frontend
├── start_backend.bat              # Standalone launcher for Flask API (Port 5000)
├── start_frontend.bat             # Standalone launcher for Vite Frontend (Port 5173)
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment configuration & DB connection string
│   │   ├── db.py                  # Psycopg 3 connection pool & dict_row serialization
│   │   ├── auth.py                # Werkzeug password hashing & session management
│   │   └── routes/
│   │       ├── health.py          # /api/health
│   │       ├── reference.py       # /api/reference/cities, localities, amenities
│   │       ├── auth.py            # /api/auth/register, login, logout, me, demo-users
│   │       ├── listings.py        # /api/listings, featured, details, save, enquiry
│   │       ├── roommates.py       # /api/roommates, profile, request
│   │       ├── dashboard.py       # /api/dashboard/summary
│   │       ├── owner.py           # /api/owner/listings, availability, enquiries
│   │       └── admin.py           # /api/admin/analytics
│   ├── tests/
│   │   ├── conftest.py            # Pytest test client fixtures
│   │   └── test_api.py            # 12 automated API tests
│   ├── .env.example               # Backend environment template
│   ├── .env                       # Local environment variables (gitignored)
│   ├── requirements.txt           # Python backend dependencies
│   └── run.py                     # Backend entrypoint (Port 5000)
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, Footer, ListingCard, RoommateCard, Badge
│   │   ├── pages/                 # Home, Listings, Detail, Roommates, Dashboards, Admin, Auth
│   │   ├── context/               # AuthContext with session sync
│   │   ├── services/api.ts        # Typed API client
│   │   ├── types/index.ts         # TypeScript schema interfaces
│   │   ├── App.tsx                # Client-side router
│   │   └── index.css              # Tailwind CSS directives
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts             # Proxy /api to backend
├── sql/                           # Phase 1 & 2 SQL migration and verification scripts
├── docs/                          # Setup guides, ERD diagrams, and planning audits
└── data/processed/                # rental_listings_staging.csv (13,910 rows)
```

---

## Data Governance & Integrity Rules

- **Strict Non-Destructive Operation:** Existing tables in `app`, `staging`, and `public` are strictly preserved.
- **Provenance Transparency:** The 12,847 imported listings are marked `data_origin='public_dataset'` and `availability_status='unverified'`. Online booking is blocked on historical listings to ensure data truthfulness.
- **Verified Listings:** Only listings created through the Property Host Portal have a real `owner_user_id` and verified availability.
