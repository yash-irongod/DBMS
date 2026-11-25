-- SaathSpace: load cleaned public rental listings into the normalized app schema.
-- Run this in pgAdmin Query Tool while connected to database `saathspace`.
-- It does NOT modify staging.rental_listings_raw or the cleaned view.
-- Historical public listings are imported as `unverified`, never as currently available.

BEGIN;

-- Make the import repeatable: one imported source row per source file + row number.
CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_source_record
    ON app.listing (source_file, source_row_number);

-- Add localities seen in the cleaned rental view. Normalize casing/spacing consistently.
INSERT INTO app.locality (city_id, locality_name)
SELECT DISTINCT
    c.city_id,
    INITCAP(LOWER(BTRIM(v.location))) AS locality_name
FROM staging.v_rental_listings_cleaned AS v
JOIN app.city AS c
  ON LOWER(BTRIM(c.city_name)) = LOWER(BTRIM(v.city))
WHERE NULLIF(BTRIM(v.location), '') IS NOT NULL
ON CONFLICT (city_id, locality_name) DO NOTHING;

-- Parse the source's text fields into numeric fields safely.
WITH parsed AS (
    SELECT
        v.*,
        NULLIF(REGEXP_REPLACE(BTRIM(v.price), '[^0-9.]', '', 'g'), '')::NUMERIC AS parsed_rent,
        NULLIF(REGEXP_REPLACE(BTRIM(v.house_size), '[^0-9.]', '', 'g'), '')::NUMERIC AS parsed_size,
        NULLIF(REGEXP_REPLACE(BTRIM(v.num_bathrooms), '[^0-9.]', '', 'g'), '')::NUMERIC AS parsed_bathrooms,
        NULLIF(REGEXP_REPLACE(BTRIM(v.num_balconies), '[^0-9.]', '', 'g'), '')::NUMERIC AS parsed_balconies,
        NULLIF(REGEXP_REPLACE(BTRIM(v.latitude), '[^0-9.-]', '', 'g'), '')::NUMERIC AS parsed_latitude,
        NULLIF(REGEXP_REPLACE(BTRIM(v.longitude), '[^0-9.-]', '', 'g'), '')::NUMERIC AS parsed_longitude
    FROM staging.v_rental_listings_cleaned AS v
), prepared AS (
    SELECT
        p.*,
        CASE
            WHEN p.parsed_latitude BETWEEN -90 AND 90
             AND p.parsed_longitude BETWEEN -180 AND 180
            THEN p.parsed_latitude
            ELSE NULL
        END AS safe_latitude,
        CASE
            WHEN p.parsed_latitude BETWEEN -90 AND 90
             AND p.parsed_longitude BETWEEN -180 AND 180
            THEN p.parsed_longitude
            ELSE NULL
        END AS safe_longitude,
        NULLIF(SUBSTRING(UPPER(BTRIM(p.house_type)) FROM '([0-9]+)\s*BHK'), '')::SMALLINT AS parsed_bedrooms,
        CASE
            WHEN LOWER(BTRIM(p.furnishing_status)) = 'furnished' THEN 'furnished'
            WHEN LOWER(BTRIM(p.furnishing_status)) = 'semi-furnished' THEN 'semi_furnished'
            WHEN LOWER(BTRIM(p.furnishing_status)) = 'unfurnished' THEN 'unfurnished'
            ELSE 'unknown'
        END AS normalized_furnishing,
        CASE
            WHEN LOWER(BTRIM(p.house_type)) LIKE '%pg%'
              OR LOWER(BTRIM(p.house_type)) LIKE '%hostel%' THEN 'pg_hostel'
            WHEN LOWER(BTRIM(p.house_type)) LIKE '%shared room%' THEN 'shared_room'
            WHEN LOWER(BTRIM(p.house_type)) LIKE '%private room%' THEN 'private_room'
            ELSE 'entire_unit'
        END AS normalized_listing_kind
    FROM parsed AS p
)
INSERT INTO app.listing (
    owner_user_id,
    locality_id,
    title,
    listing_kind,
    source_property_type,
    rent_amount,
    rent_period,
    security_deposit,
    size_sqft,
    bedrooms,
    bathrooms,
    balconies,
    furnishing_status,
    description,
    latitude,
    longitude,
    availability_status,
    data_origin,
    source_file,
    source_row_number,
    last_verified_at
)
SELECT
    NULL AS owner_user_id,
    l.locality_id,
    LEFT(COALESCE(NULLIF(BTRIM(p.house_type), ''), 'Rental property') || ' in ' || l.locality_name, 180),
    p.normalized_listing_kind,
    NULLIF(BTRIM(p.house_type), ''),
    p.parsed_rent,
    'monthly',
    NULL AS security_deposit, -- source deposit values are inconsistent; keep the raw source unchanged
    CASE WHEN p.parsed_size > 0 THEN p.parsed_size ELSE NULL END,
    p.parsed_bedrooms,
    CASE WHEN p.parsed_bathrooms BETWEEN 0 AND 32767 THEN p.parsed_bathrooms::SMALLINT ELSE NULL END,
    CASE WHEN p.parsed_balconies BETWEEN 0 AND 32767 THEN p.parsed_balconies::SMALLINT ELSE NULL END,
    p.normalized_furnishing,
    NULLIF(BTRIM(p.description), ''),
    p.safe_latitude,
    p.safe_longitude,
    'unverified',
    'public_dataset',
    p.source_file,
    p.source_row_number,
    NULL AS last_verified_at
FROM prepared AS p
JOIN app.city AS c
  ON LOWER(BTRIM(c.city_name)) = LOWER(BTRIM(p.city))
JOIN app.locality AS l
  ON l.city_id = c.city_id
 AND l.locality_name = INITCAP(LOWER(BTRIM(p.location)))
WHERE p.parsed_rent > 0
ON CONFLICT (source_file, source_row_number) DO NOTHING;

COMMIT;

-- Verification: target count should be 12,847 on a fresh database.
SELECT COUNT(*) AS imported_listing_count
FROM app.listing
WHERE data_origin = 'public_dataset';

-- Verify city totals in the application schema.
SELECT c.city_name, COUNT(*) AS listing_count
FROM app.listing AS li
JOIN app.locality AS lo ON lo.locality_id = li.locality_id
JOIN app.city AS c ON c.city_id = lo.city_id
WHERE li.data_origin = 'public_dataset'
GROUP BY c.city_name
ORDER BY c.city_name;

-- Verify imported public listings are not mistakenly shown as currently available.
SELECT availability_status, COUNT(*) AS listing_count
FROM app.listing
WHERE data_origin = 'public_dataset'
GROUP BY availability_status
ORDER BY availability_status;
