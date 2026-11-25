# SaathSpace — Phase 1 Planning & Dataset Audit

**Date:** 22 October 2026  
**Project:** SaathSpace — Smart Room & Roommate Finder Database  
**Phase status:** Planning and data feasibility

## 1. Project statement

**SaathSpace — A database-driven platform for discovering suitable rental rooms and compatible roommates based on location, budget, amenities, and lifestyle preferences.**

## 2. Product goal

Build a manageable DBMS capstone that supports two connected tasks:

1. Search and compare rental listings using location, budget, property/room type, size, furnishing, and amenities.
2. Help users discover compatible roommates using transparent preference matching (budget, move-in timing, smoking/pets, food preferences, sleep schedule, cleanliness, and similar lifestyle criteria).

The relational database is the core of the project. The web interface is a later layer over the database, not a replacement for demonstrating SQL, relationships, constraints, and data quality.

## 3. Technology decisions

### Database: PostgreSQL 18.x (stable)

Use the latest stable PostgreSQL 18 minor release offered by the official installer; the official release page lists 18.6 as a supported release. Do **not** use PostgreSQL 19 RC for the project: as of 22 October 2026, it is a release candidate and its planned general availability is 19 November 2026.

- **Local database:** PostgreSQL
- **GUI:** pgAdmin 4 (installed with PostgreSQL) or DBeaver Community
- **Database name:** `saathspace`
- **Development method:** SQL-first in version-controlled `.sql` files

Why PostgreSQL: free/open source, robust primary/foreign keys and constraints, transactions, views, indexing, and a strong fit for a relational DBMS demonstration.

Official references:
- https://www.postgresql.org/download/
- https://www.postgresql.org/support/versioning/
- https://www.postgresql.org/about/news/postgresql-19-rc-1-released-3409/

### Application (later phase)

- **Frontend:** React + Vite
- **Backend API:** Python Flask
- **Database access:** PostgreSQL driver through the backend; the frontend must not connect directly to PostgreSQL.

This is a deliberately familiar, low-friction stack. The database schema and SQL deliverables will be completed and tested before building the full UI.

## 4. Dataset archive audited

Uploaded archive: `archive.zip`  
Files found:

- `Indian_housing_Delhi_data.csv`
- `Indian_housing_Mumbai_data.csv`
- `Indian_housing_Pune_data.csv`

### Per-file summary

| City | Rows | Exact duplicate rows detected | Unique locality values | Median listed price (raw numeric value) | Median size (sq ft, parsed) |
|---|---:|---:|---:|---:|---:|
| Delhi | 5,000 | 466 | 288 | ₹125,000 | 2,500 |
| Mumbai | 5,000 | 371 | 189 | ₹40,000 | 900 |
| Pune | 3,910 | 226 | 225 | ₹18,000 | 980 |
| **Total** | **13,910** | **1,063** | — | — | — |

The price figures above describe the raw dataset, not current market prices. They should not be presented as current rents or used as a reliable market comparison without additional checks.

### Source columns (16)

`house_type`, `house_size`, `location`, `city`, `latitude`, `longitude`, `price`, `currency`, `numBathrooms`, `numBalconies`, `isNegotiable`, `priceSqFt`, `verificationDate`, `description`, `SecurityDeposit`, `Status`.

### Data-quality findings

- 1,063 exact duplicate rows were found across the three files. Another 15 rows were detected as potential duplicates when comparing normalized listing fields while ignoring relative posting-age text; these should be reviewed before final deduplication.
- `priceSqFt` is missing in all 13,910 rows, so it should not be used as a source field.
- `isNegotiable` is missing in 12,634 rows (about 90.8%).
- `numBalconies` is missing in 8,619 rows (about 62.0%).
- `description` is missing in 831 rows (about 6.0%).
- `numBathrooms` is missing in 56 rows (about 0.4%).
- `house_type` has inconsistent whitespace; `house_size` is text such as `400 sq ft` and needs numeric parsing.
- `verificationDate` contains relative labels such as `Posted 2 years ago`, not a reliable absolute timestamp.
- The archive has no dedicated availability date/status, clean amenity list, owner identity, or roommate preference data.
- The dataset is property/listing-oriented and includes complete apartments, independent floors and other property types, not just individual rooms.
- The CSV files do not contain a separate license/readme file. Verify the Kaggle dataset's current license and attribution requirements before redistributing the raw files in a public repository.

