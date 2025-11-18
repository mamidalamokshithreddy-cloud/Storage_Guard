#!/usr/bin/env python3
"""
Test script to verify that AgriCopilot registration creates both User and AgriCopilot entries.
"""

import sys
import os
from sqlalchemy import text

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.connections.postgres_connection import get_db

def test_agri_copilot_data_integrity():
    print("🔍 Testing AgriCopilot data integrity...")
    
    # Get database connection
    db = next(get_db())
    
    try:
        print("\n📋 Checking AgriCopilot -> User relationship integrity:")
        
        # Get all AgriCopilots and check if they have corresponding Users
        agri_copilots_query = text("""
            SELECT 
                ac.id,
                ac.custom_id,
                ac.email,
                ac.full_name,
                ac.user_id,
                u.id as user_exists,
                u.email as user_email,
                u.role as user_role
            FROM agri_copilots ac
            LEFT JOIN users u ON ac.user_id = u.id
            ORDER BY ac.created_at DESC;
        """)
        
        result = db.execute(agri_copilots_query)
        copilots = result.fetchall()
        
        if not copilots:
            print("  ℹ️ No AgriCopilots found in database")
            return True
        
        print(f"  📊 Found {len(copilots)} AgriCopilot(s)")
        
        issues_found = []
        
        for copilot in copilots:
            copilot_id = copilot[0]
            copilot_email = copilot[2]
            user_id = copilot[4]
            user_exists = copilot[5]
            user_email = copilot[6]
            user_role = copilot[7]
            
            print(f"\n  🧑‍🌾 AgriCopilot: {copilot_email}")
            print(f"    - AgriCopilot ID: {copilot_id}")
            print(f"    - User ID reference: {user_id}")
            
            if user_exists:
                print(f"    - ✅ User entry exists: {user_email}")
                print(f"    - User role: {user_role}")
                
                if user_email != copilot_email:
                    issue = f"Email mismatch: AgriCopilot({copilot_email}) vs User({user_email})"
                    print(f"    - ❌ {issue}")
                    issues_found.append(issue)
                
                if user_role != 'agri_copilot':
                    issue = f"Role mismatch: Expected 'agri_copilot', got '{user_role}'"
                    print(f"    - ❌ {issue}")
                    issues_found.append(issue)
                    
            else:
                issue = f"Missing User entry for AgriCopilot: {copilot_email} (ID: {copilot_id})"
                print(f"    - ❌ {issue}")
                issues_found.append(issue)
        
        # Summary
        if issues_found:
            print(f"\n❌ Found {len(issues_found)} issue(s):")
            for issue in issues_found:
                print(f"  - {issue}")
            return False
        else:
            print(f"\n✅ All AgriCopilots have proper User entries!")
            return True
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_agri_copilot_data_integrity()
    sys.exit(0 if success else 1)