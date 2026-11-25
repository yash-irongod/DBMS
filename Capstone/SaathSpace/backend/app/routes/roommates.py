from flask import Blueprint, request, jsonify
from ..db import query_one, query_all, execute_query, execute_returning_one
from ..auth import get_current_user_id, login_required

roommates_bp = Blueprint('roommates', __name__)

def calculate_compatibility_sql(target_user_id: int):
    """Generates the exact 100-pt compatibility scoring SQL based on Phase 1 Demo 6."""
    return f"""
        WITH target AS (
            SELECT 
                rp.preferred_city_id,
                rp.budget_min,
                rp.budget_max,
                rp.food_preference,
                rp.smoking_preference,
                rp.pets_preference,
                rp.sleep_schedule,
                rp.cleanliness_preference
            FROM app.roommate_profile rp
            WHERE rp.user_id = {int(target_user_id)}
        )
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            c.city_id,
            c.city_name AS preferred_city_name,
            rp.budget_min,
            rp.budget_max,
            rp.move_in_date,
            rp.food_preference,
            rp.smoking_preference,
            rp.pets_preference,
            rp.sleep_schedule,
            rp.cleanliness_preference,
            rp.updated_at,
            -- Score Components
            CASE WHEN rp.preferred_city_id = t.preferred_city_id AND rp.preferred_city_id IS NOT NULL THEN 25 ELSE 0 END AS city_score,
            CASE WHEN rp.budget_min <= t.budget_max AND t.budget_min <= rp.budget_max THEN 25 ELSE 0 END AS budget_score,
            CASE WHEN rp.food_preference = t.food_preference OR rp.food_preference = 'no_preference' OR t.food_preference = 'no_preference' THEN 15 ELSE 0 END AS food_score,
            CASE WHEN rp.smoking_preference = t.smoking_preference OR rp.smoking_preference = 'no_preference' OR t.smoking_preference = 'no_preference' THEN 10 ELSE 0 END AS smoking_score,
            CASE WHEN rp.pets_preference = t.pets_preference OR rp.pets_preference = 'no_preference' OR t.pets_preference = 'no_preference' THEN 10 ELSE 0 END AS pets_score,
            CASE WHEN rp.sleep_schedule = t.sleep_schedule OR rp.sleep_schedule = 'no_preference' OR t.sleep_schedule = 'no_preference' THEN 10 ELSE 0 END AS sleep_score,
            CASE WHEN rp.cleanliness_preference = t.cleanliness_preference OR rp.cleanliness_preference = 'no_preference' OR t.cleanliness_preference = 'no_preference' THEN 5 ELSE 0 END AS cleanliness_score,
            -- Total Match Score (out of 100)
            (
                CASE WHEN rp.preferred_city_id = t.preferred_city_id AND rp.preferred_city_id IS NOT NULL THEN 25 ELSE 0 END
                + CASE WHEN rp.budget_min <= t.budget_max AND t.budget_min <= rp.budget_max THEN 25 ELSE 0 END
                + CASE WHEN rp.food_preference = t.food_preference OR rp.food_preference = 'no_preference' OR t.food_preference = 'no_preference' THEN 15 ELSE 0 END
                + CASE WHEN rp.smoking_preference = t.smoking_preference OR rp.smoking_preference = 'no_preference' OR t.smoking_preference = 'no_preference' THEN 10 ELSE 0 END
                + CASE WHEN rp.pets_preference = t.pets_preference OR rp.pets_preference = 'no_preference' OR t.pets_preference = 'no_preference' THEN 10 ELSE 0 END
                + CASE WHEN rp.sleep_schedule = t.sleep_schedule OR rp.sleep_schedule = 'no_preference' OR t.sleep_schedule = 'no_preference' THEN 10 ELSE 0 END
                + CASE WHEN rp.cleanliness_preference = t.cleanliness_preference OR rp.cleanliness_preference = 'no_preference' OR t.cleanliness_preference = 'no_preference' THEN 5 ELSE 0 END
            ) AS match_score
        FROM app.roommate_profile rp
        JOIN app.app_user u ON u.user_id = rp.user_id
        LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
        CROSS JOIN target t
        WHERE u.user_id <> {int(target_user_id)}
    """

