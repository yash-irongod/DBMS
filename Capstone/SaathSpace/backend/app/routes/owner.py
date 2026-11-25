from flask import Blueprint, request, jsonify
from ..db import query_all, query_one, execute_query, execute_returning_one, get_db_connection
from ..auth import get_current_user_id, login_required

owner_bp = Blueprint('owner', __name__)

@owner_bp.route('/owner/listings', methods=['GET'])
@login_required
def get_owner_listings():
    user_id = get_current_user_id()
    listings = query_all("""
        SELECT 
            li.*,
            lo.locality_name,
            c.city_name,
            c.city_id,
            (SELECT COUNT(*) FROM app.enquiry WHERE listing_id = li.listing_id) AS total_enquiries,
            (SELECT COUNT(*) FROM app.enquiry WHERE listing_id = li.listing_id AND enquiry_status = 'new') AS new_enquiries,
            (SELECT COUNT(*) FROM app.saved_listing WHERE listing_id = li.listing_id) AS total_saves,
            (SELECT json_agg(json_build_object('amenity_id', a.amenity_id, 'amenity_name', a.amenity_name))
             FROM app.listing_amenity la
             JOIN app.amenity a ON a.amenity_id = la.amenity_id
             WHERE la.listing_id = li.listing_id) AS amenities
        FROM app.listing li
        JOIN app.locality lo ON lo.locality_id = li.locality_id
        JOIN app.city c ON c.city_id = lo.city_id
        WHERE li.owner_user_id = %s
        ORDER BY li.created_at DESC;
    """, (user_id,))
    return jsonify({"listings": listings}), 200

