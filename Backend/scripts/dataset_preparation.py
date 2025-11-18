"""
Dataset preparation script for agricultural AI training
Downloads sample datasets and prepares them for training
"""

import os
import json
import logging
import argparse
import requests
import zipfile
from pathlib import Path
from typing import List, Dict, Any
import shutil

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def download_sample_datasets():
    """
    Download sample agricultural datasets
    This is a placeholder - you'll need to adapt for your specific datasets
    """
    
    datasets_info = {
        "plantdoc": {
            "description": "PlantDoc dataset - 2,598 images across 13 plant species and up to 17 classes of diseases",
            "url": "https://github.com/pratikkayal/PlantDoc-Dataset",
            "note": "This is a reference to the GitHub repo. You'll need to download manually."
        },
        "plant_village": {
            "description": "PlantVillage dataset - 54,306 images of healthy and diseased plant leaves",
            "url": "https://www.kaggle.com/datasets/arjuntejaswi/plant-village",
            "note": "Available on Kaggle. Requires Kaggle account and API setup."
        },
        "new_plant_diseases": {
            "description": "New Plant Diseases Dataset - 87,000 RGB images of healthy and diseased crop leaves",
            "url": "https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset",
            "note": "Available on Kaggle. Requires Kaggle account and API setup."
        }
    }
    
    print("Available Agricultural Datasets:")
    print("=" * 50)
    
    for name, info in datasets_info.items():
        print(f"\n{name.upper()}:")
        print(f"Description: {info['description']}")
        print(f"URL: {info['url']}")
        print(f"Note: {info['note']}")
    
    print("\n" + "=" * 50)
    print("DATASET DOWNLOAD INSTRUCTIONS:")
    print("=" * 50)
    print("""
    To get started with training, you have several options:

    1. MANUAL DATASET SETUP:
       - Create your own dataset by collecting agricultural images
       - Organize them in the following structure:
         data/datasets/agricultural_images/
           ├── healthy/
           ├── bacterial_blight/
           ├── fungal_disease/
           ├── viral_disease/
           ├── pest_damage/
           ├── nutrient_deficiency/
           └── other_stress/

    2. USE KAGGLE DATASETS:
       - Install kaggle: pip install kaggle
       - Set up Kaggle API credentials (~/.kaggle/kaggle.json)
       - Download PlantVillage dataset:
         kaggle datasets download -d arjuntejaswi/plant-village
       - Extract and organize the data

    3. USE PLANTDOC DATASET:
       - Clone: git clone https://github.com/pratikkayal/PlantDoc-Dataset
       - Organize the data according to your class structure

    4. CREATE SYNTHETIC DATASET:
       - Use the create_sample_dataset() function below
       - This creates a small sample dataset for testing the training pipeline
    """)


def create_sample_dataset(output_dir: str, num_samples_per_class: int = 50):
    """
    Create a synthetic sample dataset for testing the training pipeline
    
    Args:
        output_dir: Directory to create the sample dataset
        num_samples_per_class: Number of sample images per class
    """
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
    
    logger.info(f"Creating sample dataset in {output_dir}")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    classes = [
        "healthy",
        "bacterial_blight", 
        "fungal_disease",
        "viral_disease",
        "pest_damage",
        "nutrient_deficiency",
        "other_stress"
    ]
    
    # Color schemes for each class (to make them visually different)
    class_colors = {
        "healthy": [(34, 139, 34), (50, 205, 50), (0, 128, 0)],  # Green tones
        "bacterial_blight": [(139, 69, 19), (160, 82, 45), (205, 133, 63)],  # Brown tones
        "fungal_disease": [(128, 128, 128), (169, 169, 169), (105, 105, 105)],  # Gray tones
        "viral_disease": [(255, 255, 0), (255, 215, 0), (255, 165, 0)],  # Yellow tones
        "pest_damage": [(255, 0, 0), (220, 20, 60), (178, 34, 34)],  # Red tones
        "nutrient_deficiency": [(255, 192, 203), (255, 182, 193), (255, 160, 122)],  # Light colors
        "other_stress": [(128, 0, 128), (147, 112, 219), (138, 43, 226)]  # Purple tones
    }
    
    for class_name in classes:
        class_dir = output_path / class_name
        class_dir.mkdir(exist_ok=True)
        
        colors = class_colors[class_name]
        
        for i in range(num_samples_per_class):
            # Create a synthetic image with random patterns
            img = Image.new('RGB', (224, 224), color=colors[i % len(colors)])
            draw = ImageDraw.Draw(img)
            
            # Add some random shapes to simulate leaf patterns
            for _ in range(np.random.randint(3, 8)):
                # Random circles, rectangles, or ellipses
                shape_type = np.random.choice(['circle', 'rectangle', 'ellipse'])
                
                x1 = np.random.randint(0, 180)
                y1 = np.random.randint(0, 180)
                x2 = x1 + np.random.randint(20, 60)
                y2 = y1 + np.random.randint(20, 60)
                
                # Vary the color slightly
                base_color = colors[i % len(colors)]
                varied_color = tuple(
                    max(0, min(255, c + np.random.randint(-30, 31))) 
                    for c in base_color
                )
                
                if shape_type == 'circle':
                    draw.ellipse([x1, y1, x2, y2], fill=varied_color)
                elif shape_type == 'rectangle':
                    draw.rectangle([x1, y1, x2, y2], fill=varied_color)
                else:  # ellipse
                    draw.ellipse([x1, y1, x2, y2], fill=varied_color)
            
            # Add some noise
            img_array = np.array(img)
            noise = np.random.normal(0, 10, img_array.shape).astype(np.uint8)
            img_array = np.clip(img_array + noise, 0, 255)
            img = Image.fromarray(img_array)
            
            # Save image
            img_path = class_dir / f"{class_name}_{i:03d}.jpg"
            img.save(img_path, 'JPEG', quality=85)
        
        logger.info(f"Created {num_samples_per_class} samples for class '{class_name}'")
    
    logger.info(f"Sample dataset created successfully in {output_dir}")
    
    # Create dataset info file
    dataset_info = {
        "name": "Sample Agricultural Dataset",
        "description": "Synthetic dataset for testing the training pipeline",
        "num_classes": len(classes),
        "classes": classes,
        "samples_per_class": num_samples_per_class,
        "total_samples": len(classes) * num_samples_per_class,
        "image_size": [224, 224],
        "created_by": "dataset_preparation.py"
    }
    
    with open(output_path / "dataset_info.json", 'w') as f:
        json.dump(dataset_info, f, indent=2)


