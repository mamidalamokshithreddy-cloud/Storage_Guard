#!/usr/bin/env python3
"""
Test script to verify admin approval functionality matches frontend calls
"""
import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

def get_admin_token():
    """Login as admin and get token"""
    login_url = f"{BASE_URL}/admin/auth/login"
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    print(f"🔑 Logging in admin...")
    response = requests.post(login_url, json=login_data)
    
    if response.status_code == 200:
        result = response.json()
        token = result.get("access_token")
        print(f"✅ Admin login successful")
        return token
    else:
        print(f"❌ Admin login failed: {response.status_code} - {response.text}")
        return None

def get_pending_users(token):
    """Get list of pending users"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to get farmers
    farmers_url = f"{BASE_URL}/admin/farmers"
    response = requests.get(farmers_url, headers=headers)
    
    if response.status_code == 200:
        farmers = response.json()
        print(f"📋 Found {len(farmers)} farmers")
        
        # Find unapproved farmers
        pending_farmers = [f for f in farmers if not f.get('is_approved', False)]
        print(f"📋 Found {len(pending_farmers)} pending farmers")
        
        for farmer in pending_farmers[:3]:  # Show first 3
            print(f"   - {farmer.get('full_name')} ({farmer.get('email')}) - ID: {farmer.get('id')}")
        
        return pending_farmers
    else:
        print(f"❌ Failed to get farmers: {response.status_code} - {response.text}")
        return []

def test_approve_user(token, user_id, user_type="farmer"):
    """Test the approve-user endpoint that frontend should call"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # This is the endpoint the frontend should call for approval
    approve_url = f"{BASE_URL}/admin/approve-user/{user_id}"
    
    print(f"🔄 Testing approval endpoint: {approve_url}")
    print(f"🔄 Request: POST {approve_url} (no body)")
    
    response = requests.post(approve_url, headers=headers)
    
    print(f"📋 Response status: {response.status_code}")
    print(f"📋 Response body: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Approval successful: {result.get('message')}")
        return True
    else:
        print(f"❌ Approval failed: {response.status_code} - {response.text}")
        return False

def verify_approval_in_db(token, user_id):
    """Verify the user is approved in database"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get user details to check is_approved status
    user_url = f"{BASE_URL}/admin/farmers"
    response = requests.get(user_url, headers=headers)
    
    if response.status_code == 200:
        farmers = response.json()
        user = next((f for f in farmers if f.get('id') == user_id), None)
        
        if user:
            is_approved = user.get('is_approved', False)
            print(f"📋 User approval status in DB: is_approved={is_approved}")
            return is_approved
        else:
            print(f"❌ User {user_id} not found")
            return False
    else:
        print(f"❌ Failed to verify user status: {response.status_code}")
        return False

def main():
    print("🚀 Testing Frontend-Backend Admin Approval Integration")
    print("=" * 60)
    
    # Step 1: Get admin token
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin token")
        sys.exit(1)
    
    # Step 2: Get pending users
    pending_users = get_pending_users(token)
    if not pending_users:
        print("ℹ️ No pending users found to test with")
        return
    
    # Step 3: Test approval with first pending user
    test_user = pending_users[0]
    user_id = test_user.get('id')
    user_name = test_user.get('full_name')
    user_email = test_user.get('email')
    
    print(f"\n🔄 Testing approval for user:")
    print(f"   Name: {user_name}")
    print(f"   Email: {user_email}")
    print(f"   ID: {user_id}")
    print(f"   Current status: is_approved={test_user.get('is_approved', False)}")
    
    # Step 4: Test the approval
    success = test_approve_user(token, user_id)
    
    if success:
        # Step 5: Verify in database
        print(f"\n🔍 Verifying approval in database...")
        approved = verify_approval_in_db(token, user_id)
        
        if approved:
            print(f"✅ SUCCESS: User {user_name} is now approved in database!")
            print(f"✅ The frontend should now work correctly")
        else:
            print(f"❌ FAILURE: User approval didn't persist to database")
    
    print("\n" + "=" * 60)
    print("🏁 Test completed")

if __name__ == "__main__":
    main()