@owner_bp.route('/owner/listings', methods=['POST'])
@login_required
def create_listing():
    user_id = get_current_user_id()
    data = request.get_json() or {}
    
    title = (data.get('title') or '').strip()
    locality_id = data.get('locality_id')
    rent_amount = data.get('rent_amount')
    listing_kind = data.get('listing_kind', 'entire_unit')
    rent_period = data.get('rent_period', 'monthly')
    security_deposit = data.get('security_deposit')
    size_sqft = data.get('size_sqft')
    bedrooms = data.get('bedrooms')
    bathrooms = data.get('bathrooms')
    balconies = data.get('balconies')
    furnishing_status = data.get('furnishing_status', 'unknown')
    description = (data.get('description') or '').strip()
    availability_status = data.get('availability_status', 'available')
    amenity_ids = data.get('amenity_ids', []) # list of ints
    
    if not title:
        return jsonify({"error": "Validation Error", "message": "Title is required"}), 400
    if not locality_id:
        return jsonify({"error": "Validation Error", "message": "Locality is required"}), 400
    if rent_amount is None or float(rent_amount) <= 0:
        return jsonify({"error": "Validation Error", "message": "Rent amount must be greater than 0"}), 400

    # Ensure locality exists
    locality = query_one("SELECT locality_id FROM app.locality WHERE locality_id = %s;", (locality_id,))
    if not locality:
        return jsonify({"error": "Not Found", "message": "Invalid locality selected"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO app.listing (
                    owner_user_id, locality_id, title, listing_kind,
                    rent_amount, rent_period, security_deposit,
                    size_sqft, bedrooms, bathrooms, balconies,
                    furnishing_status, description, availability_status,
                    data_origin, last_verified_at, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    'user_submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                ) RETURNING listing_id;
            """, (
                user_id, locality_id, title, listing_kind,
                rent_amount, rent_period, security_deposit,
                size_sqft, bedrooms, bathrooms, balconies,
                furnishing_status, description, availability_status
            ))
            new_id = cur.fetchone()['listing_id']
            
            # Insert amenities
            if amenity_ids:
                for a_id in amenity_ids:
                    cur.execute("""
                        INSERT INTO app.listing_amenity (listing_id, amenity_id)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING;
                    """, (new_id, int(a_id)))
        conn.commit()

    return jsonify({
        "message": "Listing published successfully",
        "listing_id": new_id
    }), 201

@owner_bp.route('/owner/listings/<int:listing_id>', methods=['PUT'])
@login_required
def update_listing(listing_id: int):
    user_id = get_current_user_id()
    
    # Verify ownership
    existing = query_one("SELECT listing_id, owner_user_id FROM app.listing WHERE listing_id = %s;", (listing_id,))
    if not existing:
        return jsonify({"error": "Not Found", "message": "Listing not found"}), 404
    if existing['owner_user_id'] != user_id:
        return jsonify({"error": "Forbidden", "message": "You can only update your own listings"}), 403
        
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    locality_id = data.get('locality_id')
    rent_amount = data.get('rent_amount')
    listing_kind = data.get('listing_kind')
    rent_period = data.get('rent_period')
    security_deposit = data.get('security_deposit')
    size_sqft = data.get('size_sqft')
    bedrooms = data.get('bedrooms')
    bathrooms = data.get('bathrooms')
    balconies = data.get('balconies')
    furnishing_status = data.get('furnishing_status')
    description = data.get('description')
    availability_status = data.get('availability_status')
    amenity_ids = data.get('amenity_ids') # list of ints or None
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE app.listing
                SET 
                    title = COALESCE(NULLIF(%s, ''), title),
                    locality_id = COALESCE(%s, locality_id),
                    rent_amount = COALESCE(%s, rent_amount),
                    listing_kind = COALESCE(%s, listing_kind),
                    rent_period = COALESCE(%s, rent_period),
                    security_deposit = %s,
                    size_sqft = %s,
                    bedrooms = %s,
                    bathrooms = %s,
                    balconies = %s,
                    furnishing_status = COALESCE(%s, furnishing_status),
                    description = %s,
                    availability_status = COALESCE(%s, availability_status),
                    updated_at = CURRENT_TIMESTAMP
                WHERE listing_id = %s;
            """, (
                title, locality_id, rent_amount, listing_kind, rent_period,
                security_deposit, size_sqft, bedrooms, bathrooms, balconies,
                furnishing_status, description, availability_status, listing_id
            ))
            
            # Sync amenities if provided
            if amenity_ids is not None:
                cur.execute("DELETE FROM app.listing_amenity WHERE listing_id = %s;", (listing_id,))
                for a_id in amenity_ids:
                    cur.execute("""
                        INSERT INTO app.listing_amenity (listing_id, amenity_id)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING;
                    """, (listing_id, int(a_id)))
        conn.commit()

    return jsonify({"message": "Listing updated successfully"}), 200

@owner_bp.route('/owner/listings/<int:listing_id>/availability', methods=['PATCH'])
@login_required
def update_availability(listing_id: int):
    user_id = get_current_user_id()
    existing = query_one("SELECT listing_id, owner_user_id FROM app.listing WHERE listing_id = %s;", (listing_id,))
    if not existing:
        return jsonify({"error": "Not Found", "message": "Listing not found"}), 404
    if existing['owner_user_id'] != user_id:
        return jsonify({"error": "Forbidden", "message": "You can only change availability for your own listings"}), 403
        
    data = request.get_json() or {}
    status = data.get('availability_status')
    valid = ('available', 'reserved', 'unavailable', 'inactive')
    if status not in valid:
        return jsonify({"error": "Validation Error", "message": f"Status must be one of: {', '.join(valid)}"}), 400
        
    execute_query("""
        UPDATE app.listing
        SET availability_status = %s, updated_at = CURRENT_TIMESTAMP
        WHERE listing_id = %s;
    """, (status, listing_id))
    
    return jsonify({"message": f"Availability changed to {status}"}), 200

@owner_bp.route('/owner/enquiries', methods=['GET'])
@login_required
def get_owner_enquiries():
    """Returns all enquiries received across all listings owned by current user."""
    user_id = get_current_user_id()
    enquiries = query_all("""
        SELECT 
            e.enquiry_id,
            e.listing_id,
            e.message,
            e.enquiry_status,
            e.created_at,
            li.title AS listing_title,
            li.rent_amount,
            enquirer.full_name AS enquirer_name,
            enquirer.email AS enquirer_email
        FROM app.enquiry e
        JOIN app.listing li ON li.listing_id = e.listing_id
        JOIN app.app_user enquirer ON enquirer.user_id = e.user_id
        WHERE li.owner_user_id = %s
        ORDER BY e.created_at DESC;
    """, (user_id,))
    return jsonify({"enquiries": enquiries}), 200

@owner_bp.route('/owner/enquiries/<int:enquiry_id>/status', methods=['PATCH'])
@login_required
def update_enquiry_status(enquiry_id: int):
    user_id = get_current_user_id()
    # Check that current user owns the listing associated with this enquiry
    enquiry = query_one("""
        SELECT e.enquiry_id, li.owner_user_id
        FROM app.enquiry e
        JOIN app.listing li ON li.listing_id = e.listing_id
        WHERE e.enquiry_id = %s;
    """, (enquiry_id,))
    
    if not enquiry:
        return jsonify({"error": "Not Found", "message": "Enquiry not found"}), 404
    if enquiry['owner_user_id'] != user_id:
        return jsonify({"error": "Forbidden", "message": "You can only manage enquiries for your own listings"}), 403
        
    data = request.get_json() or {}
    new_status = data.get('enquiry_status')
    if new_status not in ('new', 'responded', 'closed', 'withdrawn'):
        return jsonify({"error": "Validation Error", "message": "Invalid enquiry status"}), 400
        
    execute_query("UPDATE app.enquiry SET enquiry_status = %s WHERE enquiry_id = %s;", (new_status, enquiry_id))
    return jsonify({"message": f"Enquiry status updated to {new_status}"}), 200
