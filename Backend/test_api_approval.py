#!/usr/bin/env python3
"""
API test script to verify admin approval endpoints
"""

import requests
import json
import os
import sys

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "csr@genailakes.com"
ADMIN_PASSWORD = "password"  # Replace with actual admin password

def test_admin_approval_apis():
    """Test the admin approval API endpoints"""
    
    print("🔄 Testing Admin Approval APIs...")
    
    # Step 1: Login as admin
    print("1. Logging in as admin...")
    login_response = requests.post(f"{BASE_URL}/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Admin login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    login_data = login_response.json()
    token = login_data.get("access_token")
    
    if not token:
        print("❌ No access token received")
        return
    
    print(f"✅ Admin login successful")
    
    # Headers for authenticated requests
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Get pending users
    print("2. Getting pending users...")
    pending_response = requests.get(f"{BASE_URL}/admin/pending-users", headers=headers)
    
    if pending_response.status_code != 200:
        print(f"❌ Failed to get pending users: {pending_response.status_code}")
        print(f"Response: {pending_response.text}")
        return
    
    pending_users = pending_response.json()
    print(f"✅ Found {len(pending_users)} pending users")
    
    for user in pending_users:
        print(f"  - {user['email']} ({user['role']}): is_approved={user['is_approved']}")
    
    # Step 3: Test approval of first pending user (if any)
    if pending_users:
        test_user = pending_users[0]
        user_id = test_user['id']
        user_email = test_user['email']
        user_role = test_user['role']
        
        print(f"3. Testing approval of user: {user_email} ({user_role})")
        
        # Use the generic approve-user endpoint
        approve_response = requests.post(
            f"{BASE_URL}/admin/approve-user/{user_id}", 
            headers=headers
        )
        
        if approve_response.status_code == 200:
            approve_data = approve_response.json()
            print(f"✅ User approval successful: {approve_data['message']}")
            
            # Verify the user is now approved
            print("4. Verifying approval status...")
            verify_response = requests.get(f"{BASE_URL}/admin/pending-users", headers=headers)
            if verify_response.status_code == 200:
                updated_pending = verify_response.json()
                # Check if the user is still in pending list
                still_pending = any(u['id'] == user_id for u in updated_pending)
                if not still_pending:
                    print(f"✅ User {user_email} is no longer in pending list")
                else:
                    print(f"❌ User {user_email} is still in pending list")
            
        else:
            print(f"❌ User approval failed: {approve_response.status_code}")
            print(f"Response: {approve_response.text}")
    else:
        print("3. No pending users to test approval with")
    
    print("✅ API testing completed")

if __name__ == "__main__":
    test_admin_approval_apis()