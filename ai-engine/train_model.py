import os
import pandas as pd
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import joblib

# Load .env from the parent directory (express-api/.env)
load_dotenv(dotenv_path="../.env")

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "malaria_triagedb" # Matches the DB in .env URI if specified, or use default

def fetch_data():
    print("⏳ Connexion à MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    collection = db["malariadatasets"]
    
    data = list(collection.find())
    print(f"✅ {len(data)} documents récupérés.")
    return pd.DataFrame(data)

def preprocess_data(df):
    # Select features defined in the seeding script
    features = [
        "age", "gender", "temperature", "spo2", "fever", 
        "fever_duration", "nausea", "fatigue", "mosquito_net",
        "district", "risk_zone_level", "rainfall_index", "is_rainy_season"
    ]
    
    X = df[features].copy()
    y = df["risk_label"]

    # Encode categorical features
    le_district = LabelEncoder()
    X["district"] = le_district.fit_transform(X["district"])
    
    le_risk = LabelEncoder() 
    y = le_risk.fit_transform(y)
    
    # Save encoders for prediction
    joblib.dump(le_district, "models/le_district.joblib")
    joblib.dump(le_risk, "models/le_risk.joblib")
    
    return X, y, le_risk

def train():
    df = fetch_data()
    if df.empty:
        print("❌ Dataset vide. Lancez d'abord seed-ml-data.js")
        return

    X, y, le_risk = preprocess_data(df)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("🚀 Entraînement du modèle XGBoost...")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        objective="multi:softprob",
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluation
    y_pred = model.predict(X_test)
    print("\n📊 Rapport de Performance :")
    print(classification_report(y_test, y_pred, target_names=le_risk.classes_))
    
    # Save model
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/malaria_model.joblib")
    print("✨ Modèle sauvegardé dans models/malaria_model.joblib")

if __name__ == "__main__":
    train()
