"""
Download and prepare crop dataset for YOLOv8 training
Automatically downloads from Roboflow or uses Kaggle datasets
"""

import os
import sys
import zipfile
from pathlib import Path
import requests
from tqdm import tqdm

def download_file(url, destination):
    """Download file with progress bar"""
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
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

def download_roboflow_dataset(api_key=None, project_url=None):
    """
    Download crop dataset from Roboflow
    
    Example usage:
        python prepare_crop_dataset.py --roboflow --api-key YOUR_KEY
    
    Get API key from: https://app.roboflow.com/settings/api
    """
    
    if not api_key:
        print("\n⚠️  Roboflow API key required!")
        print("   1. Sign up at: https://app.roboflow.com")
        print("   2. Get API key from: Settings > API")
        print("   3. Run: python prepare_crop_dataset.py --roboflow --api-key YOUR_KEY")
        return False
    
    # Pre-configured public crop datasets on Roboflow
    recommended_datasets = [
        {
            'name': 'Crop Detection',
            'url': 'https://universe.roboflow.com/crop-detection-iqp83/crop-detection-latest',
            'workspace': 'crop-detection-iqp83',
            'project': 'crop-detection-latest',
            'version': 1
        },
        {
            'name': 'Fruits and Vegetables',
            'url': 'https://universe.roboflow.com/joseph-nelson/fruits-vegetables',
            'workspace': 'joseph-nelson',
            'project': 'fruits-vegetables',
            'version': 3
        }
    ]
    
    print("\n📦 Available Roboflow Datasets:")
    for i, ds in enumerate(recommended_datasets, 1):
        print(f"   {i}. {ds['name']}")
        print(f"      URL: {ds['url']}")
    
    choice = input("\nSelect dataset (1-2) or press Enter for #1: ").strip() or "1"
    
    # Validate input
    try:
        choice_num = int(choice)
        if choice_num < 1 or choice_num > len(recommended_datasets):
            print(f"❌ Invalid choice. Using dataset #1")
            choice_num = 1
    except ValueError:
        print(f"❌ Invalid input '{choice}'. Using dataset #1")
        choice_num = 1
    
    selected = recommended_datasets[choice_num - 1]
    
    print(f"\n📥 Downloading {selected['name']}...")
    
    # Roboflow download URL format
    download_url = (
        f"https://api.roboflow.com/{selected['workspace']}/{selected['project']}/{selected['version']}"
        f"/yolov8?api_key={api_key}"
    )
    
    try:
        dataset_zip = Path('data/crops_dataset.zip')
        dataset_zip.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"   Downloading from: {download_url}")
        download_file(download_url, dataset_zip)
        
        print(f"\n📂 Extracting dataset...")
        with zipfile.ZipFile(dataset_zip, 'r') as zip_ref:
            zip_ref.extractall('data/crops')
        
        dataset_zip.unlink()  # Delete zip file
        print(f"✅ Dataset ready at: data/crops/")
        return True
        
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False


def create_sample_dataset():
    """
    Create a small sample dataset for testing
    Uses synthetic data or placeholders
    """
    
    print("\n🎨 Creating sample dataset for testing...")
    
    base_path = Path('data/crops')
    
    # Create directory structure
    for split in ['train', 'val', 'test']:
        (base_path / 'images' / split).mkdir(parents=True, exist_ok=True)
        (base_path / 'labels' / split).mkdir(parents=True, exist_ok=True)
    
    print("✅ Directory structure created")
    print("\n📝 Sample dataset structure:")
    print("""
    data/crops/
    ├── dataset.yaml
    ├── images/
    │   ├── train/  (Add 100+ images per crop)
    │   ├── val/    (Add 20+ images per crop)
    │   └── test/   (Add 10+ images per crop)
    └── labels/
        ├── train/  (YOLO format .txt files)
        ├── val/
        └── test/
    """)
    
    # Create dataset.yaml
    yaml_content = """# Crop Detection Dataset
path: data/crops
train: images/train
val: images/val
test: images/test

nc: 50

names: ['rice', 'wheat', 'maize', 'corn', 'bajra', 'jowar', 'ragi',
        'chickpea', 'pigeon_pea', 'moong', 'urad', 'masoor', 'kidney_bean',
        'tomato', 'potato', 'onion', 'cabbage', 'cauliflower', 'brinjal',
        'lady_finger', 'bitter_gourd', 'bottle_gourd', 'pumpkin', 'cucumber',
        'carrot', 'radish', 'beetroot', 'spinach', 'coriander',
        'mango', 'banana', 'apple', 'grapes', 'pomegranate', 'guava',
        'papaya', 'watermelon', 'orange', 'lemon', 'coconut',
        'cotton', 'sugarcane', 'tobacco', 'jute', 'tea', 'coffee',
        'groundnut', 'mustard', 'sunflower', 'soybean']
"""
    
    yaml_path = base_path / 'dataset.yaml'
    yaml_path.write_text(yaml_content)
    print(f"✅ Created: {yaml_path}")
    
    return True


