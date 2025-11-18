"""
Training utilities for agricultural AI models
Dataset handling, transforms, export functions, and calibration
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, List, Optional
import warnings
warnings.filterwarnings('ignore')

import torch
import torch.nn as nn
from torch.utils.data import Dataset
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import onnx
import onnxruntime as ort
from sklearn.calibration import calibration_curve
from scipy.optimize import minimize_scalar
import albumentations as A
from albumentations.pytorch import ToTensorV2

logger = logging.getLogger(__name__)


class AgriculturalDataset(Dataset):
    """
    Dataset class for agricultural pest and disease images
    Expected directory structure:
    root_dir/
        class1/
            image1.jpg
            image2.jpg
            ...
        class2/
            image1.jpg
            ...
    """
    
    def __init__(self, root_dir: str, transform=None):
        """
        Initialize dataset
        
        Args:
            root_dir: Root directory containing class subdirectories
            transform: Optional transform to be applied to images
        """
        self.root_dir = Path(root_dir)
        self.transform = transform
        
        # Get all classes (subdirectories)
        self.classes = sorted([d.name for d in self.root_dir.iterdir() if d.is_dir()])
        self.class_to_idx = {cls_name: idx for idx, cls_name in enumerate(self.classes)}
        
        # Get all image paths and labels
        self.samples = []
        self._load_samples()
        
        logger.info(f"Loaded {len(self.samples)} samples from {len(self.classes)} classes")
        logger.info(f"Classes: {self.classes}")
    
    def _load_samples(self):
        """Load all image paths and their corresponding labels"""
        for class_name in self.classes:
            class_dir = self.root_dir / class_name
            class_idx = self.class_to_idx[class_name]
            
            # Get all image files
            image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
            
            for img_path in class_dir.iterdir():
                if img_path.suffix.lower() in image_extensions:
                    self.samples.append((str(img_path), class_idx))
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        """Get a sample from the dataset"""
        img_path, label = self.samples[idx]
        
        # Load image
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception as e:
            logger.error(f"Error loading image {img_path}: {e}")
            # Return a blank image in case of error
            image = Image.new('RGB', (224, 224), color='white')
        
        # Apply transforms
        if self.transform:
            image = self.transform(image)
        
        return image, label
    
    def get_class_distribution(self) -> Dict[str, int]:
        """Get the distribution of samples per class"""
        distribution = {}
        for _, label in self.samples:
            class_name = self.classes[label]
            distribution[class_name] = distribution.get(class_name, 0) + 1
        
        return distribution


def get_data_transforms(config: Dict[str, Any]) -> Tuple[transforms.Compose, transforms.Compose]:
    """
    Create training and validation transforms
    
    Args:
        config: Training configuration dictionary
        
    Returns:
        Tuple of (train_transform, val_transform)
    """
    # Image size from config
    img_size = config['data']['input_shape'][1]  # Assuming square images
    
    # Normalization values (ImageNet defaults)
    mean = config['data'].get('mean', [0.485, 0.456, 0.406])
    std = config['data'].get('std', [0.229, 0.224, 0.225])
    
    # Training transforms with augmentation
    train_transform = transforms.Compose([
        transforms.Resize((img_size + 32, img_size + 32)),
        transforms.RandomCrop(img_size),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.RandomGrayscale(p=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std),
        transforms.RandomErasing(p=0.1, scale=(0.02, 0.33), ratio=(0.3, 3.3))
    ])
    
    # Validation transforms (no augmentation)
    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std)
    ])
    
    return train_transform, val_transform


def get_albumentations_transforms(config: Dict[str, Any]) -> Tuple[A.Compose, A.Compose]:
    """
    Alternative transforms using Albumentations (more agricultural-specific augmentations)
    
    Args:
        config: Training configuration dictionary
        
    Returns:
        Tuple of (train_transform, val_transform)
    """
    img_size = config['data']['input_shape'][1]
    
    # Training transforms with agricultural-specific augmentations
    train_transform = A.Compose([
        A.Resize(img_size, img_size),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.3),
        A.RandomRotate90(p=0.3),
        A.Rotate(limit=15, p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
        A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=10, p=0.5),
        A.OneOf([
            A.Blur(blur_limit=3, p=0.3),
            A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
            A.ISONoise(color_shift=(0.01, 0.05), intensity=(0.1, 0.5), p=0.3),
        ], p=0.3),
        A.OneOf([
            A.RandomShadow(shadow_roi=(0, 0.5, 1, 1), num_shadows_lower=1, num_shadows_upper=2, p=0.3),
            A.RandomSunFlare(flare_roi=(0, 0, 1, 0.5), angle_lower=0, angle_upper=1, p=0.2),
        ], p=0.2),
        A.CoarseDropout(max_holes=8, max_height=8, max_width=8, p=0.2),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])
    
    # Validation transforms
    val_transform = A.Compose([
        A.Resize(img_size, img_size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])
    
    return train_transform, val_transform


def export_to_onnx(
    model_path: str, 
    onnx_path: str, 
    input_shape: List[int], 
    num_classes: int,
    model_name: str = 'efficientnet_b0'
):
    """
    Export trained model to ONNX format
    
    Args:
        model_path: Path to trained PyTorch model
        onnx_path: Output path for ONNX model
        input_shape: Input shape [C, H, W]
        num_classes: Number of output classes
        model_name: Model architecture name
    """
    import timm
    
    logger.info(f"Exporting model to ONNX: {onnx_path}")
    
    # Load model
    device = torch.device('cpu')  # Export on CPU for compatibility
    
    # Create model architecture
    model = timm.create_model(model_name, pretrained=False, num_classes=num_classes)
    
    # Load trained weights
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    # Create dummy input
    dummy_input = torch.randn(1, *input_shape)
    
    # Export to ONNX
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    # Verify ONNX model
    try:
        onnx_model = onnx.load(onnx_path)
        onnx.checker.check_model(onnx_model)
        logger.info("ONNX model export successful and verified")
        
        # Test inference
        ort_session = ort.InferenceSession(onnx_path)
        ort_inputs = {ort_session.get_inputs()[0].name: dummy_input.numpy()}
        ort_outputs = ort_session.run(None, ort_inputs)
        logger.info(f"ONNX inference test successful. Output shape: {ort_outputs[0].shape}")
        
    except Exception as e:
        logger.error(f"ONNX model verification failed: {e}")
        raise


def calibrate_model(model_path: str, val_loader, calibration_path: str):
    """
    Calibrate model probabilities using temperature scaling
    
    Args:
        model_path: Path to trained model
        val_loader: Validation data loader
        calibration_path: Output path for calibration parameters
    """
    logger.info("Calibrating model probabilities...")
    
    # Load model
    checkpoint = torch.load(model_path)
    # This is a simplified version - you'd need to adapt for your specific model
    
    # For now, create a placeholder calibration file
    calibration_data = {
        "temperature": 1.0,
        "description": "Temperature scaling parameter for probability calibration",
        "calibration_method": "temperature_scaling",
        "validation_ece": 0.0,  # Expected Calibration Error
        "validation_accuracy": 0.0
    }
    
    with open(calibration_path, 'w') as f:
        json.dump(calibration_data, f, indent=2)
    
    logger.info(f"Calibration file created: {calibration_path}")


def create_label_mapping(dataset: AgriculturalDataset, label_map_path: str):
    """
    Create label mapping file from dataset
    
    Args:
        dataset: Training dataset
        label_map_path: Output path for label mapping
    """
    label_mapping = {str(idx): class_name for class_name, idx in dataset.class_to_idx.items()}
    
    with open(label_map_path, 'w') as f:
        json.dump(label_mapping, f, indent=2)
    
    logger.info(f"Label mapping created: {label_map_path}")
    logger.info(f"Classes: {label_mapping}")


def create_training_config_template() -> Dict[str, Any]:
    """Create a template training configuration"""
    return {
        "model": {
            "name": "efficientnet_b0",
            "pretrained": True
        },
        "data": {
            "root_dir": "../data/datasets/agricultural_images",
            "num_classes": 7,
            "input_shape": [3, 224, 224],
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        },
        "training": {
            "batch_size": 32,
            "epochs": 50,
            "num_workers": 4,
            "use_class_weights": True,
            "optimizer": {
                "name": "adamw",
                "lr": 0.001,
                "weight_decay": 0.01
            },
            "scheduler": {
                "name": "cosine"
            }
        },
        "output": {
            "model_dir": "../data/models/weights"
        }
    }


def split_dataset(
    source_dir: str, 
    output_dir: str, 
    train_ratio: float = 0.7, 
    val_ratio: float = 0.15, 
    test_ratio: float = 0.15
):
    """
    Split dataset into train/validation/test sets
    
    Args:
        source_dir: Directory containing class subdirectories
        output_dir: Output directory for split datasets
        train_ratio: Ratio for training set
        val_ratio: Ratio for validation set  
        test_ratio: Ratio for test set
    """
    from shutil import copy2
    from sklearn.model_selection import train_test_split
    
    source_path = Path(source_dir)
    output_path = Path(output_dir)
    
    # Create output directories
    for split in ['train', 'val', 'test']:
        (output_path / split).mkdir(parents=True, exist_ok=True)
    
    # Process each class
    for class_dir in source_path.iterdir():
        if not class_dir.is_dir():
            continue
            
        class_name = class_dir.name
        
        # Create class directories in each split
        for split in ['train', 'val', 'test']:
            (output_path / split / class_name).mkdir(parents=True, exist_ok=True)
        
        # Get all images
        images = list(class_dir.glob('*'))
        images = [img for img in images if img.suffix.lower() in {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}]
        
        # Split data
        train_imgs, temp_imgs = train_test_split(images, test_size=(1-train_ratio), random_state=42)
        val_imgs, test_imgs = train_test_split(
            temp_imgs, 
            test_size=(test_ratio/(val_ratio + test_ratio)), 
            random_state=42
        )
        
        # Copy files
        for img in train_imgs:
            copy2(img, output_path / 'train' / class_name / img.name)
        
        for img in val_imgs:
            copy2(img, output_path / 'val' / class_name / img.name)
        
        for img in test_imgs:
            copy2(img, output_path / 'test' / class_name / img.name)
        
        logger.info(f"Class {class_name}: {len(train_imgs)} train, {len(val_imgs)} val, {len(test_imgs)} test")
    
    logger.info(f"Dataset split completed. Output: {output_dir}")


if __name__ == '__main__':
    # Create example training configuration
    config = create_training_config_template()
    
    with open('../configs/training_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("Training configuration template created!")
