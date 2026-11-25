from flask import Blueprint, jsonify
from ..db import query_one

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    try:
        db_stat = query_one("""
            SELECT 
                (SELECT COUNT(*) FROM app.listing) AS total_listings,
                (SELECT COUNT(*) FROM app.listing WHERE data_origin = 'public_dataset') AS historical_listings,
                (SELECT COUNT(*) FROM app.listing WHERE data_origin = 'user_submitted') AS user_listings,
                (SELECT COUNT(*) FROM app.app_user) AS total_users,
                (SELECT COUNT(*) FROM app.roommate_profile) AS total_profiles;
        """)
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "stats": db_stat
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }), 500
