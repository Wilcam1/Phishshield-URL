import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib

# Importar el extractor local y el entrenamiento
from extractor import extract_features

app = FastAPI(title="PhishShield ML Service API", version="1.0.0")

# Definir la ruta del modelo
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
clf = None

def load_model():
    global clf
    if os.path.exists(MODEL_PATH):
        try:
            clf = joblib.load(MODEL_PATH)
            print("[INFO] Modelo ML cargado correctamente.")
        except Exception as e:
            print(f"[ERROR] Error cargando el modelo: {e}")
    else:
        print("[WARNING] El modelo no existe en disco. Ejecutando train.py automaticamente para crearlo...")
        from train import train_model
        train_model()
        clf = joblib.load(MODEL_PATH)

@app.on_event("startup")
def startup_event():
    load_model()

class UrlRequest(BaseModel):
    url: str

@app.post("/predict")
def predict_url(payload: UrlRequest):
    global clf
    if clf is None:
        raise HTTPException(status_code=503, detail="Modelo de Machine Learning no cargado o no disponible.")
        
    url = payload.url
    if not url:
        raise HTTPException(status_code=400, detail="Debe proporcionar una URL valida.")
        
    # Extraer caracteristicas
    features = extract_features(url)
    if not features:
        raise HTTPException(status_code=400, detail="No se pudieron extraer las caracteristicas de la URL proporcionada.")
        
    # Convertir a formato DataFrame de 1 fila para scikit-learn
    # Asegurar que el orden de las columnas sea el mismo en el que se entreno
    feature_names = [
        "url_length", "domain_length", "path_length", "subdomains_count",
        "digits_in_domain", "digits_in_url", "hyphens_in_domain", "dots_in_domain",
        "special_chars_url", "domain_entropy", "is_ip", "is_https", 
        "params_count", "suspicious_words_count", "tld_sospechoso"
    ]
    
    row = [features[name] for name in feature_names]
    
    # Hacer prediccion
    try:
        # predict_proba devuelve [probabilidad_clase_0, probabilidad_clase_1]
        probs = clf.predict_proba([row])[0]
        prob_phishing = float(probs[1])
        is_fraud = prob_phishing >= 0.5
        
        return {
            "is_fraud": is_fraud,
            "probability": prob_phishing,
            "features": features
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la prediccion del modelo: {str(e)}")

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": clf is not None
    }
