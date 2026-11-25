import json
import pytest

def test_health(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'
    assert data['database'] == 'connected'
    assert data['stats']['total_listings'] >= 12847

def test_cities_reference(client):
    res = client.get('/api/reference/cities')
    assert res.status_code == 200
    data = res.get_json()
    assert 'cities' in data
    city_names = [c['city_name'] for c in data['cities']]
    assert 'Delhi' in city_names
    assert 'Mumbai' in city_names
    assert 'Pune' in city_names

def test_amenities_reference(client):
    res = client.get('/api/reference/amenities')
    assert res.status_code == 200
    data = res.get_json()
    assert len(data['amenities']) == 12

def test_listings_search(client):
    res = client.get('/api/listings?city_id=1&max_rent=15000&per_page=5')
    assert res.status_code == 200
    data = res.get_json()
    assert 'listings' in data
    assert 'pagination' in data
    assert len(data['listings']) <= 5
    for item in data['listings']:
        assert item['city_name'] == 'Delhi'
        assert float(item['rent_amount']) <= 15000

def test_listing_detail(client):
    res = client.get('/api/listings/1')
    assert res.status_code == 200
    data = res.get_json()
    assert 'listing' in data
    assert data['listing']['listing_id'] == 1
    assert data['listing']['data_origin'] == 'public_dataset'
    assert data['listing']['availability_status'] == 'unverified'

def test_demo_users_and_login(client):
    # 1. Fetch demo users
    res = client.get('/api/auth/demo-users')
    assert res.status_code == 200
    demo_accounts = res.get_json()['demo_accounts']
    assert len(demo_accounts) >= 4
    
    # 2. Login as Aarav
    login_res = client.post('/api/auth/login', json={
        "email": "aarav.demo@example.test",
        "password": "Demo@123"
    })
    assert login_res.status_code == 200
    user_info = login_res.get_json()['user']
    assert user_info['full_name'] == 'Aarav Demo'
    
    # 3. Check /api/auth/me with session
    me_res = client.get('/api/auth/me')
    assert me_res.status_code == 200
    me_data = me_res.get_json()
    assert me_data['user']['email'] == 'aarav.demo@example.test'
    assert me_data['profile'] is not None

def test_roommate_compatibility(client):
    # Login as Aarav
    client.post('/api/auth/login', json={
        "email": "aarav.demo@example.test",
        "password": "Demo@123"
    })
    
    # Fetch roommate matches
    res = client.get('/api/roommates')
    assert res.status_code == 200
    data = res.get_json()
    assert data['is_authenticated'] is True
    assert len(data['roommates']) > 0
    # Top match should have a match_score
    top = data['roommates'][0]
    assert 'match_score' in top
    assert top['match_score'] is not None
    assert top['match_score'] >= 0

def test_toggle_save_listing(client):
    # Login as Kabir
    client.post('/api/auth/login', json={
        "email": "kabir.demo@example.test",
        "password": "Demo@123"
    })
    
    # Toggle save listing 2
    save_res = client.post('/api/listings/2/save')
    assert save_res.status_code == 200
    state1 = save_res.get_json()['is_saved']
    
    # Toggle again
    save_res2 = client.post('/api/listings/2/save')
    assert save_res2.status_code == 200
    state2 = save_res2.get_json()['is_saved']
    assert state1 != state2

def test_enquiry_submission(client):
    # Login as Kabir
    client.post('/api/auth/login', json={
        "email": "kabir.demo@example.test",
        "password": "Demo@123"
    })
    
    res = client.post('/api/listings/5/enquiry', json={
        "message": "Hi, I am interested in visiting this 2 BHK next Monday."
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['enquiry']['enquiry_status'] == 'new'
    assert 'visiting this 2 BHK' in data['enquiry']['message']

def test_owner_create_and_manage_listing(client):
    # Login as Aarav
    client.post('/api/auth/login', json={
        "email": "aarav.demo@example.test",
        "password": "Demo@123"
    })
    
    # Create listing
    create_res = client.post('/api/owner/listings', json={
        "title": "Aarav Modern Sunny Room in Jamia",
        "locality_id": 1,
        "listing_kind": "private_room",
        "rent_amount": 14000,
        "security_deposit": 28000,
        "size_sqft": 350,
        "bedrooms": 1,
        "bathrooms": 1,
        "balconies": 1,
        "furnishing_status": "furnished",
        "description": "Sunny private room with balcony and attached bathroom.",
        "amenity_ids": [1, 2] # Wi-Fi and AC
    })
    assert create_res.status_code == 201
    listing_id = create_res.get_json()['listing_id']
    
    # Check details
    detail_res = client.get(f'/api/listings/{listing_id}')
    assert detail_res.status_code == 200
    l_data = detail_res.get_json()['listing']
    assert l_data['data_origin'] == 'user_submitted'
    assert l_data['availability_status'] == 'available'
    assert len(l_data['amenities']) == 2
    
    # Change availability to reserved
    patch_res = client.patch(f'/api/owner/listings/{listing_id}/availability', json={
        "availability_status": "reserved"
    })
    assert patch_res.status_code == 200

def test_dashboard_summary(client):
    # Login as Aarav
    client.post('/api/auth/login', json={
        "email": "aarav.demo@example.test",
        "password": "Demo@123"
    })
    
    res = client.get('/api/dashboard/summary')
    assert res.status_code == 200
    data = res.get_json()
    assert 'profile' in data
    assert 'saved_listings' in data
    assert 'enquiries' in data
    assert 'incoming_requests' in data
    assert 'outgoing_requests' in data
    assert 'recommended_roommates' in data

def test_admin_analytics(client):
    res = client.get('/api/admin/analytics')
    assert res.status_code == 200
    data = res.get_json()
    assert 'totals' in data
    assert 'city_stats' in data
    assert data['totals']['total_listings'] >= 12847