@roommates_bp.route('/roommates', methods=['GET'])
def get_roommates():
    current_user_id = get_current_user_id()
    
    city_id = request.args.get('city_id', type=int)
    food_pref = request.args.get('food_preference', type=str)
    smoking_pref = request.args.get('smoking_preference', type=str)
    pets_pref = request.args.get('pets_preference', type=str)
    sleep_pref = request.args.get('sleep_schedule', type=str)
    cleanliness_pref = request.args.get('cleanliness_preference', type=str)
    max_budget = request.args.get('max_budget', type=float)
    min_score = request.args.get('min_score', default=0, type=int)
    sort_by = request.args.get('sort_by', default='match_desc', type=str)
    
    if current_user_id:
        base_query = calculate_compatibility_sql(current_user_id)
        where_conditions = ["1=1"]
        params = []
        
        if city_id:
            where_conditions.append("city_id = %s")
            params.append(city_id)
        if food_pref and food_pref != 'no_preference':
            where_conditions.append("(food_preference = %s OR food_preference = 'no_preference')")
            params.append(food_pref)
        if smoking_pref and smoking_pref != 'no_preference':
            where_conditions.append("(smoking_preference = %s OR smoking_preference = 'no_preference')")
            params.append(smoking_pref)
        if pets_pref and pets_pref != 'no_preference':
            where_conditions.append("(pets_preference = %s OR pets_preference = 'no_preference')")
            params.append(pets_pref)
        if sleep_pref and sleep_pref != 'no_preference':
            where_conditions.append("(sleep_schedule = %s OR sleep_schedule = 'no_preference')")
            params.append(sleep_pref)
        if cleanliness_pref and cleanliness_pref != 'no_preference':
            where_conditions.append("(cleanliness_preference = %s OR cleanliness_preference = 'no_preference')")
            params.append(cleanliness_pref)
        if max_budget is not None:
            where_conditions.append("budget_min <= %s")
            params.append(max_budget)
        if min_score > 0:
            where_conditions.append("match_score >= %s")
            params.append(min_score)
            
        where_sql = " AND ".join(where_conditions)
        
        # Check connection request status between current user and candidates
        full_sql = f"""
            WITH ranked AS (
                {base_query}
            )
            SELECT 
                r.*,
                rr.request_id,
                rr.request_status,
                rr.requester_user_id,
                CASE 
                    WHEN rr.request_id IS NOT NULL AND rr.requester_user_id = {int(current_user_id)} THEN 'outgoing'
                    WHEN rr.request_id IS NOT NULL AND rr.recipient_user_id = {int(current_user_id)} THEN 'incoming'
                    ELSE 'none'
                END AS connection_direction
            FROM ranked r
            LEFT JOIN app.roommate_request rr ON 
                (rr.requester_user_id = {int(current_user_id)} AND rr.recipient_user_id = r.user_id)
                OR (rr.recipient_user_id = {int(current_user_id)} AND rr.requester_user_id = r.user_id)
            WHERE {where_sql}
            ORDER BY match_score DESC, full_name ASC;
        """
        candidates = query_all(full_sql, tuple(params))
        
    else:
        # Unauthenticated browse view (no match score relative to user)
        where_conditions = ["1=1"]
        params = []
        if city_id:
            where_conditions.append("rp.preferred_city_id = %s")
            params.append(city_id)
        if food_pref and food_pref != 'no_preference':
            where_conditions.append("rp.food_preference = %s")
            params.append(food_pref)
        if smoking_pref and smoking_pref != 'no_preference':
            where_conditions.append("rp.smoking_preference = %s")
            params.append(smoking_pref)
        if pets_pref and pets_pref != 'no_preference':
            where_conditions.append("rp.pets_preference = %s")
            params.append(pets_pref)
        if max_budget is not None:
            where_conditions.append("rp.budget_min <= %s")
            params.append(max_budget)
            
        where_sql = " AND ".join(where_conditions)
        
        sql = f"""
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                c.city_id,
                c.city_name AS preferred_city_name,
                rp.budget_min,
                rp.budget_max,
                rp.move_in_date,
                rp.food_preference,
                rp.smoking_preference,
                rp.pets_preference,
                rp.sleep_schedule,
                rp.cleanliness_preference,
                rp.updated_at,
                NULL AS match_score,
                'none' AS connection_direction,
                NULL AS request_status
            FROM app.roommate_profile rp
            JOIN app.app_user u ON u.user_id = rp.user_id
            LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
            WHERE {where_sql}
            ORDER BY u.user_id ASC;
        """
        candidates = query_all(sql, tuple(params))
        
    return jsonify({
        "roommates": candidates,
        "is_authenticated": bool(current_user_id)
    }), 200

