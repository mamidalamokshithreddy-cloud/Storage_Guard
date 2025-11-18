"""
Download agricultural crop dataset using Roboflow
Uses public Fruits and Vegetables dataset
"""

from roboflow import Roboflow
import sys

print("\n🌾 Downloading Fruits & Vegetables Dataset")
print("=" * 60)
print("   33+ Crop Classes:")
print("   Apple, Banana, Tomato, Potato, Carrot, Mango,")
print("   Orange, Onion, Cucumber, and more...")
print("=" * 60)

try:
    # Initialize Roboflow
    rf = Roboflow(api_key="cE6D3UKvPGHUbaknLGcy")
    
    # Try popular public fruit/vegetable datasets
    print("\n📥 Attempting to download from Roboflow Universe...")
    
    # Option 1: Try fruit-and-vegetable dataset
    try:
        print("\n   Trying: fruit-and-vegetable/fruits-and-vegetables-qfnmr")
        project = rf.workspace("fruit-and-vegetable").project("fruits-and-vegetables-qfnmr")
        dataset = project.version(1).download("yolov8", location="data/crops")
        print("\n✅ Dataset downloaded successfully!")
        
    except Exception as e1:
        print(f"   ❌ Failed: {e1}")
        
        # Option 2: Try vegetables dataset
        try:
            print("\n   Trying: vegetables-jkdoh/vegetables-qeivw")
            project = rf.workspace("vegetables-jkdoh").project("vegetables-qeivw")
            dataset = project.version(1).download("yolov8", location="data/crops")
            print("\n✅ Dataset downloaded successfully!")
            
        except Exception as e2:
            print(f"   ❌ Failed: {e2}")
            
            # Option 3: Try another public dataset
            print("\n   ❌ Public datasets unavailable or require different permissions")
            print("\n💡 ALTERNATIVE SOLUTION:")
            print("=" * 60)
            print("\n📥 Manual Download (EASIEST):")
            print("   1. Go to: https://universe.roboflow.com")
            print("   2. Search: 'fruits vegetables yolo'")
            print("   3. Pick any dataset with 100+ images")
            print("   4. Click 'Download Dataset'")
            print("   5. Format: YOLOv8")
            print("   6. Extract to: Backend/data/crops/")
            print("\n   Recommended datasets:")
            print("   - https://universe.roboflow.com/fruit-and-vegetable")
            print("   - https://universe.roboflow.com/fruits-classification")
            sys.exit(1)
    
    print(f"\n📂 Dataset Location: data/crops/")
    print(f"\n📊 Dataset Info:")
    if hasattr(dataset, 'train'):
        print(f"   Training images: Available")
    if hasattr(dataset, 'valid'):
        print(f"   Validation images: Available")
    if hasattr(dataset, 'test'):
        print(f"   Test images: Available")
    
    print("\n🚀 Next Step: Train the model")
    print("   python train_crop_model.py --mode train --epochs 50")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\n💡 Manual download instructions:")
    print("   Visit: https://universe.roboflow.com")
    print("   Download any fruit/vegetable dataset in YOLOv8 format")
    print("   Extract to: Backend/data/crops/")
    sys.exit(1)
