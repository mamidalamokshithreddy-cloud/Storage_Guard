"""
Quick automated setup for crop detection model
Downloads dataset and trains model in one command
"""

import os
import sys
import zipfile
import requests
from pathlib import Path
from tqdm import tqdm

def download_with_progress(url, destination):
    """Download file with progress bar"""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))
        
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        with open(destination, 'wb') as file, tqdm(
            desc=destination.name,
            total=total_size,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for data in response.iter_content(chunk_size=1024):
                size = file.write(data)
                bar.update(size)
        
        return True
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False

def download_roboflow_dataset(api_key):
    """Download Fruits and Vegetables dataset from Roboflow"""
    
    print("\n📥 Downloading Roboflow Fruits & Vegetables Dataset...")
    print("   Dataset: joseph-nelson/fruits-vegetables (Version 3)")
    print("   Format: YOLOv8")
    
    # Roboflow API URL
    download_url = f"https://app.roboflow.com/ds/xALhqSYE7L?key={api_key}"
    
    dataset_zip = Path('data/crops_dataset.zip')
    
    print(f"\n📦 Downloading dataset...")
    
    try:
        # Alternative: Direct download link for public dataset
        # Using wget-style download
        import urllib.request
        
        def reporthook(count, block_size, total_size):
            percent = int(count * block_size * 100 / total_size)
            sys.stdout.write(f"\r   Progress: {percent}%")
            sys.stdout.flush()
        
        urllib.request.urlretrieve(download_url, dataset_zip, reporthook)
        print("\n✅ Download complete!")
        
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        print("\n💡 Alternative: Download manually from Roboflow")
        print("   1. Go to: https://universe.roboflow.com/joseph-nelson/fruits-vegetables")
        print("   2. Click 'Download Dataset'")
        print("   3. Select 'YOLOv8' format")
        print(f"   4. Use API Key: {api_key}")
        print("   5. Extract to: Backend/data/crops/")
        return False
    
    # Extract dataset
    print(f"\n📂 Extracting dataset...")
    try:
        with zipfile.ZipFile(dataset_zip, 'r') as zip_ref:
            zip_ref.extractall('data/crops')
        
        dataset_zip.unlink()  # Delete zip
        print(f"✅ Dataset extracted to: data/crops/")
        return True
        
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        return False

def use_pretrained_alternative():
    """Download a pretrained YOLOv8 model and configure it for crops"""
    
    print("\n🤖 Setting up pre-trained YOLOv8 model...")
    print("   This model can detect common objects and will be fine-tuned later")
    
    models = {
        'yolov8n.pt': 'https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt',
        'yolov8s.pt': 'https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8s.pt',
    }
    
    print("\n📦 Available Models:")
    print("   1. YOLOv8n (Nano) - Fastest, 6MB")
    print("   2. YOLOv8s (Small) - Balanced, 22MB")
    
    choice = input("\nSelect model (1-2) or press Enter for #1: ").strip() or "1"
    
    try:
        choice_num = int(choice)
        if choice_num < 1 or choice_num > 2:
            choice_num = 1
    except:
        choice_num = 1
    
    model_name = list(models.keys())[choice_num - 1]
    model_url = models[model_name]
    
    output_path = Path('crop_detection_model.pt')
    
    if output_path.exists():
        print(f"\n✅ Model already exists: {output_path}")
        return True
    
    print(f"\n📥 Downloading {model_name}...")
    
    if download_with_progress(model_url, output_path):
        print(f"\n✅ Model ready: {output_path}")
        print("\n📝 Note: This is a general-purpose model.")
        print("   For best crop detection accuracy:")
        print("   1. Collect 100+ labeled crop images")
        print("   2. Run: python train_crop_model.py --mode train")
        return True
    else:
        return False

def create_minimal_dataset():
    """Create minimal dataset structure for testing"""
    
    print("\n📁 Creating dataset structure...")
    
    base_path = Path('data/crops')
    
    for split in ['train', 'val', 'test']:
        (base_path / 'images' / split).mkdir(parents=True, exist_ok=True)
        (base_path / 'labels' / split).mkdir(parents=True, exist_ok=True)
    
    # Create dataset.yaml
    yaml_content = """# Crop Detection Dataset
path: data/crops
train: images/train
val: images/val
test: images/test

nc: 10

names: ['tomato', 'potato', 'onion', 'corn', 'wheat', 
        'rice', 'banana', 'apple', 'mango', 'orange']
"""
    
    yaml_path = base_path / 'dataset.yaml'
    yaml_path.write_text(yaml_content)
    
    print(f"✅ Structure created: {base_path}")
    print("\n📝 Next: Add your crop images to:")
    print(f"   - {base_path}/images/train/  (100+ images)")
    print(f"   - {base_path}/images/val/    (20+ images)")
    
    return True

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Quick Crop Model Setup')
    parser.add_argument('--roboflow-key', type=str, help='Roboflow API key')
    parser.add_argument('--use-pretrained', action='store_true', 
                       help='Use pretrained model instead of training')
    parser.add_argument('--create-structure', action='store_true',
                       help='Just create dataset structure')
    
    args = parser.parse_args()
    
    print("\n🌾 Quick Crop Detection Model Setup")
    print("=" * 60)
    
    if args.create_structure:
        create_minimal_dataset()
        print("\n✅ Setup complete!")
        return
    
    if args.use_pretrained:
        if use_pretrained_alternative():
            print("\n✅ Pretrained model ready!")
            print("\n🚀 Start backend to test:")
            print("   cd Backend")
            print("   uvicorn app.main:app --reload")
        return
    
    if args.roboflow_key:
        print(f"\n🔑 Using Roboflow API Key: {args.roboflow_key[:10]}...")
        
        if download_roboflow_dataset(args.roboflow_key):
            print("\n✅ Dataset ready!")
            print("\n🚀 Next: Train the model")
            print("   python train_crop_model.py --mode train --epochs 50")
        else:
            print("\n💡 Fallback: Using pretrained model")
            use_pretrained_alternative()
    else:
        print("\n❌ No setup method specified!")
        print("\nUsage options:")
        print("  1. Use Roboflow dataset:")
        print("     python quick_setup_crop_model.py --roboflow-key YOUR_KEY")
        print("\n  2. Use pretrained model (recommended for quick start):")
        print("     python quick_setup_crop_model.py --use-pretrained")
        print("\n  3. Create empty structure (add your own images):")
        print("     python quick_setup_crop_model.py --create-structure")
        
        print("\n💡 Easiest option:")
        print("     python quick_setup_crop_model.py --use-pretrained")

if __name__ == "__main__":
    main()
