import math
import re
from urllib.parse import urlparse
import tldextract

# Lista de palabras sospechosas que suelen aparecer en URLs de phishing
SUSPICIOUS_WORDS = [
    'login', 'secure', 'bank', 'account', 'webscr', 'ebayisapi', 'signin', 
    'password', 'verify', 'update', 'submit', 'credit', 'card', 'paypal', 
    'auth', 'token', 'admin', 'bancolombia', 'davivienda', 'bbva', 'citi'
]

def calculate_entropy(text: str) -> float:
    """Calcula la entropía de Shannon para medir la aleatoriedad de un texto (dominio)."""
    if not text:
        return 0.0
    
    entropy = 0.0
    length = len(text)
    frequencies = {}
    
    for char in text:
        frequencies[char] = frequencies.get(char, 0) + 1
        
    for count in frequencies.values():
        p = count / length
        entropy -= p * math.log2(p)
        
    return entropy

def extract_features(url: str) -> dict:
    """
    Extrae un diccionario de características numéricas y booleanas a partir de una URL
    para alimentar al modelo de clasificación de Machine Learning.
    Se han limpiado los prefijos 'www.' para evitar sesgos en el entrenamiento.
    """
    # Limpiar y asegurar protocolo
    if not url.startswith(('http://', 'https://')):
        url_with_proto = 'https://' + url
    else:
        url_with_proto = url
        
    try:
        parsed_url = urlparse(url_with_proto)
    except Exception:
        # Fallback si no se puede parsear
        return {}
        
    # Obtener partes del dominio usando tldextract (separa subdominio, dominio y tld)
    extracted = tldextract.extract(url_with_proto)
    domain_full = parsed_url.hostname or ""
    
    # Limpiar el prefijo 'www.' del dominio para evitar sesgos de entrenamiento
    domain_clean = domain_full
    if domain_clean.lower().startswith("www."):
        domain_clean = domain_clean[4:]
        
    # 1. Características de longitud
    url_length = len(url_with_proto)
    domain_length = len(domain_clean)
    path_length = len(parsed_url.path)
    
    # 2. Cantidad de subdominios (ignorando 'www')
    subdomain_parts = [s for s in extracted.subdomain.split('.') if s and s.lower() != 'www']
    subdomains_count = len(subdomain_parts)
    
    # 3. Características de caracteres
    digits_in_domain = sum(1 for char in domain_clean if char.isdigit())
    digits_in_url = sum(1 for char in url_with_proto if char.isdigit())
    
    # Cantidad de caracteres especiales
    hyphens_in_domain = domain_clean.count('-')
    dots_in_domain = domain_clean.count('.')
    special_chars_url = len(re.findall(r'[@\?=\-_&\.]', url_with_proto))
    
    # 4. Entropía de caracteres en el dominio limpio (útil para detectar dominios DGA/aleatorios)
    domain_entropy = calculate_entropy(domain_clean)
    
    # 5. IP en lugar de dominio
    is_ip = 1 if re.match(r'^(?:\d{1,3}\.){3}\d{1,3}$', domain_clean) else 0
    
    # 6. Uso de HTTPS
    is_https = 1 if parsed_url.scheme == 'https' else 0
    
    # 7. Parámetros y consultas
    params_count = len(parsed_url.query.split('&')) if parsed_url.query else 0
    
    # 8. Contiene palabras sospechosas (en toda la URL)
    suspicious_words_count = sum(1 for word in SUSPICIOUS_WORDS if word in url_with_proto.lower())
    
    # TLD no estándar o sospechoso (ej. .xyz, .top, .info, .club)
    tld_sospechoso = 1 if extracted.suffix in ['xyz', 'top', 'info', 'club', 'work', 'gq', 'cf', 'tk', 'ml', 'ga'] else 0

    return {
        "url_length": url_length,
        "domain_length": domain_length,
        "path_length": path_length,
        "subdomains_count": subdomains_count,
        "digits_in_domain": digits_in_domain,
        "digits_in_url": digits_in_url,
        "hyphens_in_domain": hyphens_in_domain,
        "dots_in_domain": dots_in_domain,
        "special_chars_url": special_chars_url,
        "domain_entropy": domain_entropy,
        "is_ip": is_ip,
        "is_https": is_https,
        "params_count": params_count,
        "suspicious_words_count": suspicious_words_count,
        "tld_sospechoso": tld_sospechoso
    }
