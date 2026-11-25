from flask import Blueprint, jsonify, request
from ..db import query_all

reference_bp = Blueprint('reference', __name__)

@reference_bp.route('/reference/cities', methods=['GET'])
def get_cities():
    cities = query_all("""
        SELECT 
            c.city_id,
            c.city_name,
            COUNT(li.listing_id) AS total_listings,
            COUNT(li.listing_id) FILTER (WHERE li.data_origin = 'user_submitted' AND li.availability_status = 'available') AS verified_listings,
            COUNT(li.listing_id) FILTER (WHERE li.data_origin = 'public_dataset') AS historical_listings,
            ROUND(AVG(li.rent_amount), 0) AS avg_rent,
            MIN(li.rent_amount) AS min_rent,
            MAX(li.rent_amount) AS max_rent
        FROM app.city c
        LEFT JOIN app.locality lo ON lo.city_id = c.city_id
        LEFT JOIN app.listing li ON li.locality_id = lo.locality_id
        GROUP BY c.city_id, c.city_name
        ORDER BY c.city_name;
    """)
    return jsonify({"cities": cities}), 200

@reference_bp.route('/reference/localities', methods=['GET'])
def get_localities():
    city_id = request.args.get('city_id', type=int)
    search = request.args.get('search', type=str)
    
    query = """
        SELECT 
            lo.locality_id,
            lo.locality_name,
            lo.city_id,
            c.city_name,
            COUNT(li.listing_id) AS listing_count
        FROM app.locality lo
        JOIN app.city c ON c.city_id = lo.city_id
        LEFT JOIN app.listing li ON li.locality_id = lo.locality_id
        WHERE 1=1
    """
    params = []
    if city_id:
        query += " AND lo.city_id = %s"
        params.append(city_id)
    if search:
        query += " AND lo.locality_name ILIKE %s"
        params.append(f"%{search.strip()}%")
        
    query += " GROUP BY lo.locality_id, lo.locality_name, lo.city_id, c.city_name ORDER BY lo.locality_name LIMIT 100;"
    localities = query_all(query, tuple(params))
    return jsonify({"localities": localities}), 200

@reference_bp.route('/reference/amenities', methods=['GET'])
def get_amenities():
    amenities = query_all("SELECT amenity_id, amenity_name FROM app.amenity ORDER BY amenity_id;")
    return jsonify({"amenities": amenities}), 200
