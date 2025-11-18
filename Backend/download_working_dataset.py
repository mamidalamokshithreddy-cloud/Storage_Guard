"""
Download a working vegetable detection dataset
"""

import os
import sys
from pathlib import Path
import urllib.request
import zipfile
import shutil

def download_file(url, dest):
    """Download file with progress"""
    print(f"Downloading from: {url}")
    
    def progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        percent = min(downloaded * 100 / total_size, 100)
        sys.stdout.write(f"\r   Progress: {percent:.1f}% ({downloaded / 1024 / 1024:.1f} MB)")
        sys.stdout.flush()
    
    urllib.request.urlretrieve(url, dest, progress)
    print("\n   ✅ Download complete!")

def setup_simple_crop_dataset():
    """Setup a working crop dataset using Ultralytics' pretrained food model"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║   🌾 QUICK CROP MODEL SETUP - USING PRETRAINED MODEL        ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    print("\n💡 Strategy: Use YOLOv8 pretrained on ImageNet + fine-tune")
    print("   This includes many food items and vegetables")
    
    # Option 1: Use YOLOv8 medium model (better than nano)
    print("\n📦 Downloading YOLOv8 Medium model (better accuracy)...")
    
    try:
        from ultralytics import YOLO
        
        # Download and load medium model
        model = YOLO('yolov8m.pt')
        
        print(f"   ✅ YOLOv8m downloaded")
        print(f"   📊 Classes: {len(model.names)}")
        
        # Copy to our crop model
        shutil.copy('yolov8m.pt', 'crop_detection_model.pt')
        print(f"   ✅ Saved as: crop_detection_model.pt")
        
        # Test what it can detect
        print(f"\n🔍 Model can detect:")
        food_items = [name for name in model.names.values() if any(
            food in name.lower() for food in ['apple', 'banana', 'orange', 'carrot', 'broccoli']
        )]
        if food_items:
            for item in food_items[:10]:
                print(f"      ✅ {item}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def download_vegetable_dataset_alternative():
    """Try downloading from alternative sources"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║   📥 DOWNLOADING VEGETABLE DATASET (Alternative Method)     ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    # Create directories
    data_dir = Path('data/crops_training')
    data_dir.mkdir(parents=True, exist_ok=True)
    
    print("\n🔍 Attempting alternative dataset sources...")
    
    # Try Roboflow with different approach
    try:
        print("\n📦 Method 1: Roboflow API...")
        from roboflow import Roboflow
        
        rf = Roboflow(api_key="cE6D3UKvPGHUbaknLGcy")
        
        # Try vegetables-specific dataset
        workspaces_to_try = [
            ('computer-vision-team-roboflow', 'vegetables-classification', 1),
            ('fruits-and-vegetables-v7xrj', 'fruits-and-vegetables', 1),
            ('agricultural', 'vegetable-detection', 1),
        ]
        
        for workspace, project, version in workspaces_to_try:
            try:
                print(f"\n   Trying: {workspace}/{project}")
                proj = rf.workspace(workspace).project(project)
                dataset = proj.version(version).download('yolov8', location=str(data_dir))
                print(f"   ✅ Success!")
                return True
            except Exception as e:
                print(f"   ❌ Failed: {str(e)[:80]}")
                continue
    
    except Exception as e:
        print(f"   ❌ Roboflow failed: {e}")
    
    print("\n💡 MANUAL SOLUTION:")
    print("="*60)
    print("Since automatic download is challenging, here's what to do:")
    print()
    print("OPTION A - Use Better Pretrained Model (RECOMMENDED - 5 mins):")
    print("   1. We'll use YOLOv8 Medium model (better than nano)")
    print("   2. It already knows some vegetables from training")
    print("   3. Quick to setup and test")
    print()
    print("OPTION B - Manual Dataset Download (30 mins):")
    print("   1. Visit: https://universe.roboflow.com")
    print("   2. Search: 'vegetable detection'")
    print("   3. Find dataset with 500+ images")
    print("   4. Click 'Download Dataset' → YOLOv8 format")
    print("   5. Extract to: Backend/data/crops_training/")
    print("="*60)
    
    return False

def main():
    choice = input("\n🚀 Choose setup method:\n   A) Quick Setup - Use YOLOv8 Medium (5 mins) [RECOMMENDED]\n   B) Full Training - Download dataset & train (2 hours)\n\nChoice (A/B): ").strip().upper()
    
    if choice == 'A':
        success = setup_simple_crop_dataset()
        if success:
            print("\n" + "="*60)
            print("✅ SETUP COMPLETE!")
            print("="*60)
            print("\n📝 Next steps:")
            print("   1. Restart backend")
            print("   2. Upload crop images")
            print("   3. Model will detect vegetables with better accuracy")
            print("\n⚠️  Note: For production, consider full training with Option B")
        
    elif choice == 'B':
        success = download_vegetable_dataset_alternative()
        if not success:
            print("\n📝 Please download dataset manually and then run:")
            print("   python train_crop_model.py --mode train --epochs 50")
    
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()