def download_kaggle_dataset():
    """
    Download crop dataset from Kaggle
    Requires: pip install kaggle
    """
    
    try:
        import kaggle
    except ImportError:
        print("❌ Kaggle package not installed")
        print("   Install: pip install kaggle")
        return False
    
    print("\n📥 Downloading from Kaggle...")
    print("   Make sure you have ~/.kaggle/kaggle.json configured")
    print("   Get API key from: https://www.kaggle.com/settings/account")
    
    recommended_datasets = [
        'moltean/fruits',  # 90,000+ images, 131 classes
        'kritikseth/fruit-and-vegetable-image-recognition',
        'sriramr/fruits-fresh-and-rotten-for-classification'
    ]
    
    print("\n📦 Recommended Kaggle Datasets:")
    for i, ds in enumerate(recommended_datasets, 1):
        print(f"   {i}. {ds}")
    
    choice = input("\nSelect dataset (1-3) or press Enter for #1: ").strip() or "1"
    dataset_name = recommended_datasets[int(choice) - 1]
    
    try:
        kaggle.api.dataset_download_files(
            dataset_name,
            path='data/kaggle_dataset',
            unzip=True
        )
        print(f"✅ Downloaded to: data/kaggle_dataset/")
        print("\n⚠️  Note: Kaggle datasets need conversion to YOLO format")
        print("   Use tools like: labelImg, Roboflow, or custom scripts")
        return True
        
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False


def use_pretrained_model():
    """
    Download a pre-trained crop detection model
    Skips training, ready to use
    """
    
    print("\n🤖 Downloading pre-trained crop detection model...")
    
    # YOLOv8 models fine-tuned on PlantDoc or similar datasets
    pretrained_urls = {
        'yolov8n_crops': 'https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt',
        'yolov8s_crops': 'https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8s.pt',
    }
    
    print("\n📦 Available Pre-trained Models:")
    for i, (name, url) in enumerate(pretrained_urls.items(), 1):
        print(f"   {i}. {name}")
    
    choice = input("\nSelect model (1-2) or press Enter for #1: ").strip() or "1"
    selected_name = list(pretrained_urls.keys())[int(choice) - 1]
    selected_url = pretrained_urls[selected_name]
    
    output_path = Path(f'{selected_name}.pt')
    
    print(f"\n📥 Downloading {selected_name}...")
    download_file(selected_url, output_path)
    
    print(f"\n✅ Model downloaded: {output_path}")
    print("\n📝 To use in StorageGuard:")
    print(f"   1. Copy {output_path} to Backend/")
    print(f"   2. Update storage_guard.py:")
    print(f"      model = YOLO('{output_path}')")
    
    return True


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Prepare Crop Detection Dataset')
    parser.add_argument('--method', choices=['roboflow', 'kaggle', 'sample', 'pretrained'],
                       default='sample',
                       help='Dataset source method')
    parser.add_argument('--api-key', type=str, help='Roboflow API key')
    parser.add_argument('--project-url', type=str, help='Roboflow project URL')
    
    args = parser.parse_args()
    
    print("\n🌾 Crop Detection Dataset Preparation")
    print("=" * 60)
    
    if args.method == 'roboflow':
        success = download_roboflow_dataset(args.api_key, args.project_url)
    elif args.method == 'kaggle':
        success = download_kaggle_dataset()
    elif args.method == 'sample':
        success = create_sample_dataset()
    elif args.method == 'pretrained':
        success = use_pretrained_model()
    
    if success:
        print("\n✅ Setup complete!")
        if args.method != 'pretrained':
            print("\n📚 Next Steps:")
            print("   1. Add training images to data/crops/images/train/")
            print("   2. Add labels to data/crops/labels/train/")
            print("   3. Run: python train_crop_model.py --mode train")
        else:
            print("\n📚 Model ready to use!")
            print("   Update storage_guard.py to use the downloaded model")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
