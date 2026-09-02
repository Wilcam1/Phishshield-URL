import os
import random
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Importar el extractor local
from extractor import extract_features

# 1. Definir listas de patrones para generar un dataset balanceado y realista (Fallback)
BENIGN_DOMAINS = [
    "google.com", "youtube.com", "facebook.com", "baidu.com", "wikipedia.org",
    "yahoo.com", "amazon.com", "google.co.in", "twitter.com", "live.com",
    "instagram.com", "netflix.com", "microsoft.com", "github.com", "reddit.com",
    "bancolombia.com", "davivienda.com", "bbva.com.co", "citibank.com", "bancodebogota.com",
    "apple.com", "zoom.us", "linkedin.com", "stackoverflow.com", "medium.com",
    "spotify.com", "adobe.com", "dropbox.com", "slack.com", "trello.com"
]

BENIGN_PATHS = [
    "", "/about", "/contact", "/search?q=query", "/product/123", "/blog/post-title",
    "/settings/profile", "/docs/api", "/feed", "/play/watch", "/download/latest"
]

PHISHING_BRANDS = ["bancolombia", "davivienda", "bbva", "citibank", "paypal", "netflix", "amazon", "google", "facebook", "apple"]
PHISHING_KEYWORDS = ["secure", "login", "verify", "update", "account", "billing", "signin", "auth", "validation", "portal", "access"]
PHISHING_TLDS = ["xyz", "top", "info", "club", "work", "tk", "ml", "cf", "gq", "ga", "xyz"]

def generate_synthetic_dataset(size=1500):
    """Genera un dataset balanceado de URLs legítimas y de phishing."""
    data = []
    
    # Generar URLs legítimas (Clase 0)
    for _ in range(size // 2):
        domain = random.choice(BENIGN_DOMAINS)
        path = random.choice(BENIGN_PATHS)
        # 95% de las legítimas usan HTTPS
        proto = "https://" if random.random() < 0.95 else "http://"
        
        # Mezclar con y sin 'www.' para que el modelo sea robusto
        if random.random() < 0.5:
            url = f"{proto}www.{domain}{path}"
        else:
            url = f"{proto}{domain}{path}"
        data.append((url, 0))
        
    # Generar URLs de Phishing (Clase 1)
    for _ in range(size // 2):
        proto = "http://" if random.random() < 0.6 else "https://" # Más phishing en HTTP
        
        # Tipo 1: Typosquatting/Combosquatting de marcas
        if random.random() < 0.5:
            brand = random.choice(PHISHING_BRANDS)
            keyword = random.choice(PHISHING_KEYWORDS)
            tld = random.choice(PHISHING_TLDS)
            
            # Patrones comunes
            pattern = random.choice([
                f"{brand}-{keyword}.{tld}",
                f"{keyword}-{brand}.{tld}",
                f"login-{brand}-secure.{tld}",
                f"{brand}.com-{keyword}.net",
                f"www.{brand}-{keyword}.com",
            ])
            path = random.choice(["", "/login", "/verify-identity", "/update-billing"])
            url = f"{proto}{pattern}{path}"
        # Tipo 2: IPs o subdominios largos ocultos
        elif random.random() < 0.3:
            brand = random.choice(PHISHING_BRANDS)
            keyword = random.choice(PHISHING_KEYWORDS)
            # IP ficticia o subdominios muy largos
            if random.random() < 0.5:
                ip = f"{random.randint(100, 220)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
                url = f"{proto}{ip}/login.php?user=admin"
            else:
                long_sub = f"login.secure.verification-{brand}.co.za"
                url = f"{proto}{long_sub}/index.php"
        # Tipo 3: URLs con parámetros sospechosos expuestos
        else:
            domain = random.choice(BENIGN_DOMAINS)
            # Dominios comprometidos o simulados con rutas muy largas
            bad_path = f"/wp-content/plugins/{random.choice(PHISHING_BRANDS)}/login.php?email=user@domain.com&session=active"
            url = f"{proto}{domain}{bad_path}"
            
        data.append((url, 1))
        
    return data

def train_model():
    csv_path = os.path.join(os.path.dirname(__file__), "../../PhiUSIIL_Phishing_URL_Dataset.csv")
    
    if os.path.exists(csv_path):
        print(f"[INFO] Archivo CSV detectado en {csv_path}. Entrenando desde dataset real...")
        try:
            df_csv = pd.read_csv(csv_path)
            df_benign_all = df_csv[df_csv['label'] == 1]
            df_phishing_all = df_csv[df_csv['label'] == 0]
            
            sample_size = min(5000, len(df_benign_all), len(df_phishing_all))
            df_benign_sample = df_benign_all.sample(n=sample_size, random_state=42)
            df_phishing_sample = df_phishing_all.sample(n=sample_size, random_state=42)
            
            dataset = []
            for url in df_benign_sample['URL']:
                dataset.append((url, 0))
            for url in df_phishing_sample['URL']:
                dataset.append((url, 1))
                
            random.seed(42)
            random.shuffle(dataset)
        except Exception as e:
            print(f"[ERROR] Error cargando CSV: {e}. Usando generador sintetico...")
            dataset = generate_synthetic_dataset(2000)
    else:
        print("[INFO] No se detecto el archivo CSV. Generando dataset sintetico balanceado...")
        dataset = generate_synthetic_dataset(2000)
        
    print("[INFO] Extrayendo caracteristicas de las URLs...")
    features_list = []
    labels = []
    
    count = 0
    total_to_extract = len(dataset)
    for url, label in dataset:
        features = extract_features(url)
        if features:
            features_list.append(features)
            labels.append(label)
        count += 1
        if count % 1000 == 0:
            print(f"   Progreso: {count}/{total_to_extract} URLs procesadas...")
            
    df = pd.DataFrame(features_list)
    X = df
    y = np.array(labels)
    
    print(f"[INFO] Dataset cargado. Filas: {len(df)}, Caracteristicas: {df.shape[1]}")
    print(f"   Clase 0 (Legitimas): {sum(y == 0)}")
    print(f"   Clase 1 (Phishing): {sum(y == 1)}")
    
    # Dividir entrenamiento y prueba
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("[INFO] Entrenando modelo RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=12)
    clf.fit(X_train, y_train)
    
    # Evaluar modelo
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"[INFO] Exactitud en pruebas: {accuracy:.4f}")
    print("\n[INFO] Reporte de clasificacion:")
    print(classification_report(y_test, y_pred))
    
    # Guardar modelo
    model_path = os.path.join(os.path.dirname(__file__), "model.joblib")
    joblib.dump(clf, model_path)
    print(f"[INFO] Modelo guardado exitosamente en: {model_path}")
    
    # Si existía el CSV, borrarlo
    if os.path.exists(csv_path):
        print(f"[INFO] Eliminando el archivo de datos original {csv_path} para liberar espacio...")
        try:
            os.remove(csv_path)
            print("[SUCCESS] El archivo CSV ha sido eliminado exitosamente.")
        except Exception as e:
            print(f"[WARNING] No se pudo eliminar el archivo CSV automaticamente: {e}")
            
if __name__ == "__main__":
    train_model()
