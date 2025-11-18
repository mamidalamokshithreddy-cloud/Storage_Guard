"""
Download agricultural crop dataset specifically for farming
Focuses on: vegetables, fruits, grains, and raw agricultural produce
"""

import os
import zipfile
import requests
from pathlib import Path
import urllib.request
import sys

def download_with_progress(url, destination):
    """Download with progress bar"""
    def reporthook(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size) if total_size > 0 else 0
        sys.stdout.write(f"\r   Progress: {percent}%")
        sys.stdout.flush()
    
    try:
        print(f"\n📥 Downloading from: {url}")
        urllib.request.urlretrieve(url, destination, reporthook)
        print("\n✅ Download complete!")
        return True
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        return False

def download_fruits_vegetables_dataset():
    """
    Download Fruits & Vegetables dataset (36 crop classes)
    Dataset includes: apple, banana, tomato, potato, carrot, etc.
    """
    
    print("\n🌾 Downloading Agricultural Crops Dataset")
    print("=" * 60)
    print("   Dataset: Fruits & Vegetables (36 classes)")
    print("   Size: ~1.5 GB")
    print("   Classes: Tomato, Potato, Onion, Carrot, Banana, etc.")
    
    # Kaggle dataset - Fruits and Vegetables Image Recognition
    print("\n📦 Source: Kaggle - Fruits and Vegetables")
    print("   https://www.kaggle.com/datasets/kritikseth/fruit-and-vegetable-image-recognition")
    
    print("\n⚠️  Manual Download Required:")
    print("   1. Install Kaggle CLI: pip install kaggle")
    print("   2. Get API key from: https://www.kaggle.com/settings/account")
    print("   3. Save to: ~/.kaggle/kaggle.json (Linux/Mac) or C:\\Users\\YourName\\.kaggle\\kaggle.json (Windows)")
    print("   4. Run: kaggle datasets download -d kritikseth/fruit-and-vegetable-image-recognition")
    
    # Try using kaggle API
    try:
        import kaggle
        
        print("\n✅ Kaggle API found! Downloading...")
        kaggle.api.dataset_download_files(
            'kritikseth/fruit-and-vegetable-image-recognition',
            path='data/raw_dataset',
            unzip=True
        )
        print("✅ Dataset downloaded to: data/raw_dataset/")
        return True
        
    except ImportError:
        print("\n❌ Kaggle package not installed")
        print("   Install: pip install kaggle")
        return False
    except Exception as e:
        print(f"\n❌ Kaggle download failed: {e}")
        return False

