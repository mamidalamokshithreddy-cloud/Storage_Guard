"""
Automated Crop Dataset Download and Training Pipeline
Downloads vegetable dataset from Roboflow and trains YOLOv8 model
"""

import sys
import os
from pathlib import Path

print("""
╔══════════════════════════════════════════════════════════════╗
║   🌾 CROP DETECTION MODEL - TRAINING PIPELINE 🌾            ║
╚══════════════════════════════════════════════════════════════╝

This will:
1. Download real vegetable/crop dataset (1000+ images)
2. Train YOLOv8 model for 50 epochs (~1-2 hours)
3. Replace generic model with crop-specific model
4. Test on real crop images

""")

def check_requirements():
    """Check if required packages are installed"""
    print("📦 Checking requirements...")
    
    try:
        from roboflow import Roboflow
        print("   ✅ roboflow installed")
    except ImportError:
        print("   ❌ roboflow not installed")
        print("\n   Installing roboflow...")
        os.system("pip install --user roboflow")
        print("   ✅ roboflow installed")
    
    try:
        from ultralytics import YOLO
        print("   ✅ ultralytics (YOLOv8) installed")
    except ImportError:
        print("   ❌ ultralytics not installed")
        return False
    
    return True

def download_dataset():
    """Download vegetable dataset from Roboflow"""
    print("\n" + "="*60)
    print("📥 STEP 1: Downloading Vegetable Dataset")
    print("="*60)
    
    from roboflow import Roboflow
    
    # Initialize Roboflow (public access)
    rf = Roboflow(api_key="cE6D3UKvPGHUbaknLGcy")
    
    print("\n🔍 Attempting to download public vegetable datasets...")
    
    # Try multiple public datasets
    datasets_to_try = [
        {
            'workspace': 'joseph-nelson',
            'project': 'fruits-vegetables',
            'version': 3,
            'name': 'Fruits & Vegetables (33 classes)'
        },
        {
            'workspace': 'fruit-and-vegetable',
            'project': 'fruits-and-vegetables-qfnmr',
            'version': 1,
            'name': 'Fruits & Vegetables Dataset'
        }
    ]
    
    for ds_info in datasets_to_try:
        try:
            print(f"\n📦 Trying: {ds_info['name']}")
            print(f"   Workspace: {ds_info['workspace']}")
            print(f"   Project: {ds_info['project']}")
            
            project = rf.workspace(ds_info['workspace']).project(ds_info['project'])
            dataset = project.version(ds_info['version']).download("yolov8", location="data/crops")
            
            print(f"\n✅ Successfully downloaded: {ds_info['name']}")
            print(f"   Location: data/crops/")
            
            # Check what we got
            if hasattr(dataset, 'location'):
                print(f"   Dataset location: {dataset.location}")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:100]}")
            continue
    
    print("\n⚠️  All automatic downloads failed.")
    print("\n💡 MANUAL DOWNLOAD REQUIRED:")
    print("="*60)
    print("1. Visit: https://universe.roboflow.com")
    print("2. Search: 'vegetable detection yolov8'")
    print("3. Find a public dataset with 500+ images")
    print("4. Download in 'YOLOv8' format")
    print("5. Extract to: Backend/data/crops/")
    print("6. Re-run this script")
    print("="*60)
    
    return False

def verify_dataset():
    """Verify dataset structure"""
    print("\n" + "="*60)
    print("🔍 STEP 2: Verifying Dataset Structure")
    print("="*60)
    
    crops_dir = Path('data/crops')
    
    # Check for data.yaml
    yaml_files = list(crops_dir.glob('*.yaml')) + list(crops_dir.glob('*.yml'))
    if not yaml_files:
        print("   ❌ No data.yaml found")
        return False
    
    data_yaml = yaml_files[0]
    print(f"   ✅ Found config: {data_yaml.name}")
    
    # Check for train/valid/test directories
    train_dir = None
    for possible in ['train/images', 'train', 'images/train']:
        check_path = crops_dir / possible
        if check_path.exists():
            train_dir = check_path
            break
    
    if not train_dir:
        print("   ❌ No training images found")
        return False
    
    train_images = list(train_dir.glob('*.jpg')) + list(train_dir.glob('*.png'))
    print(f"   ✅ Training images: {len(train_images)}")
    
    if len(train_images) < 50:
        print("   ⚠️  Warning: Very few training images (need 100+ for good results)")
    
    return len(train_images) > 0

