from flask import Blueprint, request, jsonify, session
from ..db import query_one, execute_query, execute_returning_one
from ..auth import (
    hash_password,
    verify_and_upgrade_password,
    get_current_user,
    get_current_user_id,
    login_required
)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = (data.get('full_name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not full_name:
        return jsonify({"error": "Validation Error", "message": "Full name is required"}), 400
    if not email or '@' not in email:
        return jsonify({"error": "Validation Error", "message": "Valid email address is required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Validation Error", "message": "Password must be at least 6 characters"}), 400
    
    # Check if email exists
    existing = query_one("SELECT user_id FROM app.app_user WHERE LOWER(email) = LOWER(%s);", (email,))
    if existing:
        return jsonify({"error": "Conflict", "message": "An account with this email already exists"}), 409
    
    pwd_hash = hash_password(password)
    new_user = execute_returning_one("""
        INSERT INTO app.app_user (full_name, email, password_hash, account_role)
        VALUES (%s, %s, %s, 'member')
        RETURNING user_id, full_name, email, account_role, created_at;
    """, (full_name, email, pwd_hash))
    
    # Auto-initialize an empty roommate profile for the new user
    # Choose default city Delhi (city_id 1)
    execute_query("""
        INSERT INTO app.roommate_profile (
            user_id, preferred_city_id, budget_min, budget_max,
            food_preference, smoking_preference, pets_preference,
            sleep_schedule, cleanliness_preference
        ) VALUES (
            %s, 1, 5000, 20000,
            'no_preference', 'no_preference', 'no_preference',
            'no_preference', 'no_preference'
        ) ON CONFLICT (user_id) DO NOTHING;
    """, (new_user['user_id'],))
    
    session['user_id'] = new_user['user_id']
    session['role'] = new_user['account_role']
    session.permanent = True
    
    return jsonify({
        "message": "Account created successfully",
        "user": new_user
    }), 201

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not email or not password:
        return jsonify({"error": "Validation Error", "message": "Email and password are required"}), 400
    
    user = query_one(
        "SELECT user_id, full_name, email, password_hash, account_role, created_at FROM app.app_user WHERE LOWER(email) = LOWER(%s);",
        (email,)
    )
    
    if not user or not verify_and_upgrade_password(user, password):
        return jsonify({"error": "Unauthorized", "message": "Invalid email or password"}), 401
    
    session['user_id'] = user['user_id']
    session['role'] = user['account_role']
    session.permanent = True
    
    user_data = {
        "user_id": user['user_id'],
        "full_name": user['full_name'],
        "email": user['email'],
        "account_role": user['account_role'],
        "created_at": user['created_at']
    }
    
    return jsonify({
        "message": "Logged in successfully",
        "user": user_data
    }), 200

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route('/auth/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({"user": None}), 200
    
    profile = query_one("""
        SELECT 
            rp.*,
            c.city_name AS preferred_city_name
        FROM app.roommate_profile rp
        LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
        WHERE rp.user_id = %s;
    """, (user['user_id'],))
    
    return jsonify({
        "user": user,
        "profile": profile
    }), 200

@auth_bp.route('/auth/profile', methods=['PUT'])
@login_required
def update_profile():
    user_id = get_current_user_id()
    data = request.get_json() or {}
    full_name = (data.get('full_name') or '').strip()
    
    if full_name:
        execute_query("UPDATE app.app_user SET full_name = %s WHERE user_id = %s;", (full_name, user_id))
        
    user = get_current_user()
    return jsonify({"message": "Profile updated successfully", "user": user}), 200

@auth_bp.route('/auth/demo-users', methods=['GET'])
def get_demo_users():
    """Returns demo users for instant 1-click test login."""
    users = query_one("""
        SELECT json_agg(u) AS demo_accounts FROM (
            SELECT 
                u.user_id, u.full_name, u.email, u.account_role,
                c.city_name AS preferred_city,
                rp.budget_min, rp.budget_max,
                rp.food_preference, rp.cleanliness_preference
            FROM app.app_user u
            LEFT JOIN app.roommate_profile rp ON rp.user_id = u.user_id
            LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
            WHERE u.email LIKE %s
            ORDER BY u.user_id
        ) u;
    """, ('%.demo@example.test',))
    return jsonify({
        "demo_accounts": users.get('demo_accounts') or [],
        "default_password": "Demo@123"
    }), 200
