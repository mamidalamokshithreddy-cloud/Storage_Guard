"""
Train YOLOv8 model for accurate crop detection
Supports 50+ common Indian crops with high accuracy
"""

import os
from ultralytics import YOLO
from pathlib import Path

# Define comprehensive crop classes for Indian agriculture
CROP_CLASSES = [
    # Grains & Cereals
    'rice', 'wheat', 'maize', 'corn', 'bajra', 'jowar', 'ragi',
    
    # Pulses & Legumes
    'chickpea', 'pigeon_pea', 'moong', 'urad', 'masoor', 'kidney_bean',
    
    # Vegetables
    'tomato', 'potato', 'onion', 'cabbage', 'cauliflower', 'brinjal',
    'lady_finger', 'bitter_gourd', 'bottle_gourd', 'pumpkin', 'cucumber',
    'carrot', 'radish', 'beetroot', 'spinach', 'coriander',
    
    # Fruits
    'mango', 'banana', 'apple', 'grapes', 'pomegranate', 'guava',
    'papaya', 'watermelon', 'orange', 'lemon', 'coconut',
    
    # Cash Crops
    'cotton', 'sugarcane', 'tobacco', 'jute', 'tea', 'coffee',
    
    # Oilseeds
    'groundnut', 'mustard', 'sunflower', 'soybean', 'sesame',
    
    # Spices
    'chili', 'turmeric', 'ginger', 'garlic'
]

def create_dataset_yaml():
    """Create dataset.yaml file for YOLOv8 training"""
    yaml_content = f"""# Crop Detection Dataset
path: {Path.cwd() / 'data' / 'crops'}
train: images/train
val: images/val
test: images/test

# Number of classes
nc: {len(CROP_CLASSES)}

# Class names
names: {CROP_CLASSES}
"""
    
    yaml_path = Path('data/crops/dataset.yaml')
    yaml_path.parent.mkdir(parents=True, exist_ok=True)
    yaml_path.write_text(yaml_content)
    print(f"✅ Created dataset configuration: {yaml_path}")
    return yaml_path


def download_sample_dataset():
    """
    Download or create sample crop dataset
    In production, use real labeled images from:
    - Roboflow (roboflow.com)
    - Kaggle crop datasets
    - Custom labeled data
    """
    print("\n📥 Dataset Setup Instructions:")
    print("=" * 60)
    print("\n🎯 Option 1: Use Roboflow (Recommended)")
    print("   1. Go to https://universe.roboflow.com/")
    print("   2. Search for 'crop detection' or 'vegetable detection'")
    print("   3. Export in YOLOv8 format")
    print("   4. Extract to: Backend/data/crops/")
    
    print("\n🎯 Option 2: Use Kaggle Dataset")
    print("   1. Download: 'Fruit and Vegetable Image Recognition'")
    print("   2. Or: 'Agricultural Crop Images for Classification'")
    print("   3. Convert to YOLO format using labelImg or Roboflow")
    
    print("\n🎯 Option 3: Use Pre-trained Model")
    print("   Download fine-tuned crop detection model:")
    print("   - YOLOv8 Crops: https://github.com/ultralytics/assets/releases")
    
    print("\n📁 Expected Directory Structure:")
    print("""
    Backend/data/crops/
    ├── dataset.yaml
    ├── images/
    │   ├── train/
    │   │   ├── image1.jpg
    │   │   └── image2.jpg
    │   ├── val/
    │   └── test/
    └── labels/
        ├── train/
        │   ├── image1.txt
        │   └── image2.txt
        ├── val/
        └── test/
    """)
    print("=" * 60)