@roommates_bp.route('/roommates/<int:candidate_user_id>', methods=['GET'])
def get_roommate_details(candidate_user_id: int):
    current_user_id = get_current_user_id()
    
    if current_user_id and current_user_id != candidate_user_id:
        sql = f"""
            WITH ranked AS (
                {calculate_compatibility_sql(current_user_id)}
            )
            SELECT 
                r.*,
                rr.request_id,
                rr.request_status,
                rr.requester_user_id,
                CASE 
                    WHEN rr.request_id IS NOT NULL AND rr.requester_user_id = {int(current_user_id)} THEN 'outgoing'
                    WHEN rr.request_id IS NOT NULL AND rr.recipient_user_id = {int(current_user_id)} THEN 'incoming'
                    ELSE 'none'
                END AS connection_direction
            FROM ranked r
            LEFT JOIN app.roommate_request rr ON 
                (rr.requester_user_id = {int(current_user_id)} AND rr.recipient_user_id = r.user_id)
                OR (rr.recipient_user_id = {int(current_user_id)} AND rr.requester_user_id = r.user_id)
            WHERE r.user_id = %s;
        """
        profile = query_one(sql, (candidate_user_id,))
    else:
        profile = query_one("""
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                c.city_id,
                c.city_name AS preferred_city_name,
                rp.budget_min,
                rp.budget_max,
                rp.move_in_date,
                rp.food_preference,
                rp.smoking_preference,
                rp.pets_preference,
                rp.sleep_schedule,
                rp.cleanliness_preference,
                rp.updated_at,
                NULL AS match_score
            FROM app.roommate_profile rp
            JOIN app.app_user u ON u.user_id = rp.user_id
            LEFT JOIN app.city c ON c.city_id = rp.preferred_city_id
            WHERE rp.user_id = %s;
        """, (candidate_user_id,))
        
    if not profile:
        return jsonify({"error": "Not Found", "message": "Roommate profile not found"}), 404
        
    return jsonify({"profile": profile}), 200

@roommates_bp.route('/roommates/profile', methods=['PUT'])
@login_required
def update_own_preferences():
    user_id = get_current_user_id()
    data = request.get_json() or {}
    
    preferred_city_id = data.get('preferred_city_id')
    budget_min = data.get('budget_min', 0)
    budget_max = data.get('budget_max')
    move_in_date = data.get('move_in_date') or None
    food_preference = data.get('food_preference', 'no_preference')
    smoking_preference = data.get('smoking_preference', 'no_preference')
    pets_preference = data.get('pets_preference', 'no_preference')
    sleep_schedule = data.get('sleep_schedule', 'no_preference')
    cleanliness_preference = data.get('cleanliness_preference', 'no_preference')
    
    if budget_max is None or float(budget_max) < 0:
        return jsonify({"error": "Validation Error", "message": "Budget maximum must be a non-negative number"}), 400
    if float(budget_min) > float(budget_max):
        return jsonify({"error": "Validation Error", "message": "Minimum budget cannot exceed maximum budget"}), 400
        
    updated_profile = execute_returning_one("""
        INSERT INTO app.roommate_profile (
            user_id, preferred_city_id, budget_min, budget_max, move_in_date,
            food_preference, smoking_preference, pets_preference,
            sleep_schedule, cleanliness_preference, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) DO UPDATE SET
            preferred_city_id = EXCLUDED.preferred_city_id,
            budget_min = EXCLUDED.budget_min,
            budget_max = EXCLUDED.budget_max,
            move_in_date = EXCLUDED.move_in_date,
            food_preference = EXCLUDED.food_preference,
            smoking_preference = EXCLUDED.smoking_preference,
            pets_preference = EXCLUDED.pets_preference,
            sleep_schedule = EXCLUDED.sleep_schedule,
            cleanliness_preference = EXCLUDED.cleanliness_preference,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *;
    """, (
        user_id, preferred_city_id, budget_min, budget_max, move_in_date,
        food_preference, smoking_preference, pets_preference,
        sleep_schedule, cleanliness_preference
    ))
    
    return jsonify({
        "message": "Roommate preferences saved successfully",
        "profile": updated_profile
    }), 200

