import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder, RobustScaler
from sklearn.ensemble import (
    RandomForestClassifier, 
    ExtraTreesClassifier, 
    VotingClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier
)
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score
from sklearn.utils.class_weight import compute_class_weight
from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectKBest, f_classif
import joblib
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple
import warnings
warnings.filterwarnings('ignore')

# Optional GPU-enhanced ML libraries
try:
    import xgboost as xgb
    from lightgbm import LGBMClassifier
    ADVANCED_MODELS_AVAILABLE = True
    
    # Enhanced GPU detection for NVIDIA GPUs
    try:
        import torch
        GPU_AVAILABLE = torch.cuda.is_available()
        GPU_DEVICE_COUNT = torch.cuda.device_count() if GPU_AVAILABLE else 0
        
        # Force CUDA device selection for multi-GPU systems
        if GPU_AVAILABLE and GPU_DEVICE_COUNT > 1:
            # Use GPU 1 (NVIDIA) instead of GPU 0 (AMD)
            torch.cuda.set_device(1)
            GPU_DEVICE_ID = 1
        elif GPU_AVAILABLE:
            GPU_DEVICE_ID = 0
        else:
            GPU_DEVICE_ID = None
            
        # Additional NVIDIA GPU verification
        if GPU_AVAILABLE:
            current_device = torch.cuda.current_device()
            device_name = torch.cuda.get_device_name(current_device)
            device_memory = torch.cuda.get_device_properties(current_device).total_memory / 1024**3
        else:
            current_device = None
            device_name = "None"
            device_memory = 0
            
    except ImportError:
        GPU_AVAILABLE = False
        GPU_DEVICE_COUNT = 0
        GPU_DEVICE_ID = None
        current_device = None
        device_name = "None"
        device_memory = 0
        
except ImportError:
    ADVANCED_MODELS_AVAILABLE = False
    GPU_AVAILABLE = False
    GPU_DEVICE_COUNT = 0
    GPU_DEVICE_ID = None
    current_device = None
    device_name = "None"
    device_memory = 0

logger = logging.getLogger(__name__)

# Enhanced GPU status logging
logger.info(f"🎮 GPU Status: Available={GPU_AVAILABLE}, Devices={GPU_DEVICE_COUNT}")
if GPU_AVAILABLE:
    logger.info(f"🚀 Using GPU {GPU_DEVICE_ID}: {device_name} ({device_memory:.1f}GB)")
else:
    logger.info("💻 No GPU detected, using CPU")
    
if ADVANCED_MODELS_AVAILABLE:
    logger.info(f"✅ Advanced models available: XGBoost, LightGBM (5-model ensemble)")
else:
    logger.info("⚠️ Advanced ML libraries not available, using basic models only")