## 5. Dataset decision

**Keep the archive as a useful seed/staging dataset, but do not treat it as a live rental feed.**

Recommended handling:

1. Preserve the three raw CSVs unchanged as source data.
2. The starter pack now includes a combined staging CSV that retains all source values/duplicates, standardizes only the column headers, and adds `source_file`, `source_row_number`, and `import_batch` for traceability. Import it into the raw staging table.
3. Normalize whitespace, parse the size into a numeric `size_sqft`, parse prices into a numeric type, normalize furnishing/status values, and represent source nulls as SQL `NULL`.
4. Flag duplicates first. Remove only duplicates that meet a documented rule; keep the raw staging data so changes can be audited.
5. Add application-owned fields such as `listing_kind`, `availability_status`, `last_verified_at`, and `data_origin`. Imported historical records must be labelled as unverified/sample listings until someone verifies them.
6. Generate clearly synthetic user profiles, roommate preferences, enquiries, matches, and booking test records. Do not present synthetic people or generated availability as real users or real available rooms.
7. Make listing freshness visible in the eventual UI. Do not claim that an old imported listing is currently available.

## 6. Proposed MVP scope

### Must build

- Search/filter rental listings by city, locality, budget, property/room type, size and furnishing.
- Store listing attributes and availability state managed by the application.
- Store and update user/roommate preference profiles.
- Compute a transparent rule-based roommate compatibility score.
- Save listings and submit enquiries.
- Manage listings and their availability status.
- Provide SQL analytics: rent ranges by locality, furnished vs unfurnished counts, available listing counts, popular amenities and match candidates.

### Not required in the first version

- Payments, chat, map routing, live property scraping, identity-verification workflows, recommendation AI, or a production-scale deployment.

## 7. Initial relational entities (draft only; not final schema)

1. `users`
2. `cities`
3. `localities`
4. `property_listings`
5. `amenities`
6. `listing_amenities`
7. `roommate_profiles`
8. `roommate_preferences` (or preference rows, if that keeps normalization clearer)
9. `saved_listings`
10. `enquiries`
11. `bookings` (only if booking is in the agreed scope)
12. `reviews` (optional)

Detailed entity attributes, primary keys, foreign keys, cardinalities and normalization will be decided in Phase 2. This list is not a commitment to implement every table.

## 8. SQL-first repository layout

```text
saathspace/
├── docs/
│   ├── phase1-planning-and-data-audit.md
│   └── er-diagram.png
├── data/
│   ├── raw/                 # original files; don't edit in place
│   └── processed/           # cleaned/import-ready data
├── sql/
│   ├── 00_create_database.sql
│   ├── 01_create_schema.sql
│   ├── 02_reference_data.sql
│   ├── 03_import_staging.sql
│   ├── 04_clean_transform.sql
│   ├── 05_constraints_indexes.sql
│   ├── 06_views_and_analytics.sql
│   └── 07_test_queries.sql
├── backend/                 # later: Flask API
├── frontend/                # later: React + Vite
└── README.md
```

## 9. Phase gates

### Phase 1 — Planning and data feasibility
- [x] Confirm project direction and name
- [x] Inspect uploaded CSV archive
- [x] Select database and propose application stack
- [x] Record limitations and data-cleaning strategy
- [ ] Confirm course requirements with instructor if there are required ERD/normalization/SQL deliverables

### Phase 2 — ER model and schema design
- Define precise requirements and use cases.
- Draw the ER diagram and cardinalities.
- Identify primary/foreign keys and participation constraints.
- Normalize relations to at least 3NF where appropriate.
- Review the model before writing the final create-table scripts.

### Phase 3 — Database implementation
- Create PostgreSQL schema and constraints.
- Build repeatable staging/import scripts.
- Add seed reference data and synthetic demo profiles.
- Implement and test joins, aggregates, views, transactions and indexes.

### Phase 4 — Web application
- Add Flask endpoints and a React interface after the core database is stable.

## 10. Next concrete task

Start Phase 2 by defining 5–7 user journeys and translating them into an ER diagram. In parallel, build a reproducible import/cleaning pipeline for the archive. Do not finalize the schema based solely on the raw CSV columns; the schema should reflect the product's relationships, not merely copy the source file.
