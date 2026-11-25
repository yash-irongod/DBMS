from functools import wraps
from flask import session, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from .db import query_one, execute_query

DEMO_DEFAULT_PASSWORD = "Demo@123"

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_and_upgrade_password(user: dict, password: str) -> bool:
    """Verifies password using Werkzeug. If demo user has no hash, checks Demo@123 and sets hash."""
    stored_hash = user.get('password_hash')
    if stored_hash:
        return check_password_hash(stored_hash, password)
    
    # Check if demo account with uninitialized hash
    if user.get('email', '').endswith('.demo@example.test') and password == DEMO_DEFAULT_PASSWORD:
        new_hash = hash_password(DEMO_DEFAULT_PASSWORD)
        execute_query(
            "UPDATE app.app_user SET password_hash = %s WHERE user_id = %s;",
            (new_hash, user['user_id'])
        )
        return True
    
    return False

def get_current_user_id() -> int | None:
    return session.get('user_id')

def get_current_user() -> dict | None:
    user_id = get_current_user_id()
    if not user_id:
        return None
    return query_one(
        "SELECT user_id, full_name, email, account_role, created_at FROM app.app_user WHERE user_id = %s;",
        (user_id,)
    )

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not get_current_user_id():
            return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or user.get('account_role') != 'admin':
            return jsonify({"error": "Forbidden", "message": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated_function
