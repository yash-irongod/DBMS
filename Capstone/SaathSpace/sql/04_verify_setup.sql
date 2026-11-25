-- SaathSpace: beginner-friendly verification queries.
-- Connect to the saathspace database and run each SELECT separately for clear results.

-- 1. Confirm the active database and server version.
SELECT current_database() AS connected_database, version() AS postgres_version;

-- 2. Count staged rental records. Expected after one successful import: 13910.
SELECT COUNT(*) AS staged_rental_rows
FROM staging.rental_listings_raw;

-- 3. Confirm city counts. Expected: Delhi 5000, Mumbai 5000, Pune 3910.
SELECT city, COUNT(*) AS listing_rows
FROM staging.rental_listings_raw
GROUP BY city
ORDER BY city;

-- 4. Inspect several source rows (do not treat the unverified listings as currently available).
SELECT staging_id, source_file, source_row_number, city, location,
       house_type, price, currency, furnishing_status
FROM staging.rental_listings_raw
ORDER BY staging_id
LIMIT 10;

-- 5. Confirm reference values exist in the app schema.
SELECT city_id, city_name
FROM app.city
ORDER BY city_name;

SELECT amenity_id, amenity_name
FROM app.amenity
ORDER BY amenity_name;

-- 6. Basic raw-data quality indicators. These are diagnostic counts only;
-- do not clean or delete raw staging data directly.
SELECT
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(city), '') IS NULL OR LOWER(BTRIM(city)) = 'null') AS missing_city_rows,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(location), '') IS NULL OR LOWER(BTRIM(location)) = 'null') AS missing_location_rows,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(price), '') IS NULL OR LOWER(BTRIM(price)) = 'null') AS missing_price_rows,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(latitude), '') IS NULL OR LOWER(BTRIM(latitude)) = 'null') AS missing_latitude_rows,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(longitude), '') IS NULL OR LOWER(BTRIM(longitude)) = 'null') AS missing_longitude_rows
FROM staging.rental_listings_raw;
