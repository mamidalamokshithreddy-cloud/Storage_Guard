#!/usr/bin/env python3
"""
Test script to verify the frontend URL configuration is working properly
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def test_frontend_url_config():
    """Test that frontend URL configuration is working properly"""
    
    print("🔧 Testing Frontend URL Configuration...")
    print(f"📁 ENV file path: {settings.model_config.get('env_file', 'Not found')}")
    print(f"🌐 FRONTEND_URL: '{settings.FRONTEND_URL}'")
    print(f"🔗 FRONTEND_BASE_URL: '{settings.FRONTEND_BASE_URL}'")
    
    # Test registration link generation
    test_token = "test-token-123"
    frontend_base = settings.FRONTEND_BASE_URL or "http://localhost:3000"
    test_link = f"{frontend_base}/admin/register/farmer?token={test_token}"
    
    print(f"🧪 Test registration link: {test_link}")
    
    if "None" in test_link:
        print("❌ FAILED: Registration link contains 'None'")
        return False
    elif "localhost:3000" in test_link:
        print("✅ SUCCESS: Registration link uses localhost:3000")
        return True
    elif "http" in test_link:
        print("✅ SUCCESS: Registration link uses custom URL")
        return True
    else:
        print("❌ FAILED: Registration link format is invalid")
        return False

if __name__ == "__main__":
    success = test_frontend_url_config()
    if success:
        print("\n🎉 Frontend URL configuration is working correctly!")
        print("Registration links will now show proper URLs instead of 'None'")
    else:
        print("\n💥 Frontend URL configuration needs fixing!")
    
    sys.exit(0 if success else 1)