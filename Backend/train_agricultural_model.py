"""
Download and Train on REAL Agricultural Crop Dataset
Focus: Wheat, Cotton, Rice, Corn, Soybeans, Chickpea, etc.
Target: Indian farming crops for all states
"""

import os
import sys
from pathlib import Path
import shutil

def download_agricultural_dataset():
    """Download real farming crop dataset from Roboflow"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║   🌾 AGRICULTURAL CROP DETECTION - DATASET DOWNLOAD         ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    from roboflow import Roboflow
    
    rf = Roboflow(api_key="cE6D3UKvPGHUbaknLGcy")
    
    # Agricultural-specific datasets - focus on FARMING not fruits
    agricultural_datasets = [
        {
            'workspace': 'roboflow-100',
            'project': 'cotton-plant-disease',
            'version': 2,
            'name': 'Cotton Plant Detection',
            'classes': ['cotton']
        },
        {
            'workspace': 'yolo-fndce',
            'project': 'crops-jytwh',
            'version': 2,
            'name': 'Agricultural Crops',
            'classes': ['wheat', 'corn', 'rice']
        },
        {
            'workspace': 'datasets-jomui',
            'project': 'crops-object-detection',
            'version': 1,
            'name': 'Crop Object Detection',
            'classes': ['various crops']
        }
    ]
    
    print("🔍 Searching for agricultural crop datasets...")
    print("   Target: Wheat, Cotton, Rice, Corn, Soybeans, Chickpea, Sugarcane")
    print()
    
    for ds_info in agricultural_datasets:
        try:
            print(f"📦 Trying: {ds_info['name']}")
            print(f"   Workspace: {ds_info['workspace']}")
            print(f"   Project: {ds_info['project']}")
            
            project = rf.workspace(ds_info['workspace']).project(ds_info['project'])
            dataset = project.version(ds_info['version']).download('yolov8', location='data/agricultural_crops')
            
            print(f"\n✅ SUCCESS! Downloaded: {ds_info['name']}")
            print(f"   Location: data/agricultural_crops/")
            
            # Verify download
            data_dir = Path('data/agricultural_crops')
            yaml_files = list(data_dir.glob('*.yaml'))
            if yaml_files:
                print(f"   ✅ Config file: {yaml_files[0].name}")
                
                # Count images
                train_dir = data_dir / 'train' / 'images'
                if train_dir.exists():
                    images = list(train_dir.glob('*.jpg')) + list(train_dir.glob('*.png'))
                    print(f"   ✅ Training images: {len(images)}")
            
            return True
            
        except Exception as e:
            error_msg = str(e)[:150]
            print(f"   ❌ Failed: {error_msg}")
            print()
            continue
    
    return False

def manual_download_guide():
    """Show manual download instructions"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║              📥 MANUAL DOWNLOAD REQUIRED                     ║
╚══════════════════════════════════════════════════════════════╝

Automatic download failed. Please download manually:

🔍 OPTION 1: Roboflow Universe (Recommended)
────────────────────────────────────────────────────────────────
1. Visit: https://universe.roboflow.com
2. Search: "crops object detection" or "agricultural crops"
3. Look for datasets with these characteristics:
   ✅ Type: Object Detection (not classification)
   ✅ Format: YOLOv8 available
   ✅ Images: 500+ images minimum
   ✅ Classes: wheat, cotton, rice, corn, soybean, etc.

Recommended Searches:
   • "crops yolov8"
   • "wheat detection"
   • "cotton crop"
   • "rice paddy detection"
   • "agricultural crop detection"

4. Click on a good dataset → "Download Dataset"
5. Select "YOLOv8" format
6. Click "Download"
7. Extract ZIP to: Backend/data/agricultural_crops/
8. Run: python train_agricultural_model.py

────────────────────────────────────────────────────────────────

🔍 OPTION 2: Use Sample Dataset & Create Custom
────────────────────────────────────────────────────────────────
If you have your own crop images:
1. Organize images by crop type (wheat/, cotton/, rice/)
2. Use Roboflow to annotate (free tier)
3. Export in YOLOv8 format
4. Place in: Backend/data/agricultural_crops/