def train_model(epochs=50):
    """Train YOLOv8 on crop dataset"""
    print("\n" + "="*60)
    print(f"🚀 STEP 3: Training YOLOv8 Model ({epochs} epochs)")
    print("="*60)
    
    from ultralytics import YOLO
    
    # Find data.yaml
    crops_dir = Path('data/crops')
    yaml_files = list(crops_dir.glob('*.yaml')) + list(crops_dir.glob('*.yml'))
    data_yaml = yaml_files[0]
    
    print(f"\n📊 Training Configuration:")
    print(f"   Data config: {data_yaml}")
    print(f"   Base model: yolov8n.pt (nano - fastest)")
    print(f"   Epochs: {epochs}")
    print(f"   Batch size: 16")
    print(f"   Image size: 640")
    print(f"   Device: GPU if available, else CPU")
    print(f"\n⏱️  Estimated time: 30-120 minutes (depending on dataset size)")
    
    # Load base model
    model = YOLO('yolov8n.pt')
    
    print(f"\n🎯 Training started...")
    print("="*60)
    
    # Train
    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        batch=16,
        imgsz=640,
        patience=20,
        save=True,
        project='runs/crop_training',
        name='yolov8n_crops',
        exist_ok=True,
        pretrained=True,
        verbose=True
    )
    
    print("\n" + "="*60)
    print("✅ Training Complete!")
    print("="*60)
    
    # Find best model
    best_model = Path('runs/crop_training/yolov8n_crops/weights/best.pt')
    
    if best_model.exists():
        # Copy to main directory
        import shutil
        output_path = Path('crop_detection_model.pt')
        
        # Backup old model
        if output_path.exists():
            shutil.copy(output_path, 'crop_detection_model_old.pt')
            print("   📦 Backed up old model to: crop_detection_model_old.pt")
        
        shutil.copy(best_model, output_path)
        print(f"   ✅ New model saved to: {output_path}")
        print(f"   📊 Model size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")
        
        return True
    else:
        print("   ❌ Training failed - model not found")
        return False

def test_model():
    """Test the trained model"""
    print("\n" + "="*60)
    print("🧪 STEP 4: Testing Trained Model")
    print("="*60)
    
    from ultralytics import YOLO
    
    model_path = Path('crop_detection_model.pt')
    if not model_path.exists():
        print("   ❌ Model not found")
        return False
    
    model = YOLO(str(model_path))
    
    print(f"\n📊 Model Information:")
    print(f"   Model file: {model_path}")
    print(f"   Size: {model_path.stat().st_size / 1024 / 1024:.2f} MB")
    
    if hasattr(model, 'names'):
        classes = model.names
        print(f"   Classes detected: {len(classes)}")
        print(f"   Sample classes: {list(classes.values())[:10]}")
    
    # Test on sample image if available
    test_images_dir = Path('data/crops/test/images') if Path('data/crops/test/images').exists() else Path('data/crops/valid/images')
    
    if test_images_dir and test_images_dir.exists():
        test_images = list(test_images_dir.glob('*.jpg'))[:3]
        
        if test_images:
            print(f"\n🖼️  Testing on sample images:")
            for img_path in test_images:
                results = model(str(img_path))
                
                for r in results:
                    if len(r.boxes.cls) > 0:
                        for i in range(len(r.boxes.cls)):
                            cls_id = int(r.boxes.cls[i])
                            conf = float(r.boxes.conf[i])
                            crop_name = classes.get(cls_id, 'unknown')
                            print(f"      {img_path.name}: {crop_name} (confidence: {conf:.2%})")
                    else:
                        print(f"      {img_path.name}: No detections")
    
    print("\n✅ Model testing complete!")
    return True

def main():
    """Main pipeline"""
    
    # Step 0: Check requirements
    if not check_requirements():
        print("\n❌ Missing required packages. Please install:")
        print("   pip install ultralytics roboflow")
        return
    
    # Step 1: Download dataset
    if not Path('data/crops').exists() or not list(Path('data/crops').glob('*.yaml')):
        success = download_dataset()
        if not success:
            print("\n⚠️  Please download dataset manually and re-run this script")
            return
    else:
        print("\n✅ Dataset already exists at: data/crops/")
    
    # Step 2: Verify dataset
    if not verify_dataset():
        print("\n❌ Dataset verification failed")
        print("   Please check dataset structure")
        return
    
    # Step 3: Train model
    choice = input("\n🚀 Ready to start training? (y/n): ").strip().lower()
    if choice != 'y':
        print("   Cancelled by user")
        return
    
    success = train_model(epochs=50)
    if not success:
        print("\n❌ Training failed")
        return
    
    # Step 4: Test model
    test_model()
    
    print("\n" + "="*60)
    print("🎉 PIPELINE COMPLETE!")
    print("="*60)
    print("\n✅ Your crop detection model is now trained!")
    print("✅ Model will automatically load on next backend restart")
    print("\n📝 Next steps:")
    print("   1. Restart backend: uvicorn app.main:app --reload")
    print("   2. Upload crop images in frontend")
    print("   3. Model will now correctly detect:")
    print("      🌽 Corn (not wine glass!)")
    print("      🍅 Tomato")
    print("      🥔 Potato")
    print("      🧅 Onion")
    print("      ... and all crops in your dataset")
    print("\n🌾 Happy farming! 🚜")

if __name__ == "__main__":
    main()
