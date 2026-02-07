import joblib
import pandas as pd
import numpy as np
import sys
import json
import time

start_load = time.time()
# Load models
try:
    # Use absolute or relative paths from ai-engine root
    model = joblib.load("models/malaria_model.joblib")
    le_district = joblib.load("models/le_district.joblib")
    le_risk = joblib.load("models/le_risk.joblib")
    print(f"Debug: Model load took {time.time() - start_load:.4f}s", file=sys.stderr)
except Exception as e:
    model = None
    # We print to stderr for errors to keep stdout clean for JSON
    print(f"Error loading models: {e}", file=sys.stderr)

def predict_risk(data):
    if model is None:
        return {"error": "Modèle non chargé"}

    df = pd.DataFrame([data])
    
    # Ensure columns match training order exactly
    features = [
        "age", "gender", "temperature", "spo2", "fever", 
        "fever_duration", "nausea", "fatigue", "mosquito_net",
        "district", "risk_zone_level", "rainfall_index", "is_rainy_season"
    ]
    
    # Select and order
    df = df[features]
    
    # Encode district
    try:
        df["district"] = le_district.transform(df["district"])
    except:
        df["district"] = -1

    # Predict
    probs = model.predict_proba(df)[0]
    prediction = model.predict(df)[0]
    risk_label = le_risk.inverse_transform([prediction])[0]
    
    return {
        "risk_level": risk_label,
        "confidence": float(np.max(probs)),
        "all_probs": {label: float(prob) for label, prob in zip(le_risk.classes_, probs)}
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # CLI Argument usage
        try:
            data = json.loads(sys.argv[1])
            print(json.dumps(predict_risk(data)))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        # Stdin usage (for child_process)
        try:
            input_data = sys.stdin.read()
            if input_data:
                data = json.loads(input_data)
                print(json.dumps(predict_risk(data)))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
