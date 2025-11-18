"""
Agricultural Pest & Disease Classification Training Script
Train models for pest and disease detection from agricultural images
"""

import os
import json
import logging
import argparse
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler
import torchvision.transforms as transforms
import timm
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import wandb

# Import custom modules
from training_utils import (
    AgriculturalDataset, 
    get_data_transforms, 
    export_to_onnx,
    calibrate_model,
    create_label_mapping
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgriculturalClassifier:
    """
    Agricultural pest and disease classifier training pipeline
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize trainer with configuration"""
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # Initialize model
        self.model = self._create_model()
        self.criterion = self._create_criterion()
        self.optimizer = self._create_optimizer()
        self.scheduler = self._create_scheduler()
        
        # Training tracking
        self.best_accuracy = 0.0
        self.train_losses = []
        self.val_accuracies = []
        
    def _create_model(self) -> nn.Module:
        """Create the classification model"""
        model_name = self.config['model']['name']
        num_classes = self.config['data']['num_classes']
        pretrained = self.config['model']['pretrained']
        
        logger.info(f"Creating model: {model_name} with {num_classes} classes")
        
        # Use timm for a wide variety of pre-trained models
        model = timm.create_model(
            model_name, 
            pretrained=pretrained, 
            num_classes=num_classes
        )
        
        return model.to(self.device)
    
    def _create_criterion(self) -> nn.Module:
        """Create loss function with class weighting if specified"""
        if self.config['training'].get('use_class_weights', False):
            # Calculate class weights from training data
            weights = self._calculate_class_weights()
            criterion = nn.CrossEntropyLoss(weight=weights)
            logger.info("Using weighted CrossEntropyLoss")
        else:
            criterion = nn.CrossEntropyLoss()
            logger.info("Using standard CrossEntropyLoss")
            
        return criterion.to(self.device)
    
    def _calculate_class_weights(self) -> torch.Tensor:
        """Calculate inverse frequency weights for imbalanced classes"""
        # This would need to be implemented based on your dataset
        # For now, return uniform weights
        num_classes = self.config['data']['num_classes']
        return torch.ones(num_classes).to(self.device)
    
    def _create_optimizer(self) -> optim.Optimizer:
        """Create optimizer"""
        optimizer_config = self.config['training']['optimizer']
        
        if optimizer_config['name'] == 'adam':
            optimizer = optim.Adam(
                self.model.parameters(),
                lr=optimizer_config['lr'],
                weight_decay=optimizer_config.get('weight_decay', 0)
            )
        elif optimizer_config['name'] == 'adamw':
            optimizer = optim.AdamW(
                self.model.parameters(),
                lr=optimizer_config['lr'],
                weight_decay=optimizer_config.get('weight_decay', 0.01)
            )
        else:
            optimizer = optim.SGD(
                self.model.parameters(),
                lr=optimizer_config['lr'],
                momentum=optimizer_config.get('momentum', 0.9),
                weight_decay=optimizer_config.get('weight_decay', 0)
            )
            
        return optimizer
    
    def _create_scheduler(self) -> Optional[optim.lr_scheduler._LRScheduler]:
        """Create learning rate scheduler"""
        scheduler_config = self.config['training'].get('scheduler')
        
        if not scheduler_config:
            return None
            
        if scheduler_config['name'] == 'cosine':
            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                self.optimizer,
                T_max=self.config['training']['epochs']
            )
        elif scheduler_config['name'] == 'step':
            scheduler = optim.lr_scheduler.StepLR(
                self.optimizer,
                step_size=scheduler_config.get('step_size', 10),
                gamma=scheduler_config.get('gamma', 0.1)
            )
        else:
            return None
            
        return scheduler
    
    def train_epoch(self, train_loader: DataLoader) -> float:
        """Train for one epoch"""
        self.model.train()
        running_loss = 0.0
        correct_predictions = 0
        total_samples = 0
        
        pbar = tqdm(train_loader, desc='Training')
        
        for batch_idx, (images, labels) in enumerate(pbar):
            images, labels = images.to(self.device), labels.to(self.device)
            
            # Forward pass
            self.optimizer.zero_grad()
            outputs = self.model(images)
            loss = self.criterion(outputs, labels)
            
            # Backward pass
            loss.backward()
            self.optimizer.step()
            
            # Statistics
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total_samples += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()
            
            # Update progress bar
            pbar.set_postfix({
                'Loss': f'{loss.item():.4f}',
                'Acc': f'{100 * correct_predictions / total_samples:.2f}%'
            })
        
        epoch_loss = running_loss / len(train_loader)
        epoch_accuracy = 100 * correct_predictions / total_samples
        
        return epoch_loss, epoch_accuracy
    
    def validate(self, val_loader: DataLoader) -> Tuple[float, float]:
        """Validate the model"""
        self.model.eval()
        running_loss = 0.0
        correct_predictions = 0
        total_samples = 0
        
        with torch.no_grad():
            for images, labels in tqdm(val_loader, desc='Validation'):
                images, labels = images.to(self.device), labels.to(self.device)
                
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                
                running_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total_samples += labels.size(0)
                correct_predictions += (predicted == labels).sum().item()
        
        val_loss = running_loss / len(val_loader)
        val_accuracy = 100 * correct_predictions / total_samples
        
        return val_loss, val_accuracy
    
    def train(self, train_loader: DataLoader, val_loader: DataLoader):
        """Main training loop"""
        logger.info("Starting training...")
        
        for epoch in range(self.config['training']['epochs']):
            logger.info(f"Epoch {epoch+1}/{self.config['training']['epochs']}")
            
            # Train
            train_loss, train_acc = self.train_epoch(train_loader)
            
            # Validate
            val_loss, val_acc = self.validate(val_loader)
            
            # Update scheduler
            if self.scheduler:
                self.scheduler.step()
            
            # Track metrics
            self.train_losses.append(train_loss)
            self.val_accuracies.append(val_acc)
            
            # Log to wandb if available
            if wandb.run:
                wandb.log({
                    'epoch': epoch,
                    'train_loss': train_loss,
                    'train_accuracy': train_acc,
                    'val_loss': val_loss,
                    'val_accuracy': val_acc,
                    'learning_rate': self.optimizer.param_groups[0]['lr']
                })
            
            # Save best model
            if val_acc > self.best_accuracy:
                self.best_accuracy = val_acc
                self._save_checkpoint('best_model.pth')
                logger.info(f"New best accuracy: {val_acc:.2f}%")
            
            logger.info(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
            logger.info(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
            
        logger.info(f"Training completed! Best validation accuracy: {self.best_accuracy:.2f}%")
    
    def _save_checkpoint(self, filename: str):
        """Save model checkpoint"""
        checkpoint = {
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'best_accuracy': self.best_accuracy,
            'config': self.config
        }
        
        save_path = Path(self.config['output']['model_dir']) / filename
        torch.save(checkpoint, save_path)
        logger.info(f"Checkpoint saved: {save_path}")


def create_data_loaders(config: Dict[str, Any]) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """Create train, validation, and test data loaders"""
    data_dir = Path(config['data']['root_dir'])
    
    # Get transforms
    train_transform, val_transform = get_data_transforms(config)
    
    # Create datasets
    train_dataset = AgriculturalDataset(
        root_dir=data_dir / 'train',
        transform=train_transform
    )
    
    val_dataset = AgriculturalDataset(
        root_dir=data_dir / 'val',
        transform=val_transform
    )
    
    test_dataset = AgriculturalDataset(
        root_dir=data_dir / 'test',
        transform=val_transform
    )
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=config['training']['batch_size'],
        shuffle=True,
        num_workers=config['training']['num_workers'],
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=config['training']['batch_size'],
        shuffle=False,
        num_workers=config['training']['num_workers'],
        pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=config['training']['batch_size'],
        shuffle=False,
        num_workers=config['training']['num_workers'],
        pin_memory=True
    )
    
    return train_loader, val_loader, test_loader


def main():
    """Main training function"""
    parser = argparse.ArgumentParser(description='Train Agricultural AI Model')
    parser.add_argument('--config', type=str, required=True,
                       help='Path to training configuration file')
    parser.add_argument('--wandb', action='store_true',
                       help='Use Weights & Biases for experiment tracking')
    
    args = parser.parse_args()
    
    # Load configuration
    with open(args.config, 'r') as f:
        config = json.load(f)
    
    # Initialize wandb if requested
    if args.wandb:
        wandb.init(project='agricultural-ai', config=config)
    
    # Create output directory
    output_dir = Path(config['output']['model_dir'])
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create data loaders
    train_loader, val_loader, test_loader = create_data_loaders(config)
    
    # Initialize trainer
    trainer = AgriculturalClassifier(config)
    
    # Train model
    trainer.train(train_loader, val_loader)
    
    # Export to ONNX
    model_path = output_dir / 'best_model.pth'
    onnx_path = output_dir / f"{config['model']['name']}.onnx"
    
    export_to_onnx(
        model_path=model_path,
        onnx_path=onnx_path,
        input_shape=config['data']['input_shape'],
        num_classes=config['data']['num_classes']
    )
    
    # Create label mapping
    label_map_path = output_dir / 'labels.json'
    create_label_mapping(train_loader.dataset, label_map_path)
    
    # Calibrate model
    calibration_path = output_dir / 'calibration.json'
    calibrate_model(model_path, val_loader, calibration_path)
    
    logger.info("Training pipeline completed successfully!")


if __name__ == '__main__':
    main()