@roommates_bp.route('/roommates/request', methods=['POST'])
@login_required
def send_connection_request():
    requester_id = get_current_user_id()
    data = request.get_json() or {}
    recipient_id = data.get('recipient_user_id')
    message = (data.get('message') or '').strip()
    
    if not recipient_id:
        return jsonify({"error": "Validation Error", "message": "Recipient user ID is required"}), 400
    if requester_id == recipient_id:
        return jsonify({"error": "Bad Request", "message": "You cannot send a roommate request to yourself"}), 400
        
    recipient = query_one("SELECT user_id FROM app.app_user WHERE user_id = %s;", (recipient_id,))
    if not recipient:
        return jsonify({"error": "Not Found", "message": "Recipient user does not exist"}), 404
        
    # Check for duplicate connection request in either direction
    existing = query_one("""
        SELECT request_id, requester_user_id, recipient_user_id, request_status
        FROM app.roommate_request
        WHERE (requester_user_id = %s AND recipient_user_id = %s)
           OR (requester_user_id = %s AND recipient_user_id = %s);
    """, (requester_id, recipient_id, recipient_id, requester_id))
    
    if existing:
        return jsonify({
            "error": "Conflict",
            "message": f"A connection request already exists with status: {existing['request_status']}",
            "existing_request": existing
        }), 409
        
    new_request = execute_returning_one("""
        INSERT INTO app.roommate_request (requester_user_id, recipient_user_id, message, request_status)
        VALUES (%s, %s, %s, 'pending')
        RETURNING request_id, requester_user_id, recipient_user_id, message, request_status, created_at;
    """, (requester_id, recipient_id, message or 'Hi, I saw your roommate profile and would love to connect!'))
    
    return jsonify({
        "message": "Connection request sent successfully",
        "request": new_request
    }), 201

@roommates_bp.route('/roommates/request/<int:request_id>', methods=['PATCH'])
@login_required
def update_connection_request(request_id: int):
    current_user_id = get_current_user_id()
    data = request.get_json() or {}
    new_status = data.get('status')
    
    valid_statuses = ('accepted', 'declined', 'cancelled')
    if new_status not in valid_statuses:
        return jsonify({"error": "Validation Error", "message": f"Status must be one of: {', '.join(valid_statuses)}"}), 400
        
    req = query_one("SELECT * FROM app.roommate_request WHERE request_id = %s;", (request_id,))
    if not req:
        return jsonify({"error": "Not Found", "message": "Request does not exist"}), 404
        
    # Permission logic
    if new_status == 'cancelled':
        # Only requester can cancel
        if req['requester_user_id'] != current_user_id:
            return jsonify({"error": "Forbidden", "message": "Only the sender can cancel this request"}), 403
    elif new_status in ('accepted', 'declined'):
        # Only recipient can accept/decline
        if req['recipient_user_id'] != current_user_id:
            return jsonify({"error": "Forbidden", "message": "Only the recipient can respond to this request"}), 403
            
    updated = execute_returning_one("""
        UPDATE app.roommate_request
        SET request_status = %s
        WHERE request_id = %s
        RETURNING *;
    """, (new_status, request_id))
    
    return jsonify({
        "message": f"Connection request {new_status} successfully",
        "request": updated
    }), 200
