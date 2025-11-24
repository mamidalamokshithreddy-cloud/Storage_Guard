"""
Test comprehensive defect analysis with bilingual output
"""
import requests
import json

API_BASE = "http://127.0.0.1:8000"

def test_ai_analysis_with_spoiled_batch():
    """Test analysis with spoiled tomato batch"""
    print("🧪 Testing comprehensive defect analysis...")
    print("=" * 80)
    
    # Test case: Upload a spoiled batch image
    # Note: You'll need to replace this with actual image path
    image_path = "test_tomato_spoiled.jpg"  # Replace with actual path
    
    try:
        with open(image_path, 'rb') as img:
            files = {'file': img}
            data = {
                'crop_type': 'Tomato',
                'quantity_kg': '50'
            }
            
            response = requests.post(
                f"{API_BASE}/storage-guard/analyze-and-suggest",
                files=files,
                data=data,
                params={
                    'farmer_id': 'test_farmer',
                    'farmer_lat': 17.385,
                    'farmer_lon': 78.486
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                report = result.get('quality_report') or result.get('report') or result.get('analysis')
                
                print("\n📊 ANALYSIS RESULTS:")
                print("-" * 80)
                print(f"Crop: {report.get('crop_name')}")
                print(f"Grade: {report.get('quality_grade')}")
                print(f"Freshness: {report.get('freshness')}")
                print(f"Shelf Life: {report.get('shelf_life_days')} days")
                print(f"Defects: {len(report.get('defects', []))}")
                
                print("\n📦 BOX CONDITION (English):")
                print("-" * 80)
                print(report.get('batch_assessment_english', 'N/A'))
                
                print("\n📦 పంట పరిస్థితి (Telugu):")
                print("-" * 80)
                print(report.get('batch_assessment_telugu', 'N/A'))
                
                print("\n🔍 DEFECT DETAILS (English):")
                print("-" * 80)
                print(report.get('defect_details_english', 'N/A'))
                
                print("\n🔍 లోపాల వివరణ (Telugu):")
                print("-" * 80)
                print(report.get('defect_details_telugu', 'N/A'))
                
                print("\n💡 FARMER ADVICE (English):")
                print("-" * 80)
                print(report.get('farmer_advice_english', 'N/A'))
                
                print("\n💡 రైతు సలహా (Telugu):")
                print("-" * 80)
                print(report.get('farmer_advice_telugu', 'N/A'))
                
                print("\n⚠️ IMMEDIATE ACTION (English):")
                print("-" * 80)
                print(report.get('immediate_action_english', 'N/A'))
                
                print("\n⚠️ వెంటనే చర్యలు (Telugu):")
                print("-" * 80)
                print(report.get('immediate_action_telugu', 'N/A'))
                
                print("\n" + "=" * 80)
                print("✅ Test completed successfully!")
                print("=" * 80)
                
                # Verify all bilingual fields are present
                required_fields = [
                    'defect_details_english', 'defect_details_telugu',
                    'batch_assessment_english', 'batch_assessment_telugu',
                    'farmer_advice_english', 'farmer_advice_telugu',
                    'immediate_action_english', 'immediate_action_telugu'
                ]
                
                missing_fields = [f for f in required_fields if not report.get(f)]
                
                if missing_fields:
                    print(f"\n⚠️ WARNING: Missing fields: {missing_fields}")
                else:
                    print("\n✅ All bilingual fields present!")
                
            else:
                print(f"❌ Error: {response.status_code}")
                print(response.text)
                
    except FileNotFoundError:
        print(f"❌ Image file not found: {image_path}")
        print("\n📝 To test properly:")
        print("1. Take/download a photo of spoiled produce (tomatoes, etc)")
        print("2. Save it in Backend/ directory")
        print("3. Update 'image_path' variable in this script")
        print("4. Run again: python test_comprehensive_analysis.py")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("""
    🧪 COMPREHENSIVE DEFECT ANALYSIS TEST
    =====================================
    
    This test verifies the enhanced bilingual AI analysis:
    - Detailed defect breakdown
    - Box condition assessment  
    - Farmer-friendly advice
    - Telugu + English output
    
    """)
    
    test_ai_analysis_with_spoiled_batch()