def train_crop_model(
    epochs=100,
    batch_size=16,
    img_size=640,
    model_size='n',  # n, s, m, l, x
    resume=False
):
    """
    Train YOLOv8 model for crop detection
    
    Args:
        epochs: Number of training epochs (100-300 recommended)
        batch_size: Batch size (adjust based on GPU memory)
        img_size: Input image size
        model_size: Model size (n=nano, s=small, m=medium, l=large, x=xlarge)
        resume: Resume from last checkpoint
    """
    
    print(f"\n🚀 Starting YOLOv8{model_size.upper()} Crop Detection Training")
    print("=" * 60)
    
    # Create dataset configuration
    dataset_yaml = create_dataset_yaml()
    
    # Check if dataset exists
    dataset_path = Path('data/crops/images/train')
    if not dataset_path.exists() or not list(dataset_path.glob('*.jpg')):
        print("\n⚠️  No training images found!")
        download_sample_dataset()
        print("\n❌ Please add training data before running this script.")
        return None
    
    # Load base model
    base_model = f'yolov8{model_size}.pt'
    model = YOLO(base_model)
    print(f"✅ Loaded base model: {base_model}")
    
    # Training arguments
    train_args = {
        'data': str(dataset_yaml),
        'epochs': epochs,
        'batch': batch_size,
        'imgsz': img_size,
        'patience': 50,  # Early stopping
        'save': True,
        'save_period': 10,  # Save checkpoint every 10 epochs
        'project': 'runs/crop_detection',
        'name': f'yolov8{model_size}_crops',
        'exist_ok': True,
        'pretrained': True,
        'optimizer': 'AdamW',
        'lr0': 0.001,
        'lrf': 0.01,
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3,
        'warmup_momentum': 0.8,
        'box': 7.5,
        'cls': 0.5,
        'dfl': 1.5,
        'hsv_h': 0.015,
        'hsv_s': 0.7,
        'hsv_v': 0.4,
        'degrees': 0.0,
        'translate': 0.1,
        'scale': 0.5,
        'shear': 0.0,
        'perspective': 0.0,
        'flipud': 0.0,
        'fliplr': 0.5,
        'mosaic': 1.0,
        'mixup': 0.0,
        'copy_paste': 0.0,
        'resume': resume,
        'amp': True,  # Automatic Mixed Precision
        'cache': True  # Cache images for faster training
    }
    
    print(f"\n📊 Training Configuration:")
    print(f"   Epochs: {epochs}")
    print(f"   Batch Size: {batch_size}")
    print(f"   Image Size: {img_size}")
    print(f"   Classes: {len(CROP_CLASSES)}")
    print(f"   Device: {'GPU' if os.environ.get('CUDA_VISIBLE_DEVICES') else 'CPU'}")
    
    # Start training
    print(f"\n🎯 Training started... (This will take 30min - 2hrs)")
    results = model.train(**train_args)
    
    # Validate model
    print("\n📈 Validating trained model...")
    val_results = model.val()
    
    # Export model
    print("\n💾 Exporting trained model...")
    best_model_path = Path(f'runs/crop_detection/yolov8{model_size}_crops/weights/best.pt')
    
    if best_model_path.exists():
        # Copy to main directory
        import shutil
        output_path = Path('crop_detection_model.pt')
        shutil.copy(best_model_path, output_path)
        print(f"✅ Model saved to: {output_path}")
        
        # Print metrics
        print(f"\n📊 Training Results:")
        print(f"   mAP50: {val_results.box.map50:.4f}")
        print(f"   mAP50-95: {val_results.box.map:.4f}")
        print(f"   Precision: {val_results.box.mp:.4f}")
        print(f"   Recall: {val_results.box.mr:.4f}")
        
        return output_path
    else:
        print(f"❌ Training failed - model not found at {best_model_path}")
        return None


def test_trained_model(model_path='crop_detection_model.pt', test_image=None):
    """Test the trained model on a sample image"""
    
    if not Path(model_path).exists():
        print(f"❌ Model not found: {model_path}")
        return
    
    model = YOLO(model_path)
    print(f"✅ Loaded trained model: {model_path}")
    
    if test_image is None:
        # Use sample from test set
        test_images = list(Path('data/crops/images/test').glob('*.jpg'))
        if not test_images:
            print("❌ No test images found")
            return
        test_image = test_images[0]
    
    print(f"\n🔍 Testing on: {test_image}")
    results = model(test_image)
    
    # Print detections
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            crop_name = CROP_CLASSES[cls_id] if cls_id < len(CROP_CLASSES) else 'unknown'
            print(f"   Detected: {crop_name} (confidence: {conf:.2%})")
    
    # Save annotated image
    output_path = 'test_result.jpg'
    results[0].save(output_path)
    print(f"✅ Saved annotated image: {output_path}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Train YOLOv8 Crop Detection Model')
    parser.add_argument('--mode', choices=['train', 'test', 'setup'], default='setup',
                       help='Mode: train model, test model, or setup dataset')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    parser.add_argument('--size', choices=['n', 's', 'm', 'l', 'x'], default='n',
                       help='Model size (n=fastest, x=most accurate)')
    parser.add_argument('--img-size', type=int, default=640, help='Image size')
    parser.add_argument('--model', type=str, default='crop_detection_model.pt',
                       help='Model path for testing')
    parser.add_argument('--test-image', type=str, help='Test image path')
    
    args = parser.parse_args()
    
    if args.mode == 'setup':
        print("\n🌾 Crop Detection Model Training Setup")
        print("=" * 60)
        download_sample_dataset()
        create_dataset_yaml()
        print("\n✅ Setup complete! Next steps:")
        print("   1. Add training images to data/crops/")
        print("   2. Run: python train_crop_model.py --mode train")
        
    elif args.mode == 'train':
        model_path = train_crop_model(
            epochs=args.epochs,
            batch_size=args.batch,
            model_size=args.size,
            img_size=args.img_size
        )
        if model_path:
            print(f"\n🎉 Training complete! Model saved to: {model_path}")
            print("\n📝 To use in StorageGuard:")
            print(f"   1. Copy {model_path} to Backend/")
            print("   2. Update storage_guard.py:")
            print(f"      model = YOLO('{model_path}')")
            
    elif args.mode == 'test':
        test_trained_model(args.model, args.test_image)
