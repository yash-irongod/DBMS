-- View: staging.v_rental_listings_cleaned

-- DROP VIEW staging.v_rental_listings_cleaned;

CREATE OR REPLACE VIEW staging.v_rental_listings_cleaned
 AS
 WITH normalized AS (
         SELECT rental_listings_raw.staging_id,
            rental_listings_raw.source_file,
            rental_listings_raw.source_row_number,
            rental_listings_raw.import_batch,
            rental_listings_raw.imported_at,
            btrim(rental_listings_raw.house_type) AS house_type,
            btrim(rental_listings_raw.house_size) AS house_size,
            btrim(rental_listings_raw.location) AS location,
                CASE
                    WHEN rental_listings_raw.source_file::text ~~* '%Mumbai%'::text AND lower(btrim(rental_listings_raw.city)) = 'hisar'::text THEN 'Mumbai'::text
                    ELSE btrim(rental_listings_raw.city)
                END AS city,
            btrim(rental_listings_raw.latitude) AS latitude,
            btrim(rental_listings_raw.longitude) AS longitude,
            btrim(rental_listings_raw.price) AS price,
            lower(btrim(rental_listings_raw.currency)) AS currency,
            btrim(rental_listings_raw.num_bathrooms) AS num_bathrooms,
            btrim(rental_listings_raw.num_balconies) AS num_balconies,
            lower(btrim(rental_listings_raw.is_negotiable)) AS is_negotiable,
            btrim(rental_listings_raw.price_sq_ft) AS price_sq_ft,
            btrim(rental_listings_raw.verification_date) AS verification_date,
            btrim(rental_listings_raw.description) AS description,
            btrim(rental_listings_raw.security_deposit) AS security_deposit,
            lower(btrim(rental_listings_raw.furnishing_status)) AS furnishing_status
           FROM staging.rental_listings_raw
        ), ranked AS (
         SELECT normalized.staging_id,
            normalized.source_file,
            normalized.source_row_number,
            normalized.import_batch,
            normalized.imported_at,
            normalized.house_type,
            normalized.house_size,
            normalized.location,
            normalized.city,
            normalized.latitude,
            normalized.longitude,
            normalized.price,
            normalized.currency,
            normalized.num_bathrooms,
            normalized.num_balconies,
            normalized.is_negotiable,
            normalized.price_sq_ft,
            normalized.verification_date,
            normalized.description,
            normalized.security_deposit,
            normalized.furnishing_status,
            row_number() OVER (PARTITION BY (lower(normalized.city)), (lower(normalized.location)), (lower(normalized.house_type)), (lower(normalized.house_size)), normalized.price, (lower(normalized.currency)), normalized.latitude, normalized.longitude, normalized.num_bathrooms, normalized.num_balconies, (lower(normalized.is_negotiable)), normalized.price_sq_ft, normalized.verification_date, (lower(normalized.description)), normalized.security_deposit, (lower(normalized.furnishing_status)) ORDER BY normalized.staging_id) AS duplicate_rank
           FROM normalized
        )
 SELECT staging_id,
    source_file,
    source_row_number,
    import_batch,
    imported_at,
    house_type,
    house_size,
    location,
    city,
    latitude,
    longitude,
    price,
    currency,
    num_bathrooms,
    num_balconies,
    is_negotiable,
    price_sq_ft,
    verification_date,
    description,
    security_deposit,
    furnishing_status
   FROM ranked
  WHERE duplicate_rank = 1;

ALTER TABLE staging.v_rental_listings_cleaned
    OWNER TO postgres;

-- -----------------------------------------------------------------------------
-- Verification: Confirm expected count of cleaned, deduplicated records.
-- Expected count: 12,847 rows (13,910 raw staging rows minus 1,063 duplicates).
-- Expected city distribution:
--   - Delhi:  4,534 rows (5,000 raw - 466 duplicates)
--   - Mumbai: 4,629 rows (5,000 raw - 371 duplicates + Hisar mapped to Mumbai)
--   - Pune:   3,684 rows (3,910 raw - 226 duplicates)
-- -----------------------------------------------------------------------------
SELECT COUNT(*) AS cleaned_listing_count
FROM staging.v_rental_listings_cleaned;

SELECT city, COUNT(*) AS cleaned_city_count
FROM staging.v_rental_listings_cleaned
GROUP BY city
ORDER BY city;
