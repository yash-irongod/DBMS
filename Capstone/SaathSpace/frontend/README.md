# SaathSpace — Frontend Web Application

The client-side single page application for SaathSpace, built with React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, and Recharts.

## Architecture

- **Framework:** React 19 + TypeScript
- **Bundler / Dev Server:** Vite 6 with proxy to Flask backend (`/api` -> `http://127.0.0.1:5000`)
- **Styling:** Tailwind CSS with custom proptech color palette (`forest`, `cream`, `warm`, `terracotta`)
- **Typography:** Plus Jakarta Sans & Lora
- **Data Visualization:** Recharts
- **Icons:** Lucide React

## Project Structure

```text
frontend/src/
├── components/          # Reusable UI widgets
│   ├── Badge.tsx        # Status & origin indicator badges
│   ├── EmptyState.tsx   # Empty state placeholder with icons
│   ├── Footer.tsx       # Proptech brand footer
│   ├── ListingCard.tsx  # Property cards with badges & bookmarking
│   ├── LoadingSpinner.tsx # Consistent loading animations
│   ├── Navbar.tsx       # Navigation bar with 1-click Demo Persona switcher
│   └── RoommateCard.tsx # Compatibility score breakdown card
├── context/
│   └── AuthContext.tsx  # User session state & demo quick-switcher
├── pages/
│   ├── AdminPage.tsx    # DBMS statistics, price charts & schema audits
│   ├── DashboardPage.tsx # User profile, saved listings & connection requests
│   ├── HomePage.tsx     # Hero search, metro highlights & featured rooms
│   ├── ListingDetailPage.tsx # Property details, inquiry form & host contact
│   ├── ListingsPage.tsx # Discovery catalog with multi-facet filters & sorting
│   ├── LoginPage.tsx    # Secure user login
│   ├── OwnerDashboardPage.tsx # Property host portal (listings, amenities, enquiries)
│   ├── RegisterPage.tsx # User registration
│   └── RoommatesPage.tsx # 100-point compatibility roommate finder
├── services/
│   └── api.ts           # Typed API service with session cookie credentials
├── types/
│   └── index.ts         # TypeScript schema definitions matching PostgreSQL tables
├── App.tsx              # Application router
├── index.css            # Tailwind directives & typography
└── main.tsx             # DOM mounting entrypoint
```

## Running the Frontend

### Development Server
```bash
npm install
npm run dev
```
The development server will be available at `http://localhost:5173`.

### Production Build
```bash
npm run build
```
Generates optimized static assets into `frontend/dist/`.