def split_dataset_script(source_dir: str, output_dir: str):
    """
    Split dataset into train/validation/test sets using the training utilities
    """
    from training_utils import split_dataset
    
    logger.info(f"Splitting dataset from {source_dir} to {output_dir}")
    
    split_dataset(
        source_dir=source_dir,
        output_dir=output_dir,
        train_ratio=0.7,
        val_ratio=0.15,
        test_ratio=0.15
    )
    
    logger.info("Dataset split completed")


def validate_dataset_structure(dataset_dir: str) -> bool:
    """
    Validate that the dataset has the correct structure for training
    
    Args:
        dataset_dir: Root directory of the dataset
        
    Returns:
        True if valid, False otherwise
    """
    dataset_path = Path(dataset_dir)
    
    if not dataset_path.exists():
        logger.error(f"Dataset directory does not exist: {dataset_dir}")
        return False
    
    # Check for train/val/test splits
    required_splits = ['train', 'val', 'test']
    
    for split in required_splits:
        split_path = dataset_path / split
        if not split_path.exists():
            logger.error(f"Missing split directory: {split}")
            return False
        
        # Check if split has class subdirectories
        class_dirs = [d for d in split_path.iterdir() if d.is_dir()]
        if not class_dirs:
            logger.error(f"No class directories found in {split} split")
            return False
        
        # Check each class has images
        for class_dir in class_dirs:
            image_files = [f for f in class_dir.iterdir() if f.suffix.lower() in {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}]
            if not image_files:
                logger.warning(f"No images found in {class_dir}")
            else:
                logger.info(f"{split}/{class_dir.name}: {len(image_files)} images")
    
    logger.info("Dataset structure validation passed")
    return True


def main():
    """Main function for dataset preparation"""
    parser = argparse.ArgumentParser(description='Prepare agricultural dataset for training')
    parser.add_argument('--action', choices=['info', 'create_sample', 'split', 'validate'], 
                       required=True, help='Action to perform')
    parser.add_argument('--source_dir', type=str, help='Source directory for dataset operations')
    parser.add_argument('--output_dir', type=str, help='Output directory')
    parser.add_argument('--samples_per_class', type=int, default=50, 
                       help='Number of samples per class for sample dataset')
    
    args = parser.parse_args()
    
    if args.action == 'info':
        download_sample_datasets()
    
    elif args.action == 'create_sample':
        output_dir = args.output_dir or '../data/datasets/sample_agricultural'
        create_sample_dataset(output_dir, args.samples_per_class)
        
        # Also create the split version
        split_output = args.output_dir or '../data/datasets/agricultural_images'
        split_dataset_script(output_dir, split_output)
    
    elif args.action == 'split':
        if not args.source_dir or not args.output_dir:
            logger.error("Both --source_dir and --output_dir are required for split action")
            return
        
        split_dataset_script(args.source_dir, args.output_dir)
    
    elif args.action == 'validate':
        if not args.source_dir:
            logger.error("--source_dir is required for validate action")
            return
        
        is_valid = validate_dataset_structure(args.source_dir)
        if is_valid:
            logger.info("✅ Dataset is ready for training!")
        else:
            logger.error("❌ Dataset validation failed. Please fix the issues above.")


if __name__ == '__main__':
    main()
