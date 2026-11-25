from flask import Blueprint, request, jsonify
from ..db import query_one, query_all, execute_query, execute_returning_one
from ..auth import get_current_user_id, login_required

listings_bp = Blueprint('listings', __name__)

@listings_bp.route('/listings', methods=['GET'])
def get_listings():
    current_user_id = get_current_user_id()
    
    # Query parameters
    city_id = request.args.get('city_id', type=int)
    locality_id = request.args.get('locality_id', type=int)
    min_rent = request.args.get('min_rent', type=float)
    max_rent = request.args.get('max_rent', type=float)
    listing_kind = request.args.get('listing_kind', type=str)
    bedrooms = request.args.get('bedrooms', type=int)
    furnishing_status = request.args.get('furnishing_status', type=str)
    data_origin = request.args.get('data_origin', type=str) # 'all', 'user_submitted', 'public_dataset'
    availability_status = request.args.get('availability_status', type=str)
    amenity_ids = request.args.get('amenity_ids', type=str) # e.g. "1,2,3"
    search = request.args.get('search', type=str)
    sort_by = request.args.get('sort_by', default='price_asc', type=str)
    page = max(1, request.args.get('page', default=1, type=int))
    per_page = min(50, max(1, request.args.get('per_page', default=12, type=int)))
    offset = (page - 1) * per_page
    
    where_clauses = ["1=1"]
    params = []
    
    if city_id:
        where_clauses.append("c.city_id = %s")
        params.append(city_id)
    if locality_id:
        where_clauses.append("li.locality_id = %s")
        params.append(locality_id)
    if min_rent is not None:
        where_clauses.append("li.rent_amount >= %s")
        params.append(min_rent)
    if max_rent is not None:
        where_clauses.append("li.rent_amount <= %s")
        params.append(max_rent)
    if listing_kind and listing_kind != 'all':
        where_clauses.append("li.listing_kind = %s")
        params.append(listing_kind)
    if bedrooms is not None and bedrooms >= 0:
        where_clauses.append("li.bedrooms = %s")
        params.append(bedrooms)
    if furnishing_status and furnishing_status != 'all':
        where_clauses.append("li.furnishing_status = %s")
        params.append(furnishing_status)
    if data_origin and data_origin != 'all':
        where_clauses.append("li.data_origin = %s")
        params.append(data_origin)
    if availability_status and availability_status != 'all':
        where_clauses.append("li.availability_status = %s")
        params.append(availability_status)
    if search:
        where_clauses.append("(li.title ILIKE %s OR lo.locality_name ILIKE %s OR c.city_name ILIKE %s)")
        search_term = f"%{search.strip()}%"
        params.extend([search_term, search_term, search_term])
        
    # Amenity filtering (for user listings that have amenities assigned)
    if amenity_ids:
        try:
            parsed_ids = [int(x.strip()) for x in amenity_ids.split(',') if x.strip()]
            if parsed_ids:
                where_clauses.append("""
                    li.listing_id IN (
                        SELECT listing_id FROM app.listing_amenity
                        WHERE amenity_id = ANY(%s)
                        GROUP BY listing_id
                        HAVING COUNT(DISTINCT amenity_id) = %s
                    )
                """)
                params.append(parsed_ids)
                params.append(len(parsed_ids))
        except ValueError:
            pass

    where_sql = " AND ".join(where_clauses)
    
    # Sorting
    sort_clause = "li.rent_amount ASC"
    if sort_by == 'price_desc':
        sort_clause = "li.rent_amount DESC"
    elif sort_by == 'size_desc':
        sort_clause = "li.size_sqft DESC NULLS LAST"
    elif sort_by == 'newest':
        sort_clause = "li.created_at DESC"
    elif sort_by == 'verified_first':
        sort_clause = "CASE WHEN li.data_origin = 'user_submitted' THEN 0 ELSE 1 END, li.rent_amount ASC"

    # Count total
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM app.listing li
        JOIN app.locality lo ON lo.locality_id = li.locality_id
        JOIN app.city c ON c.city_id = lo.city_id
        WHERE {where_sql};
    """
    total_count = query_one(count_sql, tuple(params))['total']
    
    # Fetch paginated listings
    # Also check if current user saved the listing
    saved_select = "FALSE AS is_saved"
    saved_join = ""
    query_params = list(params)
    
    if current_user_id:
        saved_select = "CASE WHEN sl.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_saved"
        saved_join = f"LEFT JOIN app.saved_listing sl ON sl.listing_id = li.listing_id AND sl.user_id = {int(current_user_id)}"
    
    listings_sql = f"""
        SELECT 
            li.listing_id,
            li.owner_user_id,
            li.locality_id,
            lo.locality_name,
            c.city_id,
            c.city_name,
            li.title,
            li.listing_kind,
            li.source_property_type,
            li.rent_amount,
            li.rent_period,
            li.security_deposit,
            li.size_sqft,
            li.bedrooms,
            li.bathrooms,
            li.balconies,
            li.furnishing_status,
            li.description,
            li.latitude,
            li.longitude,
            li.availability_status,
            li.data_origin,
            li.last_verified_at,
            li.created_at,
            {saved_select},
            (SELECT json_agg(a.amenity_name)
             FROM app.listing_amenity la
             JOIN app.amenity a ON a.amenity_id = la.amenity_id
             WHERE la.listing_id = li.listing_id) AS amenities
        FROM app.listing li
        JOIN app.locality lo ON lo.locality_id = li.locality_id
        JOIN app.city c ON c.city_id = lo.city_id
        {saved_join}
        WHERE {where_sql}
        ORDER BY {sort_clause}
        LIMIT %s OFFSET %s;
    """
    query_params.extend([per_page, offset])
    
    listings = query_all(listings_sql, tuple(query_params))
    
    return jsonify({
        "listings": listings,
        "pagination": {
            "total": total_count,
            "page": page,
            "per_page": per_page,
            "total_pages": (total_count + per_page - 1) // per_page if total_count > 0 else 1
        }
    }), 200

@listings_bp.route('/listings/featured', methods=['GET'])
def get_featured_listings():
    """Returns top listings for landing page: verified first, then best value listings in each city."""
    current_user_id = get_current_user_id()
    saved_select = "FALSE AS is_saved"
    saved_join = ""
    if current_user_id:
        saved_select = "CASE WHEN sl.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_saved"
        saved_join = f"LEFT JOIN app.saved_listing sl ON sl.listing_id = li.listing_id AND sl.user_id = {int(current_user_id)}"
        
    listings = query_all(f"""
        (
            SELECT 
                li.listing_id, li.locality_id, lo.locality_name, c.city_id, c.city_name,
                li.title, li.listing_kind, li.rent_amount, li.size_sqft, li.bedrooms, li.bathrooms,
                li.furnishing_status, li.availability_status, li.data_origin, li.created_at,
                {saved_select},
                (SELECT json_agg(a.amenity_name) FROM app.listing_amenity la JOIN app.amenity a ON a.amenity_id = la.amenity_id WHERE la.listing_id = li.listing_id) AS amenities
            FROM app.listing li
            JOIN app.locality lo ON lo.locality_id = li.locality_id
            JOIN app.city c ON c.city_id = lo.city_id
            {saved_join}
            WHERE li.data_origin = 'user_submitted' AND li.availability_status = 'available'
            LIMIT 3
        )
        UNION ALL
        (
            SELECT 
                li.listing_id, li.locality_id, lo.locality_name, c.city_id, c.city_name,
                li.title, li.listing_kind, li.rent_amount, li.size_sqft, li.bedrooms, li.bathrooms,
                li.furnishing_status, li.availability_status, li.data_origin, li.created_at,
                {saved_select},
                (SELECT json_agg(a.amenity_name) FROM app.listing_amenity la JOIN app.amenity a ON a.amenity_id = la.amenity_id WHERE la.listing_id = li.listing_id) AS amenities
            FROM app.listing li
            JOIN app.locality lo ON lo.locality_id = li.locality_id
            JOIN app.city c ON c.city_id = lo.city_id
            {saved_join}
            WHERE li.data_origin = 'public_dataset' AND li.rent_amount BETWEEN 8000 AND 25000
            ORDER BY li.listing_id
            LIMIT 6
        )
        LIMIT 6;
    """)
    return jsonify({"featured_listings": listings}), 200

@listings_bp.route('/listings/<int:listing_id>', methods=['GET'])
def get_listing_details(listing_id: int):
    current_user_id = get_current_user_id()
    saved_select = "FALSE AS is_saved"
    saved_join = ""
    if current_user_id:
        saved_select = "CASE WHEN sl.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_saved"
        saved_join = f"LEFT JOIN app.saved_listing sl ON sl.listing_id = li.listing_id AND sl.user_id = {int(current_user_id)}"
        
    listing = query_one(f"""
        SELECT 
            li.*,
            lo.locality_name,
            c.city_id,
            c.city_name,
            u.full_name AS owner_name,
            u.email AS owner_email,
            {saved_select},
            (SELECT COUNT(*) FROM app.saved_listing WHERE listing_id = li.listing_id) AS save_count,
            (SELECT json_agg(json_build_object('amenity_id', a.amenity_id, 'amenity_name', a.amenity_name))
             FROM app.listing_amenity la
             JOIN app.amenity a ON a.amenity_id = la.amenity_id
             WHERE la.listing_id = li.listing_id) AS amenities
        FROM app.listing li
        JOIN app.locality lo ON lo.locality_id = li.locality_id
        JOIN app.city c ON c.city_id = lo.city_id
        LEFT JOIN app.app_user u ON u.user_id = li.owner_user_id
        {saved_join}
        WHERE li.listing_id = %s;
    """, (listing_id,))
    
    if not listing:
        return jsonify({"error": "Not Found", "message": "Listing does not exist"}), 404
    
    return jsonify({"listing": listing}), 200

@listings_bp.route('/listings/<int:listing_id>/save', methods=['POST'])
@login_required
def toggle_save_listing(listing_id: int):
    user_id = get_current_user_id()
    
    # Check if already saved
    existing = query_one("SELECT 1 FROM app.saved_listing WHERE user_id = %s AND listing_id = %s;", (user_id, listing_id))
    
    if existing:
        execute_query("DELETE FROM app.saved_listing WHERE user_id = %s AND listing_id = %s;", (user_id, listing_id))
        is_saved = False
        message = "Listing removed from saved listings"
    else:
        execute_query("INSERT INTO app.saved_listing (user_id, listing_id) VALUES (%s, %s);", (user_id, listing_id))
        is_saved = True
        message = "Listing bookmarked to your saved listings"
        
    return jsonify({
        "message": message,
        "is_saved": is_saved
    }), 200

@listings_bp.route('/listings/<int:listing_id>/enquiry', methods=['POST'])
@login_required
def submit_enquiry(listing_id: int):
    user_id = get_current_user_id()
    data = request.get_json() or {}
    message = (data.get('message') or '').strip()
    
    if not message:
        return jsonify({"error": "Validation Error", "message": "Enquiry message cannot be empty"}), 400
    
    # Check listing exists
    listing = query_one("SELECT listing_id, owner_user_id, data_origin FROM app.listing WHERE listing_id = %s;", (listing_id,))
    if not listing:
        return jsonify({"error": "Not Found", "message": "Listing does not exist"}), 404
        
    # Prevent owner from enquiring on their own listing
    if listing.get('owner_user_id') == user_id:
        return jsonify({"error": "Bad Request", "message": "You cannot submit an enquiry on your own listing"}), 400
        
    enquiry = execute_returning_one("""
        INSERT INTO app.enquiry (user_id, listing_id, message, enquiry_status)
        VALUES (%s, %s, %s, 'new')
        RETURNING enquiry_id, user_id, listing_id, message, enquiry_status, created_at;
    """, (user_id, listing_id, message))
    
    return jsonify({
        "message": "Your enquiry has been sent successfully",
        "enquiry": enquiry
    }), 201