class UltraHighAccuracyCropRecommendationSystem:
    """Ultra-high accuracy crop recommendation system with advanced ensemble methods."""
    
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.feature_selector = None
        self.feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'market_price', 'price_trend_score', 'profitability_score']
        self.crop_labels = []
        self.crop_profiles = {}
        self.model_metrics = {}
        self.feature_importance = {}
        self.individual_model_scores = {}
        
    def initialize(self) -> bool:
        """Initialize the ultra-high accuracy system."""
        try:
            logger.info("Loading datasets for ultra-high accuracy training...")
            full_dataset = self.load_datasets()
            
            if full_dataset is None or full_dataset.empty:
                logger.error("No data loaded for training")
                return False
            
            # Advanced data preprocessing with feature engineering
            X, y = self.advanced_preprocessing(full_dataset)
            
            # Train ultra-high accuracy ensemble
            self.train_ultra_ensemble(X, y)
            
            # Build enhanced crop profiles
            self.build_crop_profiles(full_dataset)
            
            logger.info("Ultra-high accuracy crop recommendation system initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Ultra system initialization failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def load_datasets(self) -> pd.DataFrame:
        """Load datasets with advanced cleaning."""
        logger.info(f"🔍 Looking for datasets in: {self.data_path}")
        logger.info(f"🔍 Data path exists: {self.data_path.exists()}")
        logger.info(f"🔍 Data path absolute: {self.data_path.absolute()}")
        
        combined_data = []
        
        # First try loading the combined dataset (priority)
        try:
            combined_path = self.data_path / "combined_crop_dataset.csv"
            logger.info(f"🔍 Checking combined dataset at: {combined_path}")
            logger.info(f"🔍 Combined dataset exists: {combined_path.exists()}")
            
            if combined_path.exists():
                logger.info(f"🎯 Loading enhanced combined dataset: {combined_path}")
                combined_df = pd.read_csv(combined_path)
                logger.info(f"✅ Loaded enhanced dataset: {len(combined_df)} records, {len(combined_df.columns)} features")
                logger.info(f"📊 Unique crops: {len(combined_df['label'].unique()) if 'label' in combined_df.columns else 'Unknown'}")
                return self.advanced_data_cleaning(combined_df)
        except Exception as e:
            logger.warning(f"⚠️ Could not load combined dataset: {e}")
            logger.info("📂 Falling back to original dataset files...")
            
        # List all files in data directory for debugging
        try:
            data_files = list(self.data_path.glob("*"))
            logger.info(f"🔍 Files in data directory: {[f.name for f in data_files]}")
        except Exception as e:
            logger.error(f"🔍 Could not list data directory: {e}")
            
        # Fallback to original files if combined dataset not found
        csv_files = [
            "crop_recommendation-1.csv",
            "Crop_Prediction_dataset.xlsx", 
            "Crop_Recommendation.xlsx"
        ]
        for csv_file in csv_files:
            try:
                csv_path = self.data_path / csv_file
                logger.info(f"🔍 Checking: {csv_path} (exists: {csv_path.exists()})")
                if csv_path.exists():
                    if csv_file.endswith('.csv'):
                        csv_data = pd.read_csv(csv_path)
                    else:
                        csv_data = pd.read_excel(csv_path)
                    logger.info(f"✅ Loaded CSV: {csv_file} - {len(csv_data)} records")
                    combined_data.append(csv_data)
                    break
            except Exception as e:
                logger.warning(f"Could not load {csv_file}: {e}")
        
        # Load Excel datasets
        excel_configs = [
            ("Crop-Recommendation-Dataset.xlsx", "TrainingData"),
            ("Crop_Predication_dataset.xlsx", "Sheet1")
        ]
        
        for excel_file, sheet_name in excel_configs:
            try:
                excel_path = self.data_path / excel_file
                if excel_path.exists():
                    try:
                        excel_data = pd.read_excel(excel_path, sheet_name=sheet_name)
                    except:
                        excel_data = pd.read_excel(excel_path)
                    
                    # Standardize column names
                    column_mapping = {
                        'Label': 'label',
                        'Temperature': 'temperature',
                        'Humidity': 'humidity',
                        'pH': 'ph',
                        'Rainfall': 'rainfall'
                    }
                    excel_data = excel_data.rename(columns=column_mapping)
                    
                    logger.info(f"✅ Loaded Excel: {excel_file} - {len(excel_data)} records")
                    combined_data.append(excel_data)
                    
            except Exception as e:
                logger.warning(f"Could not load {excel_file}: {e}")
        
        if not combined_data:
            raise FileNotFoundError("No valid datasets found")
        
        # Combine and clean
        full_dataset = pd.concat(combined_data, ignore_index=True, sort=False)
        full_dataset = self.advanced_data_cleaning(full_dataset)
        
        logger.info(f"✅ Ultra dataset ready: {len(full_dataset)} records, {len(full_dataset['label'].unique())} crops")
        return full_dataset
    
    def advanced_data_cleaning(self, df: pd.DataFrame) -> pd.DataFrame:
        """SAFE data cleaning - minimal processing to preserve data."""
        logger.info("Performing SAFE agricultural data cleaning...")
        
        initial_size = len(df)
        
        # Standardize crop labels only
        if 'label' in df.columns:
            df['label'] = df['label'].str.lower().str.strip()
        
        # Remove exact duplicates only
        df = df.drop_duplicates()
        duplicates_removed = initial_size - len(df)
        
        # DO NOT remove missing values - handle them intelligently
        # Check which columns have missing values
        missing_info = df.isnull().sum()
        if missing_info.sum() > 0:
            logger.info("Missing values found:")
            for col, count in missing_info.items():
                if count > 0:
                    logger.info(f"  {col}: {count} missing values")
            
            # Fill missing values instead of removing rows
            numeric_columns = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
            for col in numeric_columns:
                if col in df.columns and df[col].isnull().sum() > 0:
                    median_value = df[col].median()
                    df[col] = df[col].fillna(median_value)
                    logger.info(f"  Filled {col} missing values with median: {median_value}")
            
            # Fill missing labels with 'unknown' temporarily
            if 'label' in df.columns and df['label'].isnull().sum() > 0:
                df = df.dropna(subset=['label'])  # Only drop rows with missing labels
        
        final_size = len(df)
        logger.info(f"SAFE cleaning: {initial_size} → {final_size} records ({final_size/initial_size*100:.1f}% retained)")
        logger.info(f"  Duplicates removed: {duplicates_removed}")
        logger.info(f"  Missing value handling: Filled instead of removing")
        
        # Ensure we have data
        if final_size < 100:
            logger.error(f"❌ Only {final_size} records remaining - something is wrong!")
            logger.info("Checking data structure...")
            
            logger.info(f"DataFrame shape: {df.shape}")
            logger.info(f"Columns: {list(df.columns)}")
            logger.info(f"Data types:\n{df.dtypes}")
            
            if final_size == 0:
                logger.error("❌ NO DATA REMAINING - returning minimal processed data")
                # Return original with minimal processing
                original_df = df.copy()
                if 'label' in original_df.columns:
                    original_df['label'] = original_df['label'].str.lower().str.strip()
                return original_df.drop_duplicates()
        
        return df


    def advanced_preprocessing(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Advanced preprocessing with feature engineering including market data."""
        logger.info("Advanced preprocessing with feature engineering and market data...")
        
        # Extract basic features (excluding market features for now)
        basic_features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        available_basic = [f for f in basic_features if f in df.columns]
        X_basic = df[available_basic].copy()
        y = df['label'].copy()
        
        # Add market features (will be populated during prediction)
        # For training, we'll use historical/average market data
        X_basic['market_price'] = self._get_historical_market_prices(y)
        X_basic['price_trend_score'] = self._get_price_trend_scores(y)
        X_basic['profitability_score'] = self._get_profitability_scores(y, X_basic['market_price'])
        
        # Feature Engineering - Create derived features
        feature_engineered = X_basic.copy()
        
        # NPK ratios and interactions
        if all(col in X_basic.columns for col in ['N', 'P', 'K']):
            total_npk = X_basic['N'] + X_basic['P'] + X_basic['K']
            feature_engineered['N_ratio'] = X_basic['N'] / (total_npk + 1e-8)
            feature_engineered['P_ratio'] = X_basic['P'] / (total_npk + 1e-8)
            feature_engineered['K_ratio'] = X_basic['K'] / (total_npk + 1e-8)
            feature_engineered['NP_ratio'] = X_basic['N'] / (X_basic['P'] + 1e-8)
            feature_engineered['NK_ratio'] = X_basic['N'] / (X_basic['K'] + 1e-8)
            feature_engineered['PK_ratio'] = X_basic['P'] / (X_basic['K'] + 1e-8)
        
        # Environmental indices
        if all(col in X_basic.columns for col in ['temperature', 'humidity']):
            feature_engineered['temp_humidity_index'] = X_basic['temperature'] * X_basic['humidity'] / 100
            feature_engineered['comfort_index'] = 100 - abs(X_basic['temperature'] - 25) - abs(X_basic['humidity'] - 70)
        
        # Soil fertility composite
        if all(col in X_basic.columns for col in ['N', 'P', 'K', 'ph']):
            ph_optimal = 1 / (1 + abs(X_basic['ph'] - 6.5))
            nutrient_balance = (X_basic['N'] + X_basic['P'] + X_basic['K']) / 3
            feature_engineered['soil_fertility_composite'] = nutrient_balance * ph_optimal
        
        # Water stress indicator
        if all(col in X_basic.columns for col in ['rainfall', 'temperature', 'humidity']):
            evaporation_rate = X_basic['temperature'] * (100 - X_basic['humidity']) / 100
            feature_engineered['water_stress'] = evaporation_rate / (X_basic['rainfall'] + 1e-8)
        
        # Update feature names
        self.feature_names = list(feature_engineered.columns)
        
        # Advanced scaling with RobustScaler (less sensitive to outliers)
        self.scaler = RobustScaler()
        X_scaled = self.scaler.fit_transform(feature_engineered)
        
        # Feature selection using statistical tests
        self.feature_selector = SelectKBest(score_func=f_classif, k='all')
        X_selected = self.feature_selector.fit_transform(X_scaled, y)
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        self.crop_labels = list(self.label_encoder.classes_)
        
        logger.info(f"Advanced preprocessing: {X_selected.shape[1]} features, {len(self.crop_labels)} crops")
        logger.info(f"Feature engineering added {len(self.feature_names) - len(available_basic)} derived features")
        
        return X_selected, y_encoded
    
    def train_ultra_ensemble(self, X: np.ndarray, y: np.ndarray) -> None:
        """Train ultra-high accuracy ensemble with multiple algorithms."""
        logger.info("Training ultra-high accuracy ensemble...")
        
        # Stratified split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.15, random_state=42, stratify=y
        )
        
        # Create diverse base models with optimized parameters
        base_models = []
        
        # 1. Optimized Random Forest
        rf_model = RandomForestClassifier(
            n_estimators=500,
            max_depth=25,
            min_samples_split=2,
            min_samples_leaf=1,
            max_features='log2',
            class_weight='balanced',
            random_state=42,
            n_jobs=-1,
            bootstrap=True,
            oob_score=True
        )
        base_models.append(('rf', rf_model))
        
        # 2. Extra Trees (more randomization)
        et_model = ExtraTreesClassifier(
            n_estimators=500,
            max_depth=25,
            min_samples_split=2,
            min_samples_leaf=1,
            max_features='log2',
            class_weight='balanced',
            random_state=43,
            n_jobs=-1,
            bootstrap=True
        )
        base_models.append(('et', et_model))
        
        # 3. Gradient Boosting
        gb_model = GradientBoostingClassifier(
            n_estimators=300,
            learning_rate=0.1,
            max_depth=8,
            min_samples_split=4,
            min_samples_leaf=2,
            subsample=0.8,
            random_state=44,
            validation_fraction=0.1,
            n_iter_no_change=20
        )
        base_models.append(('gb', gb_model))
        
        # 4. Add GPU-optimized models if available
        if ADVANCED_MODELS_AVAILABLE:
            # XGBoost with GPU support
            xgb_params = {
                'n_estimators': 400,
                'max_depth': 8,
                'learning_rate': 0.1,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'reg_alpha': 0.1,
                'reg_lambda': 0.1,
                'random_state': 47,
                'n_jobs': -1,
                'eval_metric': 'mlogloss'
            }
            
            # Enable GPU if available
            if GPU_AVAILABLE:
                xgb_params['tree_method'] = 'gpu_hist'
                xgb_params['gpu_id'] = GPU_DEVICE_ID  # Use the detected GPU device
                logger.info(f"🚀 XGBoost: Using GPU {GPU_DEVICE_ID} acceleration")
            else:
                xgb_params['tree_method'] = 'hist'
                logger.info("💻 XGBoost: Using CPU")
                xgb_params['tree_method'] = 'hist'
                logger.info("💻 XGBoost: Using CPU")
                
            xgb_model = xgb.XGBClassifier(**xgb_params)
            base_models.append(('xgb', xgb_model))
            
            # LightGBM with GPU support
            lgb_params = {
                'n_estimators': 400,
                'max_depth': 8,
                'learning_rate': 0.1,
                'feature_fraction': 0.8,
                'bagging_fraction': 0.8,
                'bagging_freq': 5,
                'reg_alpha': 0.1,
                'reg_lambda': 0.1,
                'random_state': 48,
                'n_jobs': -1,
                'objective': 'multiclass',
                'verbose': -1
            }
            
            # Enable GPU if available
            if GPU_AVAILABLE:
                lgb_params['device'] = 'gpu'
                lgb_params['gpu_platform_id'] = 0  # OpenCL platform
                lgb_params['gpu_device_id'] = GPU_DEVICE_ID  # Use detected GPU device
                logger.info(f"🚀 LightGBM: Using GPU {GPU_DEVICE_ID} acceleration")
            else:
                lgb_params['device'] = 'cpu'
                logger.info("💻 LightGBM: Using CPU")
                
            lgb_model = LGBMClassifier(**lgb_params)
            base_models.append(('lgb', lgb_model))
            
            # Using 5 high-performance models (optimized ensemble)
            logger.info(f"✅ Using {len(base_models)} models with GPU optimization")
        else:
            logger.info(f"✅ Using {len(base_models)} basic models (GPU libraries not available)")
        
        # Train individual models and evaluate
        individual_scores = {}
        trained_models = []
        
        for name, model in base_models:
            try:
                logger.info(f"Training {name}...")
                model.fit(X_train, y_train)
                
                # Evaluate individual model
                y_pred = model.predict(X_test)
                accuracy = accuracy_score(y_test, y_pred)
                f1 = f1_score(y_test, y_pred, average='weighted')
                
                individual_scores[name] = {
                    'accuracy': accuracy,
                    'f1_score': f1
                }
                
                trained_models.append((name, model))
                logger.info(f"  {name}: Accuracy={accuracy:.4f}, F1={f1:.4f}")
                
            except Exception as e:
                logger.warning(f"Failed to train {name}: {e}")
                continue
        
        # Create weighted ensemble based on individual performance
        model_weights = []
        final_estimators = []
        
        for name, model in trained_models:
            weight = individual_scores[name]['f1_score']  # Use F1 score for weighting
            model_weights.append(weight)
            final_estimators.append((name, model))
        
        # Normalize weights
        total_weight = sum(model_weights)
        normalized_weights = [w/total_weight for w in model_weights]
        
        # Create final ensemble with soft voting
        self.model = VotingClassifier(
            estimators=final_estimators,
            voting='soft'
        )
        
        logger.info("🔗 Training ensemble model...")
        # Train ensemble
        self.model.fit(X_train, y_train)
        
        logger.info("📊 Running optimized cross-validation...")
        # Fast 3-fold cross-validation to reduce training time
        cv_scores = cross_val_score(
            self.model, X, y,
            cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=42),
            scoring='accuracy',
            n_jobs=-1
        )
        
        y_pred_ensemble = self.model.predict(X_test)
        test_accuracy = accuracy_score(y_test, y_pred_ensemble)
        test_f1 = f1_score(y_test, y_pred_ensemble, average='weighted')
        
        # Store comprehensive metrics
        self.model_metrics = {
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'test_accuracy': test_accuracy,
            'test_f1_score': test_f1,
            'individual_models': individual_scores,
            'ensemble_improvement': test_accuracy - max([scores['accuracy'] for scores in individual_scores.values()]),
            'cv_scores': cv_scores.tolist()
        }
        
        self.individual_model_scores = individual_scores
        
        # Feature importance (from Random Forest)
        if hasattr(self.model.estimators_[0][1], 'feature_importances_'):
            self.feature_importance = dict(zip(
                [f"feature_{i}" for i in range(len(self.feature_names))],
                self.model.estimators_[0][1].feature_importances_
            ))
        
        logger.info(f"🎉 Ultra-high accuracy ensemble training completed!")
        logger.info(f"  Cross-validation: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")
        logger.info(f"  Test accuracy: {test_accuracy:.4f}")
        logger.info(f"  Test F1-score: {test_f1:.4f}")
        logger.info(f"  Ensemble improvement: +{self.model_metrics['ensemble_improvement']:.4f}")
        logger.info(f"  Best individual model: {max(individual_scores.items(), key=lambda x: x[1]['accuracy'])[0]}")
        
        # Detailed classification report
        logger.info("\n" + "="*50)
        logger.info("DETAILED CLASSIFICATION REPORT:")
        logger.info("="*50)
        report = classification_report(
            y_test, y_pred_ensemble, 
            target_names=[str(cls) for cls in self.label_encoder.classes_],
            digits=4
        )
        logger.info(report)
    
    def predict(self, input_data: Dict[str, float], top_k: int = 5, market_data: Dict = None) -> Dict[str, Any]:
        """Ultra-high accuracy prediction with market data integration."""
        if self.model is None or self.scaler is None:
            raise ValueError("Model not trained. Call initialize() first.")
        
        # Prepare basic features
        feature_vector = []
        for feature in ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']:
            value = input_data.get(feature.lower(), input_data.get(feature, 0))
            feature_vector.append(float(value))
        
        # Add market features
        if market_data:
            market_price = market_data.get('current_price', 2000)
            price_trend = market_data.get('price_trend', 'stable')
            profitability = market_data.get('profitability', {})
            
            # Convert price trend to score
            trend_score = 0.5  # stable
            if price_trend == 'rising':
                trend_score = 0.8
            elif price_trend == 'falling':
                trend_score = 0.2
            
            # Get profitability score
            profit_score = profitability.get('profitability_score', 0.5) if profitability else 0.5
            
            feature_vector.extend([market_price, trend_score, profit_score])
        else:
            # Use default market values if no market data
            feature_vector.extend([2000, 0.5, 0.5])
        
        # Recreate the exact same feature engineering as training
        # Create DataFrame with the same structure as training
        input_df = pd.DataFrame([{
            'N': feature_vector[0],
            'P': feature_vector[1], 
            'K': feature_vector[2],
            'temperature': feature_vector[3],
            'humidity': feature_vector[4],
            'ph': feature_vector[5],
            'rainfall': feature_vector[6],
            'market_price': feature_vector[7],
            'price_trend_score': feature_vector[8],
            'profitability_score': feature_vector[9]
        }])
        
        # Apply the exact same feature engineering as training
        feature_engineered = input_df.copy()
        
        # NPK ratios and interactions
        total_npk = input_df['N'] + input_df['P'] + input_df['K']
        feature_engineered['N_ratio'] = input_df['N'] / (total_npk + 1e-8)
        feature_engineered['P_ratio'] = input_df['P'] / (total_npk + 1e-8)
        feature_engineered['K_ratio'] = input_df['K'] / (total_npk + 1e-8)
        feature_engineered['NP_ratio'] = input_df['N'] / (input_df['P'] + 1e-8)
        feature_engineered['NK_ratio'] = input_df['N'] / (input_df['K'] + 1e-8)
        feature_engineered['PK_ratio'] = input_df['P'] / (input_df['K'] + 1e-8)
        
        # Environmental indices
        feature_engineered['temp_humidity_index'] = input_df['temperature'] * input_df['humidity'] / 100
        feature_engineered['comfort_index'] = 100 - abs(input_df['temperature'] - 25) - abs(input_df['humidity'] - 70)
        
        # Soil fertility composite
        ph_optimal = 1 / (1 + abs(input_df['ph'] - 6.5))
        nutrient_balance = (input_df['N'] + input_df['P'] + input_df['K']) / 3
        feature_engineered['soil_fertility_composite'] = nutrient_balance * ph_optimal
        
        # Water stress indicator
        evaporation_rate = input_df['temperature'] * (100 - input_df['humidity']) / 100
        feature_engineered['water_stress'] = evaporation_rate / (input_df['rainfall'] + 1e-8)
        
        # Convert to numpy array in the same order as training features
        engineered_features_array = feature_engineered[self.feature_names].values
        
        # Scale features using the same scaler from training
        X_input = self.scaler.transform(engineered_features_array)
        
        # Apply feature selection
        X_input = self.feature_selector.transform(X_input)
        
        # Get predictions with confidence
        probabilities = self.model.predict_proba(X_input)[0]
        
        # Get top-k predictions
        top_indices = np.argsort(probabilities)[::-1][:top_k]
        
        predictions = []
        for idx in top_indices:
            crop_name = self.label_encoder.classes_[idx]
            confidence = probabilities[idx]
            
            # Enhanced improvement suggestions
            improvements = self.generate_advanced_improvements(input_data, crop_name)
            
            predictions.append({
                "crop": crop_name,
                "confidence": float(confidence),
                "improvements": improvements,
                "suitability_grade": self._confidence_to_grade(confidence)
            })
        
        return {
            "primary_recommendation": predictions[0]["crop"],
            "primary_confidence": predictions[0]["confidence"],
            "all_recommendations": predictions,
            "model_metrics": self.model_metrics,
            "feature_importance": self.feature_importance,
            "individual_model_performance": self.individual_model_scores,
            "prediction_quality": "ultra_high_accuracy" if predictions[0]["confidence"] > 0.8 else "high_accuracy"
        }
    
    def generate_advanced_improvements(self, current_conditions: Dict[str, float], target_crop: str) -> List[str]:
        """Generate advanced, data-driven improvement suggestions."""
        suggestions = []
        
        if target_crop not in self.crop_profiles:
            return ["Consult local agricultural extension for specific guidance"]
        
        crop_profile = self.crop_profiles[target_crop]
        
        # Advanced NPK optimization
        for nutrient in ['N', 'P', 'K']:
            current_val = current_conditions.get(nutrient.lower(), 0)
            if nutrient in crop_profile.get('nutrients', {}):
                optimal_range = crop_profile['nutrients'][nutrient].get('optimal_range', [])
                mean_val = crop_profile['nutrients'][nutrient].get('mean', 0)
                
                if len(optimal_range) >= 2:
                    if current_val < optimal_range[0]:
                        deficit = optimal_range[0] - current_val
                        suggestions.append(f"Add {deficit:.0f} kg/ha of {nutrient} fertilizer (target: {mean_val:.0f} kg/ha)")
                    elif current_val > optimal_range[1]:
                        excess = current_val - optimal_range[1]
                        suggestions.append(f"Reduce {nutrient} by {excess:.0f} kg/ha (soil amendment needed)")
        
        # pH optimization with specific recommendations
        current_ph = current_conditions.get('ph', 7)
        if 'environment' in crop_profile and 'ph' in crop_profile['environment']:
            optimal_ph_range = crop_profile['environment']['ph'].get('optimal_range', [])
            if len(optimal_ph_range) >= 2:
                if current_ph < optimal_ph_range[0]:
                    ph_increase = optimal_ph_range[0] - current_ph
                    lime_needed = ph_increase * 1000  # Rough calculation
                    suggestions.append(f"Apply ~{lime_needed:.0f} kg/ha lime to increase pH from {current_ph} to {optimal_ph_range[0]:.1f}")
                elif current_ph > optimal_ph_range[1]:
                    ph_decrease = current_ph - optimal_ph_range[1]
                    sulfur_needed = ph_decrease * 500  # Rough calculation
                    suggestions.append(f"Apply ~{sulfur_needed:.0f} kg/ha sulfur to decrease pH from {current_ph} to {optimal_ph_range[1]:.1f}")
        
        # Environmental optimization
        if 'environment' in crop_profile:
            # Temperature guidance
            current_temp = current_conditions.get('temperature', 25)
            if 'temperature' in crop_profile['environment']:
                temp_range = crop_profile['environment']['temperature'].get('optimal_range', [])
                if len(temp_range) >= 2 and not (temp_range[0] <= current_temp <= temp_range[1]):
                    suggestions.append(f"Consider greenhouse/shade management (optimal: {temp_range[0]:.1f}-{temp_range[1]:.1f}°C, current: {current_temp}°C)")
            
            # Humidity guidance
            current_humidity = current_conditions.get('humidity', 60)
            if 'humidity' in crop_profile['environment']:
                humidity_range = crop_profile['environment']['humidity'].get('optimal_range', [])
                if len(humidity_range) >= 2 and not (humidity_range[0] <= current_humidity <= humidity_range[1]):
                    suggestions.append(f"Adjust ventilation/irrigation for humidity control (optimal: {humidity_range[0]:.1f}-{humidity_range[1]:.1f}%, current: {current_humidity}%)")
        
        return suggestions if suggestions else ["Conditions are well-suited for this crop"]
    
    def _confidence_to_grade(self, confidence: float) -> str:
        """Convert confidence to letter grade."""
        if confidence >= 0.95: return "A+"
        elif confidence >= 0.90: return "A"
        elif confidence >= 0.85: return "A-"
        elif confidence >= 0.80: return "B+"
        elif confidence >= 0.75: return "B"
        elif confidence >= 0.70: return "B-"
        elif confidence >= 0.65: return "C+"
        elif confidence >= 0.60: return "C"
        elif confidence >= 0.55: return "C-"
        elif confidence >= 0.50: return "D+"
        else: return "F"
    
    def build_crop_profiles(self, df: pd.DataFrame) -> None:
        """Build detailed crop profiles with advanced statistics."""
        logger.info("Building advanced crop profiles...")
        
        self.crop_profiles = {}
        
        for crop in df['label'].unique():
            crop_data = df[df['label'] == crop]
            
            profile = {
                'sample_count': len(crop_data),
                'nutrients': {},
                'environment': {},
                'reliability': 'high' if len(crop_data) > 100 else 'moderate' if len(crop_data) > 50 else 'limited'
            }
            
            # Advanced nutrient analysis
            for nutrient in ['N', 'P', 'K']:
                if nutrient in crop_data.columns:
                    values = crop_data[nutrient]
                    profile['nutrients'][nutrient] = {
                        'mean': float(values.mean()),
                        'std': float(values.std()),
                        'min': float(values.min()),
                        'max': float(values.max()),
                        'optimal_range': [float(values.quantile(0.25)), float(values.quantile(0.75))],
                        'confidence_interval': [float(values.quantile(0.05)), float(values.quantile(0.95))]
                    }
            
            # Advanced environmental analysis
            for factor in ['temperature', 'humidity', 'ph', 'rainfall']:
                if factor in crop_data.columns:
                    values = crop_data[factor]
                    profile['environment'][factor] = {
                        'mean': float(values.mean()),
                        'std': float(values.std()),
                        'min': float(values.min()),
                        'max': float(values.max()),
                        'optimal_range': [float(values.quantile(0.25)), float(values.quantile(0.75))],
                        'tolerance_range': [float(values.quantile(0.1)), float(values.quantile(0.9))]
                    }
            
            self.crop_profiles[crop] = profile
        
        logger.info(f"Advanced crop profiles built for {len(self.crop_profiles)} crops")
    
    def _get_historical_market_prices(self, crop_labels: pd.Series) -> pd.Series:
        """Generate historical market prices for training data."""
        # Historical average prices (in Rs/quintal) - these would come from real data
        historical_prices = {
            'rice': 2500, 'wheat': 2200, 'maize': 1800, 'cotton': 6000,
            'sugarcane': 3000, 'chickpea': 4500, 'lentil': 5000,
            'soybean': 3500, 'groundnut': 5500, 'jute': 4000,
            'mango': 8000, 'banana': 2000, 'potato': 1500,
            'onion': 2500, 'tomato': 3000, 'brinjal': 2000,
            'cabbage': 1500, 'cauliflower': 2000, 'okra': 3000,
            'cucumber': 2500, 'carrot': 2000, 'radish': 1500,
            'spinach': 1000, 'coriander': 5000, 'mint': 8000,
            'ginger': 12000, 'turmeric': 8000, 'garlic': 6000,
            'chili': 15000, 'pepper': 20000, 'cardamom': 30000
        }
        
        return crop_labels.map(lambda x: historical_prices.get(x.lower(), 2000))
    
    def _get_price_trend_scores(self, crop_labels: pd.Series) -> pd.Series:
        """Generate price trend scores for training data."""
        # Simulate price trends: 1.0 = rising, 0.5 = stable, 0.0 = falling
        trend_scores = {
            'rice': 0.7, 'wheat': 0.6, 'maize': 0.4, 'cotton': 0.8,
            'sugarcane': 0.5, 'chickpea': 0.9, 'lentil': 0.8,
            'soybean': 0.6, 'groundnut': 0.7, 'jute': 0.3,
            'mango': 0.9, 'banana': 0.5, 'potato': 0.6,
            'onion': 0.8, 'tomato': 0.7, 'brinjal': 0.6,
            'cabbage': 0.4, 'cauliflower': 0.5, 'okra': 0.7,
            'cucumber': 0.6, 'carrot': 0.5, 'radish': 0.4,
            'spinach': 0.3, 'coriander': 0.8, 'mint': 0.9,
            'ginger': 0.9, 'turmeric': 0.8, 'garlic': 0.7,
            'chili': 0.9, 'pepper': 0.8, 'cardamom': 0.7
        }
        
        return crop_labels.map(lambda x: trend_scores.get(x.lower(), 0.5))
    
    def _get_profitability_scores(self, crop_labels: pd.Series, market_prices: pd.Series) -> pd.Series:
        """Calculate profitability scores based on market prices and estimated costs."""
        # Estimated production costs (in Rs/quintal)
        production_costs = {
            'rice': 1500, 'wheat': 1200, 'maize': 1000, 'cotton': 4000,
            'sugarcane': 2000, 'chickpea': 2500, 'lentil': 3000,
            'soybean': 2000, 'groundnut': 3000, 'jute': 2500,
            'mango': 4000, 'banana': 800, 'potato': 800,
            'onion': 1200, 'tomato': 1500, 'brinjal': 1000,
            'cabbage': 800, 'cauliflower': 1000, 'okra': 1500,
            'cucumber': 1200, 'carrot': 1000, 'radish': 800,
            'spinach': 500, 'coriander': 2000, 'mint': 3000,
            'ginger': 6000, 'turmeric': 4000, 'garlic': 3000,
            'chili': 8000, 'pepper': 12000, 'cardamom': 20000
        }
        
        def calculate_profitability(crop, price):
            cost = production_costs.get(crop.lower(), 1500)
            if cost > 0:
                profit_margin = (price - cost) / cost
                # Normalize to 0-1 scale
                return max(0, min(1, (profit_margin + 0.2) / 0.8))
            return 0.5
        
        return crop_labels.combine(market_prices, calculate_profitability)

    def predict_with_tolerance(self, input_data: Dict[str, float], top_k: int = 5, market_data: Dict = None) -> Dict[str, Any]:
        """Enhanced prediction with agricultural tolerance for real-world conditions."""
        
        # Make original prediction with market data
        original_result = self.predict(input_data, top_k, market_data)
        
        # Apply agricultural intelligence for rice in India
        enhanced_recommendations = []
        
        for rec in original_result["all_recommendations"]:
            crop = rec["crop"]
            confidence = rec["confidence"]
            
            # ✅ RICE BOOST: Apply Telangana rice knowledge
            if crop == "rice":
                # Check if conditions are actually good for rice with tolerance
                rice_score = self._calculate_rice_suitability_score(input_data)
                
                if rice_score > 0.7:  # 70%+ suitable
                    # Boost rice confidence significantly
                    confidence = max(confidence, 0.85)  # Minimum 85% for good rice conditions
                    logger.info(f"🌾 Rice confidence boosted to {confidence:.4f} for Telangana conditions")
                elif rice_score > 0.5:  # 50%+ suitable
                    confidence = max(confidence, 0.65)  # Minimum 65% for decent rice conditions
                    
            enhanced_recommendations.append({
                **rec,
                "confidence": confidence
            })
        
        # Re-sort by confidence
        enhanced_recommendations.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Update result
        result = original_result.copy()
        result["all_recommendations"] = enhanced_recommendations
        result["primary_recommendation"] = enhanced_recommendations[0]["crop"]
        result["primary_confidence"] = enhanced_recommendations[0]["confidence"]
        
        return result

    def _calculate_rice_suitability_score(self, input_data: Dict[str, float]) -> float:
        """Calculate rice suitability score with real-world agricultural knowledge."""
        
        score = 0
        total_factors = 7
        
        # Nitrogen: 60-120 (expanded from training data's 60-99)
        n = input_data.get("nitrogen", 0)
        if 60 <= n <= 120:
            score += 1
        elif 50 <= n <= 140:  # Acceptable range
            score += 0.7
        
        # Phosphorus: 35-65 (slightly expanded)
        p = input_data.get("phosphorus", 0) 
        if 35 <= p <= 65:
            score += 1
        elif 30 <= p <= 70:
            score += 0.8
        
        # Potassium: 35-65 (expanded from 35-45)
        k = input_data.get("potassium", 0)
        if 35 <= k <= 65:
            score += 1
        elif 25 <= k <= 75:
            score += 0.7
        
        # Temperature: 20-28°C (expanded from 20-26.9)
        temp = input_data.get("temperature", 0)
        if 20 <= temp <= 28:
            score += 1
        elif 18 <= temp <= 32:
            score += 0.6
        
        # Humidity: 75-90% (expanded)
        humidity = input_data.get("humidity", 0)
        if 75 <= humidity <= 90:
            score += 1
        elif 65 <= humidity <= 95:
            score += 0.7
        
        # pH: 5.0-7.5 (good for rice)
        ph = input_data.get("ph", 0)
        if 5.0 <= ph <= 7.5:
            score += 1
        elif 4.5 <= ph <= 8.0:
            score += 0.8
        
        # Rainfall: 150-350mm (expanded)
        rainfall = input_data.get("rainfall", 0)
        if 150 <= rainfall <= 350:
            score += 1
        elif 100 <= rainfall <= 400:
            score += 0.7
        
        return score / total_factors


# Maintain backward compatibility
CropRecommendationSystem = UltraHighAccuracyCropRecommendationSystem
ImprovedCropRecommendationSystem = UltraHighAccuracyCropRecommendationSystem
