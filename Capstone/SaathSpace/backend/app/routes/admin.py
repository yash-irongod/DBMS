from flask import Blueprint, jsonify
from ..db import query_all, query_one

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/analytics', methods=['GET'])
def get_admin_analytics():
    # 1. High level totals
    totals = query_one("""
        SELECT 
            (SELECT COUNT(*) FROM app.listing) AS total_listings,
            (SELECT COUNT(*) FROM app.listing WHERE data_origin = 'public_dataset') AS historical_listings,
            (SELECT COUNT(*) FROM app.listing WHERE data_origin = 'user_submitted') AS live_owner_listings,
            (SELECT COUNT(*) FROM app.app_user) AS total_users,
            (SELECT COUNT(*) FROM app.roommate_profile) AS total_roommate_profiles,
            (SELECT COUNT(*) FROM app.enquiry) AS total_enquiries,
            (SELECT COUNT(*) FROM app.roommate_request) AS total_roommate_requests,
            (SELECT COUNT(*) FROM app.saved_listing) AS total_saved_listings;
    """)

    # 2. City breakdown distinguishing historical vs live user listings
    city_stats = query_all("""
        SELECT 
            c.city_name,
            COUNT(li.listing_id) AS total_listings,
            COUNT(li.listing_id) FILTER (WHERE li.data_origin = 'public_dataset') AS historical_count,
            COUNT(li.listing_id) FILTER (WHERE li.data_origin = 'user_submitted') AS live_owner_count,
            ROUND(AVG(li.rent_amount) FILTER (WHERE li.data_origin = 'public_dataset'), 0) AS historical_avg_rent,
            ROUND(AVG(li.rent_amount) FILTER (WHERE li.data_origin = 'user_submitted'), 0) AS live_avg_rent,
            ROUND(AVG(li.rent_amount), 0) AS combined_avg_rent,
            MIN(li.rent_amount) AS min_rent,
            MAX(li.rent_amount) AS max_rent
        FROM app.city c
        LEFT JOIN app.locality lo ON lo.city_id = c.city_id
        LEFT JOIN app.listing li ON li.locality_id = lo.locality_id
        GROUP BY c.city_name
        ORDER BY c.city_name;
    """)

    # 3. Status distribution
    status_distribution = query_all("""
        SELECT 
            availability_status,
            data_origin,
            COUNT(*) AS count
        FROM app.listing
        GROUP BY availability_status, data_origin
        ORDER BY data_origin, availability_status;
    """)

    # 4. Property kinds distribution
    kind_distribution = query_all("""
        SELECT 
            listing_kind,
            COUNT(*) AS count,
            ROUND(AVG(rent_amount), 0) AS avg_rent
        FROM app.listing
        GROUP BY listing_kind
        ORDER BY count DESC;
    """)

    # 5. Furnishing status distribution
    furnishing_distribution = query_all("""
        SELECT 
            furnishing_status,
            COUNT(*) AS count
        FROM app.listing
        GROUP BY furnishing_status
        ORDER BY count DESC;
    """)

    # 6. Recent users overview
    recent_users = query_all("""
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            u.account_role,
            u.created_at,
            (SELECT COUNT(*) FROM app.listing WHERE owner_user_id = u.user_id) AS listings_posted,
            (SELECT COUNT(*) FROM app.enquiry WHERE user_id = u.user_id) AS enquiries_sent,
            (SELECT COUNT(*) FROM app.saved_listing WHERE user_id = u.user_id) AS saved_count,
            c.city_name AS preferred_city
        FROM app.app_user u
        LEFT JOIN app.roommate_profile rp ON rp.user_id = u.user_id
        LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
        ORDER BY u.created_at DESC
        LIMIT 20;
    """)

    return jsonify({
        "totals": totals,
        "city_stats": city_stats,
        "status_distribution": status_distribution,
        "kind_distribution": kind_distribution,
        "furnishing_distribution": furnishing_distribution,
        "recent_users": recent_users
    }), 200
