from flask import Blueprint, jsonify
from ..db import query_all, query_one
from ..auth import get_current_user_id, login_required
from .roommates import calculate_compatibility_sql

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/summary', methods=['GET'])
@login_required
def get_user_dashboard():
    user_id = get_current_user_id()
    
    # 1. User profile and preferences
    user_profile = query_one("""
        SELECT 
            u.user_id, u.full_name, u.email, u.account_role, u.created_at,
            rp.preferred_city_id, c.city_name AS preferred_city_name,
            rp.budget_min, rp.budget_max, rp.move_in_date,
            rp.food_preference, rp.smoking_preference, rp.pets_preference,
            rp.sleep_schedule, rp.cleanliness_preference, rp.updated_at
        FROM app.app_user u
        LEFT JOIN app.roommate_profile rp ON rp.user_id = u.user_id
        LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
        WHERE u.user_id = %s;
    """, (user_id,))
    
    # 2. Saved listings
    saved_listings = query_all("""
        SELECT 
            li.listing_id,
            li.locality_id,
            lo.locality_name,
            c.city_id,
            c.city_name,
            li.title,
            li.listing_kind,
            li.rent_amount,
            li.size_sqft,
            li.bedrooms,
            li.bathrooms,
            li.furnishing_status,
            li.availability_status,
            li.data_origin,
            sl.saved_at,
            TRUE AS is_saved
        FROM app.saved_listing sl
        JOIN app.listing li ON li.listing_id = sl.listing_id
        JOIN app.locality lo ON lo.locality_id = li.locality_id
        JOIN app.city c ON c.city_id = lo.city_id
        WHERE sl.user_id = %s
        ORDER BY sl.saved_at DESC;
    """, (user_id,))
    
    # 3. User's sent enquiries
    enquiries = query_all("""
        SELECT 
            e.enquiry_id,
            e.listing_id,
            e.message,
            e.enquiry_status,
            e.created_at,
            li.title AS listing_title,
            li.rent_amount,
            lo.locality_name,
            c.city_name,
            owner.full_name AS owner_name
        FROM app.enquiry e
        JOIN app.listing li ON li.listing_id = e.listing_id
        JOIN app.locality lo ON lo.locality_id = li.locality_id
        JOIN app.city c ON c.city_id = lo.city_id
        LEFT JOIN app.app_user owner ON owner.user_id = li.owner_user_id
        WHERE e.user_id = %s
        ORDER BY e.created_at DESC;
    """, (user_id,))
    
    # 4. Incoming Roommate Requests
    incoming_requests = query_all("""
        SELECT 
            rr.request_id,
            rr.requester_user_id,
            rr.recipient_user_id,
            rr.message,
            rr.request_status,
            rr.created_at,
            requester.full_name AS requester_name,
            requester.email AS requester_email,
            c.city_name AS preferred_city,
            rp.budget_min,
            rp.budget_max
        FROM app.roommate_request rr
        JOIN app.app_user requester ON requester.user_id = rr.requester_user_id
        LEFT JOIN app.roommate_profile rp ON rp.user_id = requester.user_id
        LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
        WHERE rr.recipient_user_id = %s
        ORDER BY rr.created_at DESC;
    """, (user_id,))
    
    # 5. Outgoing Roommate Requests
    outgoing_requests = query_all("""
        SELECT 
            rr.request_id,
            rr.requester_user_id,
            rr.recipient_user_id,
            rr.message,
            rr.request_status,
            rr.created_at,
            recipient.full_name AS recipient_name,
            recipient.email AS recipient_email,
            c.city_name AS preferred_city,
            rp.budget_min,
            rp.budget_max
        FROM app.roommate_request rr
        JOIN app.app_user recipient ON recipient.user_id = rr.recipient_user_id
        LEFT JOIN app.roommate_profile rp ON rp.user_id = recipient.user_id
        LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
        WHERE rr.requester_user_id = %s
        ORDER BY rr.created_at DESC;
    """, (user_id,))
    
    # 6. Top Recommended Roommates
    recommended_roommates = query_all(f"""
        WITH ranked AS (
            {calculate_compatibility_sql(user_id)}
        )
        SELECT * FROM ranked
        ORDER BY match_score DESC
        LIMIT 4;
    """)
    
    return jsonify({
        "profile": user_profile,
        "saved_listings": saved_listings,
        "enquiries": enquiries,
        "incoming_requests": incoming_requests,
        "outgoing_requests": outgoing_requests,
        "recommended_roommates": recommended_roommates
    }), 200
