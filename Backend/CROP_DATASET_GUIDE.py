"""
Step-by-step guide to get real crop images dataset
"""

print("""
🌾 GETTING REAL AGRICULTURAL CROP DATASET
=" * 60

📥 METHOD 1: Roboflow Universe (EASIEST - Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Go to Roboflow Universe
   🔗 https://universe.roboflow.com/

Step 2: Search for crop datasets
   Search terms to try:
   ✓ "vegetable detection"
   ✓ "fruit classification"
   ✓ "crop recognition"
   ✓ "tomato potato onion"

Step 3: Pick a good dataset (look for):
   ✓ 1000+ images
   ✓ 10+ crop classes
   ✓ Already labeled (bounding boxes)
   ✓ Train/Val/Test splits included

Step 4: Download
   ✓ Click "Download Dataset"
   ✓ Select format: "YOLOv8"
   ✓ Click "Show download code"
   ✓ Copy the download code snippet

Step 5: Extract to correct location
   ✓ Extract zip file
   ✓ Move contents to: Backend/data/crops/
   ✓ Should have: train/, valid/, test/ folders
   ✓ Should have: data.yaml file

📥 RECOMMENDED DATASETS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Vegetable Classification (8 crops)
   🔗 https://universe.roboflow.com/smartinterns/vegetable-classification-jjwvs
   Classes: Bean, Bitter Gourd, Bottle Gourd, Brinjal, Broccoli, Cabbage, Capsicum, Carrot

2. Fruits & Vegetables (33 crops)
   🔗 https://universe.roboflow.com/fruit-and-vegetable/fruits-and-vegetables-qfnmr
   Classes: Apple, Banana, Mango, Orange, Tomato, Potato, etc.

3. Indian Vegetables (12 crops)
   🔗 https://universe.roboflow.com/vegetables-jkdoh/vegetables-qeivw
   Classes: Tomato, Potato, Onion, Carrot, Cabbage, Cucumber, etc.

📥 METHOD 2: Use Python Script with Roboflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run in terminal:

pip install roboflow

Then create download_from_roboflow.py:

```python
from roboflow import Roboflow

rf = Roboflow(api_key="cE6D3UKvPGHUbaknLGcy")
project = rf.workspace("smartinterns").project("vegetable-classification-jjwvs")
dataset = project.version(1).download("yolov8", location="data/crops")

print("✅ Dataset downloaded to: data/crops/")
```

Run: python download_from_roboflow.py

📥 METHOD 3: Kaggle Crops Dataset
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install Kaggle:
   pip install kaggle

2. Get API credentials:
   🔗 https://www.kaggle.com/settings/account
   Click "Create New API Token"
   Save kaggle.json to: ~/.kaggle/ (Linux/Mac) or C:\\Users\\YourName\\.kaggle\\ (Windows)

3. Download dataset:
   kaggle datasets download -d kritikseth/fruit-and-vegetable-image-recognition
   
4. Extract and convert to YOLO format (or use Roboflow to convert)

📁 EXPECTED FOLDER STRUCTURE AFTER DOWNLOAD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend/data/crops/
├── data.yaml              ← Dataset configuration
├── train/
│   ├── images/           ← Training images (.jpg)
│   └── labels/           ← Training labels (.txt)
├── valid/
│   ├── images/           ← Validation images
│   └── labels/           ← Validation labels  
└── test/
    ├── images/           ← Test images
    └── labels/           ← Test labels

data.yaml should look like:

train: train/images
val: valid/images
test: test/images

nc: 8
names: ['bean', 'bitter_gourd', 'bottle_gourd', 'brinjal', 
        'broccoli', 'cabbage', 'capsicum', 'carrot']

✅ VERIFY DATASET:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run: python -c "from pathlib import Path; print('Images:', len(list(Path('data/crops/train/images').glob('*.jpg'))))"

Should show: Images: 500+ (or more)

🚀 THEN TRAIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

python train_crop_model.py --mode train --epochs 50 --batch 16

Training will take 30min - 2hrs depending on dataset size.

💡 QUICK TEST (Without Training):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current model (crop_detection_model.pt) can detect:
✓ Quality (good/bad)
✓ Defects (spots, damages)  
✓ Shelf life estimation

It just won't identify specific crop names yet.
That's okay for initial testing!

Upload images in frontend and see quality analysis working.
Then train for crop identification later.

""")
