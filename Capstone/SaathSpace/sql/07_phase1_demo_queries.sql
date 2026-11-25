-- SaathSpace Phase 1 demonstration queries
-- Run the statements one at a time (highlight one query and press F5).
-- Imported public listings are historical/unverified. Do not describe them as currently available.

-- DEMO 1 — Overview: raw vs cleaned vs loaded records.
SELECT
    (SELECT COUNT(*) FROM staging.rental_listings_raw) AS raw_rows,
    (SELECT COUNT(*) FROM staging.v_rental_listings_cleaned) AS cleaned_view_rows,
    (SELECT COUNT(*) FROM app.listing WHERE data_origin = 'public_dataset') AS loaded_app_listings;

-- DEMO 2 — Data integrity and status checks.
SELECT
    COUNT(*) AS imported_listings,
    COUNT(*) FILTER (WHERE rent_amount <= 0) AS invalid_rent_rows,
    COUNT(*) FILTER (WHERE size_sqft IS NOT NULL AND size_sqft <= 0) AS invalid_size_rows,
    COUNT(*) FILTER (WHERE availability_status <> 'unverified') AS not_unverified_rows
FROM app.listing
WHERE data_origin = 'public_dataset';

-- DEMO 3 — Search: Delhi dataset records priced up to Rs 15,000.
-- All returned public-dataset records are marked unverified; this is a search demo, not a live feed.
SELECT
    li.listing_id,
    c.city_name,
    lo.locality_name,
    li.title,
    li.rent_amount,
    li.size_sqft,
    li.furnishing_status,
    li.availability_status
FROM app.listing AS li
JOIN app.locality AS lo ON lo.locality_id = li.locality_id
JOIN app.city AS c ON c.city_id = lo.city_id
WHERE c.city_name = 'Delhi'
  AND li.data_origin = 'public_dataset'
  AND li.rent_amount <= 15000
ORDER BY li.rent_amount ASC
LIMIT 10;

-- DEMO 4 — Aggregation: count and price summary by city.
-- This describes the imported dataset, not current market prices.
SELECT
    c.city_name,
    COUNT(*) AS listing_count,
    ROUND(AVG(li.rent_amount), 0) AS average_listed_price,
    MIN(li.rent_amount) AS minimum_listed_price,
    MAX(li.rent_amount) AS maximum_listed_price
FROM app.listing AS li
JOIN app.locality AS lo ON lo.locality_id = li.locality_id
JOIN app.city AS c ON c.city_id = lo.city_id
WHERE li.data_origin = 'public_dataset'
GROUP BY c.city_name
ORDER BY c.city_name;

-- DEMO 5 — JOIN across users, saved_listings, listings, localities and cities.
SELECT
    u.full_name AS demo_user,
    c.city_name,
    lo.locality_name,
    li.title,
    li.rent_amount,
    li.availability_status,
    sl.saved_at
FROM app.saved_listing AS sl
JOIN app.app_user AS u ON u.user_id = sl.user_id
JOIN app.listing AS li ON li.listing_id = sl.listing_id
JOIN app.locality AS lo ON lo.locality_id = li.locality_id
JOIN app.city AS c ON c.city_id = lo.city_id
WHERE u.email LIKE '%.demo@example.test'
ORDER BY u.full_name;

-- DEMO 6: Roommate compatibility matching

WITH target AS (
    SELECT
        u.user_id AS target_user_id,
        rp.preferred_city_id,
        rp.budget_min,
        rp.budget_max,
        rp.food_preference,
        rp.smoking_preference,
        rp.pets_preference,
        rp.sleep_schedule,
        rp.cleanliness_preference
    FROM app.app_user AS u
    JOIN app.roommate_profile AS rp
        ON rp.user_id = u.user_id
    WHERE u.email = 'aarav.demo@example.test'
),
candidate_scores AS (
    SELECT
        candidate.full_name AS candidate_name,
        c.city_name AS preferred_city,

        CASE WHEN rp.preferred_city_id = t.preferred_city_id
                  AND rp.preferred_city_id IS NOT NULL
             THEN 25 ELSE 0 END
      + CASE WHEN rp.budget_min <= t.budget_max
                   AND t.budget_min <= rp.budget_max
             THEN 25 ELSE 0 END
      + CASE WHEN rp.food_preference = t.food_preference
                   OR rp.food_preference = 'no_preference'
                   OR t.food_preference = 'no_preference'
             THEN 15 ELSE 0 END
      + CASE WHEN rp.smoking_preference = t.smoking_preference
                   OR rp.smoking_preference = 'no_preference'
                   OR t.smoking_preference = 'no_preference'
             THEN 10 ELSE 0 END
      + CASE WHEN rp.pets_preference = t.pets_preference
                   OR rp.pets_preference = 'no_preference'
                   OR t.pets_preference = 'no_preference'
             THEN 10 ELSE 0 END
      + CASE WHEN rp.sleep_schedule = t.sleep_schedule
                   OR rp.sleep_schedule = 'no_preference'
                   OR t.sleep_schedule = 'no_preference'
             THEN 10 ELSE 0 END
      + CASE WHEN rp.cleanliness_preference =
                       t.cleanliness_preference
                   OR rp.cleanliness_preference = 'no_preference'
                   OR t.cleanliness_preference = 'no_preference'
             THEN 5 ELSE 0 END AS similarity_score

    FROM target AS t
    CROSS JOIN app.roommate_profile AS rp
    JOIN app.app_user AS candidate
        ON candidate.user_id = rp.user_id
    LEFT JOIN app.city AS c
        ON c.city_id = rp.preferred_city_id
    WHERE candidate.user_id <> t.target_user_id
)
SELECT candidate_name, preferred_city, similarity_score
FROM candidate_scores
ORDER BY similarity_score DESC, candidate_name;

-- DEMO 7 — Referential integrity: should return 0 orphan listing rows.
SELECT COUNT(*) AS listings_without_valid_locality
FROM app.listing AS li
LEFT JOIN app.locality AS lo ON lo.locality_id = li.locality_id
WHERE lo.locality_id IS NULL;

-- DEMO 8 — Show all schemas and tables that are part of the application database.
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema IN ('app', 'staging')
ORDER BY table_schema, table_name;