def download_roboflow_crop_dataset(api_key):
    """
    Download real crop detection dataset from Roboflow
    Includes: wheat, rice, corn, tomato, potato, etc.
    """
    
    print("\n🌾 Downloading Roboflow Crop Detection Dataset")
    print("=" * 60)
    
    # Multiple crop-specific datasets available
    crop_datasets = [
        {
            'name': 'Vegetable Detection (8 classes)',
            'workspace': 'smartinterns',
            'project': 'vegetable-classification-jjwvs',
            'version': 1,
            'classes': 'Bean, Bitter_Gourd, Bottle_Gourd, Brinjal, Broccoli, Cabbage, Capsicum, Carrot'
        },
        {
            'name': 'Fruits Recognition (33 classes)', 
            'workspace': 'fresh-fruits',
            'project': 'fruits-recognition',
            'version': 2,
            'classes': 'Apple, Banana, Mango, Orange, Papaya, etc.'
        },
        {
            'name': 'Crop Disease Detection (38 classes)',
            'workspace': 'plantvillage',
            'project': 'crop-diseases',
            'version': 1,
            'classes': 'Tomato, Potato, Corn, Pepper, Apple with disease labels'
        }
    ]
    
    print("\n📦 Available Crop Datasets:")
    for i, ds in enumerate(crop_datasets, 1):
        print(f"\n   {i}. {ds['name']}")
        print(f"      Classes: {ds['classes']}")
    
    choice = input("\nSelect dataset (1-3) or press Enter for #1: ").strip() or "1"
    
    try:
        choice_num = int(choice)
        if choice_num < 1 or choice_num > 3:
            choice_num = 1
    except:
        choice_num = 1
    
    selected = crop_datasets[choice_num - 1]
    
    print(f"\n📥 Downloading: {selected['name']}")
    
    # Roboflow download URL
    download_url = (
        f"https://app.roboflow.com/{selected['workspace']}/{selected['project']}/{selected['version']}"
        f"/download/yolov8"
    )
    
    print(f"\n🔗 Download URL:")
    print(f"   {download_url}")
    print(f"\n🔑 Using API Key: {api_key[:10]}...")
    
    # Try direct download with API key
    full_url = f"{download_url}?api_key={api_key}"
    
    try:
        dataset_zip = Path('data/crop_dataset.zip')
        dataset_zip.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"\n📦 Downloading dataset...")
        response = requests.get(full_url, stream=True)
        
        if response.status_code == 200:
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(dataset_zip, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = int(downloaded * 100 / total_size)
                            sys.stdout.write(f"\r   Progress: {percent}%")
                            sys.stdout.flush()
            
            print("\n✅ Download complete!")
            
            # Extract
            print("\n📂 Extracting dataset...")
            with zipfile.ZipFile(dataset_zip, 'r') as zip_ref:
                zip_ref.extractall('data/crops')
            
            dataset_zip.unlink()
            print(f"✅ Dataset extracted to: data/crops/")
            
            # Move files to correct structure
            organize_dataset_structure()
            
            return True
        else:
            print(f"\n❌ Download failed with status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def organize_dataset_structure():
    """Organize downloaded dataset into proper YOLO structure"""
    
    print("\n📁 Organizing dataset structure...")
    
    crops_dir = Path('data/crops')
    
    # Check if already organized
    if (crops_dir / 'train' / 'images').exists():
        print("   Dataset already organized!")
        
        # Rename to match expected structure
        for split in ['train', 'valid', 'test']:
            old_path = crops_dir / split
            if old_path.exists():
                # Already has images and labels subdirs
                if (old_path / 'images').exists():
                    continue
        return
    
    print("✅ Dataset structure ready!")

def create_crops_yaml(classes):
    """Create dataset.yaml for crop training"""
    
    yaml_content = f"""# Agricultural Crops Dataset
path: data/crops
train: train/images
val: valid/images
test: test/images

nc: {len(classes)}

names: {classes}
"""
    
    yaml_path = Path('data/crops/data.yaml')
    yaml_path.parent.mkdir(parents=True, exist_ok=True)
    yaml_path.write_text(yaml_content)
    
    print(f"✅ Created: {yaml_path}")
    return yaml_path

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Download Agricultural Crop Dataset')
    parser.add_argument('--source', choices=['kaggle', 'roboflow'], 
                       default='roboflow',
                       help='Dataset source')
    parser.add_argument('--roboflow-key', type=str,
                       help='Roboflow API key')
    
    args = parser.parse_args()
    
    print("\n🌾 Agricultural Crop Dataset Downloader")
    print("   Specifically for: Vegetables, Fruits, Grains")
    print("   Not for: People, Cars, Animals")
    print("=" * 60)
    
    if args.source == 'kaggle':
        success = download_fruits_vegetables_dataset()
        
    elif args.source == 'roboflow':
        if not args.roboflow_key:
            print("\n❌ Roboflow API key required!")
            print("\n📝 Get your API key:")
            print("   1. Go to: https://app.roboflow.com")
            print("   2. Sign up / Login")
            print("   3. Go to: Settings > API")
            print("   4. Copy your API key")
            print("\n🚀 Then run:")
            print("   python download_crop_dataset.py --source roboflow --roboflow-key YOUR_KEY")
            
            print("\n💡 OR use pre-made public datasets:")
            print("   Visit: https://universe.roboflow.com")
            print("   Search: 'vegetable detection' or 'fruit classification'")
            sys.exit(1)
        
        success = download_roboflow_crop_dataset(args.roboflow_key)
    
    if success:
        print("\n✅ Crop dataset ready!")
        print("\n🚀 Next: Train the model")
        print("   python train_crop_model.py --mode train --epochs 50")
    else:
        print("\n💡 Alternative: Manual Download")
        print("   1. Visit: https://universe.roboflow.com")
        print("   2. Search: 'vegetable detection'")
        print("   3. Download in YOLOv8 format")
        print("   4. Extract to: Backend/data/crops/")

if __name__ == "__main__":
    main()
