-- SaathSpace Phase 1 demo data
-- Run once (safe to re-run) while connected to database `saathspace`.
-- All people and interactions here are SYNTHETIC demonstration records.
-- This script does not modify the imported rental dataset.

BEGIN;

-- 1. Four fictional demo users. example.test is reserved for documentation/testing.
INSERT INTO app.app_user (full_name, email, account_role)
VALUES
    ('Aarav Demo', 'aarav.demo@example.test', 'member'),
    ('Diya Demo', 'diya.demo@example.test', 'member'),
    ('Kabir Demo', 'kabir.demo@example.test', 'member'),
    ('Mira Demo', 'mira.demo@example.test', 'member')
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    account_role = EXCLUDED.account_role;

-- 2. Synthetic roommate preference profiles.
INSERT INTO app.roommate_profile (
    user_id, preferred_city_id, budget_min, budget_max,
    food_preference, smoking_preference, pets_preference,
    sleep_schedule, cleanliness_preference
)
SELECT
    u.user_id,
    c.city_id,
    d.budget_min,
    d.budget_max,
    d.food_preference,
    d.smoking_preference,
    d.pets_preference,
    d.sleep_schedule,
    d.cleanliness_preference
FROM (VALUES
    ('aarav.demo@example.test', 'Delhi',  8000::NUMERIC, 15000::NUMERIC, 'vegetarian',     'non_smoker_only',   'no_pets', 'late',    'average'),
    ('diya.demo@example.test',  'Delhi',  9000::NUMERIC, 16000::NUMERIC, 'vegetarian',     'non_smoker_only',   'no_pets', 'late',    'very_clean'),
    ('kabir.demo@example.test', 'Pune',   7000::NUMERIC, 12000::NUMERIC, 'non_vegetarian', 'okay_with_smoker',  'pets_ok', 'regular', 'average'),
    ('mira.demo@example.test',  'Mumbai',12000::NUMERIC, 22000::NUMERIC, 'vegan',          'non_smoker_only',   'no_pets', 'early',   'very_clean')
) AS d(email, city_name, budget_min, budget_max, food_preference,
       smoking_preference, pets_preference, sleep_schedule, cleanliness_preference)
JOIN app.app_user AS u ON u.email = d.email
JOIN app.city AS c ON c.city_name = d.city_name
ON CONFLICT (user_id) DO UPDATE SET
    preferred_city_id = EXCLUDED.preferred_city_id,
    budget_min = EXCLUDED.budget_min,
    budget_max = EXCLUDED.budget_max,
    food_preference = EXCLUDED.food_preference,
    smoking_preference = EXCLUDED.smoking_preference,
    pets_preference = EXCLUDED.pets_preference,
    sleep_schedule = EXCLUDED.sleep_schedule,
    cleanliness_preference = EXCLUDED.cleanliness_preference,
    updated_at = CURRENT_TIMESTAMP;

-- 3. Create one saved-listing relationship per demo user, choosing the lowest-priced
-- imported row in that user's preferred city. These old listings remain UNVERIFIED.
INSERT INTO app.saved_listing (user_id, listing_id)
SELECT u.user_id, chosen.listing_id
FROM (VALUES
    ('aarav.demo@example.test', 'Delhi'),
    ('diya.demo@example.test',  'Delhi'),
    ('kabir.demo@example.test', 'Pune'),
    ('mira.demo@example.test',  'Mumbai')
) AS d(email, city_name)
JOIN app.app_user AS u ON u.email = d.email
CROSS JOIN LATERAL (
    SELECT li.listing_id
    FROM app.listing AS li
    JOIN app.locality AS lo ON lo.locality_id = li.locality_id
    JOIN app.city AS c ON c.city_id = lo.city_id
    WHERE c.city_name = d.city_name
      AND li.data_origin = 'public_dataset'
    ORDER BY li.rent_amount, li.listing_id
    LIMIT 1
) AS chosen
ON CONFLICT (user_id, listing_id) DO NOTHING;

-- 4. One illustrative roommate request between the two Delhi demo profiles.
INSERT INTO app.roommate_request (
    requester_user_id, recipient_user_id, message, request_status
)
SELECT requester.user_id, recipient.user_id,
       'Synthetic Phase 1 demo request: interested in discussing shared accommodation.',
       'pending'
FROM app.app_user AS requester
JOIN app.app_user AS recipient
  ON recipient.email = 'diya.demo@example.test'
WHERE requester.email = 'aarav.demo@example.test'
ON CONFLICT (requester_user_id, recipient_user_id) DO NOTHING;

COMMIT;

-- Quick seed verification
SELECT
    (SELECT COUNT(*) FROM app.app_user WHERE email LIKE '%.demo@example.test') AS demo_users,
    (SELECT COUNT(*) FROM app.roommate_profile rp
       JOIN app.app_user u ON u.user_id = rp.user_id
       WHERE u.email LIKE '%.demo@example.test') AS demo_profiles,
    (SELECT COUNT(*) FROM app.saved_listing sl
       JOIN app.app_user u ON u.user_id = sl.user_id
       WHERE u.email LIKE '%.demo@example.test') AS demo_saved_listings,
    (SELECT COUNT(*) FROM app.roommate_request rr
       JOIN app.app_user u ON u.user_id = rr.requester_user_id
       WHERE u.email = 'aarav.demo@example.test') AS demo_requests;
