-- Safe to run more than once. Adds reference rows used by demo/manual listings.

INSERT INTO app.city (city_name)
VALUES ('Delhi'), ('Mumbai'), ('Pune')
ON CONFLICT (city_name) DO NOTHING;

INSERT INTO app.amenity (amenity_name)
VALUES
    ('Wi-Fi'),
    ('Air conditioning'),
    ('Parking'),
    ('Kitchen access'),
    ('Washing machine'),
    ('Lift'),
    ('Power backup'),
    ('Food included'),
    ('CCTV'),
    ('Gym'),
    ('Public transport nearby'),
    ('Study area')
ON CONFLICT (amenity_name) DO NOTHING;