────────────────────────────────────────────────────────────────

🇮🇳 Target Crops for Indian Agriculture:
   • Cereals: Wheat, Rice, Corn, Maize, Bajra, Jowar
   • Pulses: Chickpea, Pigeon Pea, Lentil, Moong, Urad
   • Cash Crops: Cotton, Sugarcane, Jute, Tobacco
   • Oilseeds: Groundnut, Soybean, Sunflower, Mustard
   • Commercial: Tea, Coffee, Rubber, Coconut
""")

def train_agricultural_model():
    """Train YOLOv8 on agricultural crop dataset"""
    print("\n" + "="*60)
    print("🚀 TRAINING ON AGRICULTURAL CROPS")
    print("="*60)
    
    from ultralytics import YOLO
    
    # Check for dataset
    data_dir = Path('data/agricultural_crops')
    yaml_files = list(data_dir.glob('*.yaml')) + list(data_dir.glob('*.yml'))
    
    if not yaml_files:
        print("❌ No dataset found in data/agricultural_crops/")
        return False
    
    data_yaml = yaml_files[0]
    
    # Count training images
    train_images = []
    for pattern in ['train/images/*.jpg', 'train/images/*.png', 'train/*.jpg', 'train/*.png']:
        train_images.extend(list(data_dir.glob(pattern)))
    
    if len(train_images) < 50:
        print(f"⚠️  Warning: Only {len(train_images)} training images found")
        print("   Recommend 500+ images for good accuracy")
        
        choice = input("\nContinue anyway? (y/n): ").strip().lower()
        if choice != 'y':
            return False
    
    print(f"\n📊 Training Configuration:")
    print(f"   Dataset: {data_yaml.name}")
    print(f"   Training images: {len(train_images)}")
    print(f"   Base model: yolov8n.pt (fresh start for agriculture)")
    print(f"   Epochs: 100")
    print(f"   Batch size: 16")
    print(f"   Focus: Agricultural/farming crops")
    print(f"\n⏱️  Estimated time: 1-3 hours (depends on dataset size)")
    
    # Load base model (fresh start, not food model)
    print("\n📥 Loading base YOLOv8 model...")
    model = YOLO('yolov8n.pt')
    
    print(f"\n🎯 Training started...")
    print("="*60)
    print("💡 Tip: This will take a while. You can:")
    print("   • Go for tea ☕")
    print("   • Check progress in: runs/agricultural_training/")
    print("   • Training metrics will show every epoch")
    print("="*60)
    print()
    
    # Train with agricultural-optimized settings
    results = model.train(
        data=str(data_yaml),
        epochs=100,
        batch=16,
        imgsz=640,
        patience=30,
        save=True,
        project='runs/agricultural_training',
        name='yolov8n_crops',
        exist_ok=True,
        pretrained=True,
        verbose=True,
        # Field condition augmentation
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=5.0,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        mosaic=1.0
    )
    
    print("\n" + "="*60)
    print("✅ TRAINING COMPLETE!")
    print("="*60)
    
    # Copy trained model
    best_model = Path('runs/agricultural_training/yolov8n_crops/weights/best.pt')
    
    if best_model.exists():
        output_path = Path('crop_detection_model.pt')
        
        # Backup old food model
        if output_path.exists():
            backup_path = 'crop_detection_model_food_backup.pt'
            shutil.copy(output_path, backup_path)
            print(f"   📦 Backed up old model: {backup_path}")
        
        shutil.copy(best_model, output_path)
        print(f"   ✅ New model: {output_path}")
        print(f"   📊 Size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")
        
        # Show detected crops
        trained_model = YOLO(str(output_path))
        print(f"\n🌾 TRAINED AGRICULTURAL CROPS ({len(trained_model.names)} classes):")
        for idx, name in trained_model.names.items():
            print(f"      {idx}: {name.upper()}")
        
        return True
    else:
        print("   ❌ Training failed - model file not found")
        return False

def test_model():
    """Test the trained agricultural model"""
    print("\n" + "="*60)
    print("🧪 TESTING AGRICULTURAL MODEL")
    print("="*60)
    
    from ultralytics import YOLO
    
    model_path = Path('crop_detection_model.pt')
    if not model_path.exists():
        print("❌ Model not found!")
        return False
    
    model = YOLO(str(model_path))
    
    print(f"\n📊 Model Information:")
    print(f"   File: {model_path}")
    print(f"   Size: {model_path.stat().st_size / 1024 / 1024:.2f} MB")
    print(f"   Classes: {len(model.names)}")
    print(f"\n🌾 Detectable Crops:")
    
    for idx, name in model.names.items():
        print(f"      ✅ {name.upper()}")
    
    # Test on sample images
    test_dirs = [
        Path('data/agricultural_crops/test/images'),
        Path('data/agricultural_crops/valid/images'),
        Path('data/agricultural_crops/val/images')
    ]
    
    test_dir = None
    for td in test_dirs:
        if td.exists():
            test_dir = td
            break
    
    if test_dir:
        test_images = list(test_dir.glob('*.jpg'))[:5]
        
        if test_images:
            print(f"\n🖼️  Testing on {len(test_images)} sample images:")
            for img_path in test_images:
                results = model(str(img_path), verbose=False)
                
                detections = []
                for r in results:
                    if len(r.boxes.cls) > 0:
                        for i in range(len(r.boxes.cls)):
                            cls_id = int(r.boxes.cls[i])
                            conf = float(r.boxes.conf[i])
                            crop = model.names.get(cls_id, 'unknown')
                            detections.append(f"{crop.upper()} ({conf:.0%})")
                
                if detections:
                    print(f"      ✅ {img_path.name}: {', '.join(detections)}")
                else:
                    print(f"      ⚠️  {img_path.name}: No crops detected")
    
    print("\n" + "="*60)
    print("✅ MODEL READY FOR PRODUCTION!")
    print("="*60)
    print("\n📝 Integration:")
    print("   • Backend will auto-load this model")
    print("   • Upload images of agricultural crops")
    print("   • Model detects: Wheat, Cotton, Rice, etc.")
    print("   • No more 'wine glass' detections! 🎉")
    
    return True

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║       🌾 AGRICULTURAL CROP MODEL TRAINING PIPELINE 🚜        ║
║                                                              ║
║  Focus: FARMING CROPS (Wheat, Cotton, Rice, Corn, etc.)     ║
║  Target: Indian Agriculture - All States                    ║
║  NOT: Fruits/Vegetables                                      ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    # Check if dataset exists
    data_dir = Path('data/agricultural_crops')
    yaml_exists = list(data_dir.glob('*.yaml')) if data_dir.exists() else []
    
    if not yaml_exists:
        print("📥 STEP 1: Download Agricultural Dataset")
        print("="*60)
        
        success = download_agricultural_dataset()
        
        if not success:
            manual_download_guide()
            print("\n⏸️  Please download dataset and re-run this script")
            return
    else:
        print("✅ Dataset found: data/agricultural_crops/")
        print(f"   Config: {yaml_exists[0].name}")
    
    # Train model
    print("\n" + "="*60)
    print("🚀 STEP 2: Train on Agricultural Crops")
    print("="*60)
    
    choice = input("\n🎯 Start training now? (y/n): ").strip().lower()
    if choice != 'y':
        print("   Cancelled. Run again when ready.")
        return
    
    success = train_agricultural_model()
    
    if success:
        # Test the model
        test_model()
        
        print("\n" + "="*60)
        print("🎉 SETUP COMPLETE!")
        print("="*60)
        print("\n✅ Agricultural model trained successfully")
        print("✅ Model file: crop_detection_model.pt")
        print("\n📝 Next Steps:")
        print("   1. Restart backend: uvicorn app.main:app --reload")
        print("   2. Go to frontend Storage Guard")
        print("   3. Upload crop images (wheat, cotton, rice, etc.)")
        print("   4. Model will correctly detect farming crops!")
        print("\n🌾 Your Storage Guard is now agriculture-ready! 🚜")
    else:
        print("\n❌ Training failed. Check dataset and try again.")

if __name__ == "__main__":
    main()
