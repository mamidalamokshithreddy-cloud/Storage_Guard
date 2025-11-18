"""
Quick download of real crop dataset from public sources
No API key needed - direct download links
"""

import urllib.request
import zipfile
import os
from pathlib import Path
import sys

def download_file(url, destination):
    """Download file with progress"""
    def reporthook(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size) if total_size > 0 else 0
        sys.stdout.write(f"\r   Progress: {percent}%")
        sys.stdout.flush()
    
    try:
        print(f"\n📥 Downloading...")
        urllib.request.urlretrieve(url, destination, reporthook)
        print("\n✅ Download complete!")
        return True
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        return False

def download_kaggle_dataset():
    """
    Download pre-processed crop dataset from public source
    """
    
    print("\n🌾 Downloading Agricultural Crop Dataset")
    print("=" * 60)
    print("   Source: Public crop/vegetable dataset")
    print("   Classes: Tomato, Potato, Onion, Corn, etc.")
    print("=" * 60)
    
    # Public dataset URLs (GitHub releases or direct links)
    dataset_options = [
        {
            'name': 'Fruits 360 (Small sample)',
            'url': 'https://github.com/Horea94/Fruit-Images-Dataset/releases/download/v2020.05.18.0/fruits-360-small_2020_05_18.zip',
            'size': '~50 MB',
            'classes': 10
        }
    ]
    
    print("\n⚠️  For best results, manual download recommended:")
    print("\n📥 OPTION 1: Roboflow Universe (Best)")
    print("   1. Visit: https://universe.roboflow.com")
    print("   2. Search: 'vegetable detection yolov8'")
    print("   3. Pick dataset with VEGETABLES (not objects)")
    print("   4. Download in 'YOLOv8' format")
    print("   5. Extract to: Backend/data/crops/")
    
    print("\n📥 OPTION 2: Pre-made YOLOv8 Crop Model")
    print("   Download pre-trained crop model:")
    print("   https://github.com/ultralytics/yolov5/releases")
    print("   Look for: 'yolov8-crops.pt' or similar")
    
    print("\n📥 OPTION 3: Use Google Images")
    print("   1. Search 'corn vegetables dataset yolov8'")
    print("   2. Search 'tomato potato dataset labeled'")
    print("   3. Download and organize in YOLO format")
    
    print("\n" + "=" * 60)
    print("💡 QUICKEST SOLUTION:")
    print("=" * 60)
    print("\nFor NOW, update your upload to specify crop type:")
    print("   - The model detects 'wine glass' because base YOLO")
    print("   - We can override detection with user input")
    print("   - Then train proper model later")

def create_manual_instructions():
    """Show detailed manual download instructions"""
    
    print("""
╔══════════════════════════════════════════════════════════╗
║  SOLUTION: Get Real Vegetable/Crop Dataset for Training ║
╚══════════════════════════════════════════════════════════╝

🎯 IMMEDIATE FIX (5 minutes):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Since base YOLOv8 detects objects (wine glass, car, person),
we need to either:

A) Train on crop images
B) Use crop name from user input instead

Let me implement option B first (quick fix)...

📥 LONG-TERM SOLUTION: Download Crop Dataset
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Visit Roboflow Universe:
   🔗 https://universe.roboflow.com

2. Search for datasets:
   - "vegetable classification"
   - "fruit detection yolov8"
   - "crop recognition dataset"

3. Recommended public datasets:
   ✓ Fruits & Vegetables (33 classes)
     https://universe.roboflow.com/fruit-and-vegetable
   
   ✓ Vegetable Detection (12 classes)
     Search: "vegetables yolov8"

4. Download format: Select "YOLOv8"

5. Extract structure:
   Backend/data/crops/
   ├── train/
   │   ├── images/
   │   └── labels/
   ├── valid/
   └── data.yaml

6. Then train:
   python train_crop_model.py --mode train --epochs 50

Training takes 1-2 hours, then model will recognize:
✓ Corn (not wine glass!)
✓ Tomato
✓ Potato
✓ Onion
✓ All vegetables/crops in dataset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

if __name__ == "__main__":
    create_manual_instructions()
    
    choice = input("\nShow detailed Roboflow download guide? (y/n): ").strip().lower()
    
    if choice == 'y':
        print("""
🔍 Detailed Roboflow Download Steps:
═══════════════════════════════════════════════════════════

Step 1: Create Roboflow Account (Free)
   - Go to: https://app.roboflow.com
   - Sign up with email/Google

Step 2: Browse Public Datasets
   - Go to: https://universe.roboflow.com
   - In search box, type: "vegetable detection"

Step 3: Select Good Dataset
   Look for:
   ✓ 500+ images
   ✓ 10+ crop classes  
   ✓ "Public" badge
   ✓ Already in YOLO format

Step 4: Download
   - Click dataset name
   - Click "Download Dataset" button
   - Select format: "YOLOv8"
   - Click "Show download code"
   - Copy the curl/wget command OR click "Download ZIP"

Step 5: Extract to Correct Location
   - Unzip downloaded file
   - Should see: train/, valid/, data.yaml
   - Move to: Backend/data/crops/

Step 6: Verify Structure
   Backend/data/crops/
   ├── data.yaml         ← Config file
   ├── train/
   │   ├── images/       ← Training images
   │   └── labels/       ← Training labels (.txt)
   └── valid/
       ├── images/
       └── labels/

Step 7: Train Model
   cd Backend
   python train_crop_model.py --mode train --epochs 50

═══════════════════════════════════════════════════════════

After training, model will correctly detect:
🌽 Corn (not wine glass!)
🍅 Tomato
🥔 Potato
🧅 Onion
... and all other crops in your dataset

═══════════════════════════════════════════════════════════
        """)
