# 🛡️ PhishShield — Plataforma Integral de Detección de Phishing e Inteligencia de Amenazas

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.10+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-Chromium_Sandbox-40b5a4?style=for-the-badge&logo=puppeteer&logoColor=white)](https://pptr.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**PhishShield** es una solución avanzada de ciberseguridad diseñada para proteger a organizaciones, PYMEs y colaboradores frente a ataques de ingeniería social, suplantación de identidad (*typosquatting* y homógrafos), robo de credenciales y enlaces maliciosos. 

Combina un **pipeline multicapa de 19 validaciones técnicas**, modelos de **Machine Learning probabilísticos**, **inspección profunda de certificados SSL/TLS y árboles DOM**, **emulación en sandbox local** y un **Asistente Educativo con IA Generativa** para capacitar a los usuarios en tiempo real.

---

## 🌟 Arquitectura y Capacidades Principales

```
                  ┌─────────────────────────────────────────────────────────────┐
                  │                 PhishShield Client Interface                │
                  │   (HTML5 + CSS3 Animations + Generative UI + Dark Mode)     │
                  └──────────────────────────────┬──────────────────────────────┘
                                                 │ HTTP / REST API
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                            Node.js / Express Core Backend (:3001)                            │
│                                                                                              │
│   ┌───────────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────┐   │
│   │    URL & Lexical Parser   │   │   Typosquatting & IDN     │   │   Risk Calculator    │   │
│   │   (IP, HTTP, Subdomains)  │   │  (Levenshtein / Unicode)  │   │ (Dynamic Multi-Tier) │   │
│   └─────────────┬─────────────┘   └─────────────┬─────────────┘   └──────────┬───────────┘   │
│                 │                               │                            │               │
│   ┌─────────────┴─────────────┐   ┌─────────────┴─────────────┐   ┌──────────┴───────────┐   │
│   │   Native TLS / SSL Audit  │   │   DOM & Form Inspector    │   │  Generative AI / LLM │   │
│   │  (Age, Trust Chain, SAN)  │   │   (Puppeteer Headless)    │   │ (Explanation & Quiz) │   │
│   └───────────────────────────┘   └───────────────────────────┘   └──────────────────────┘   │
└──────────────────────┬──────────────────────────┬────────────────────────────┬───────────────┘
                       │                          │                            │
        ┌──────────────▼─────────────┐   ┌────────▼─────────────┐   ┌──────────▼───────────────┐
        │  Python FastAPI ML (:8000) │   │  Threat Feeds APIs   │   │  Local Persistence / SOC │
        │ (Random Forest / TF-IDF)   │   │ (VirusTotal / GSB)   │   │  (Audit History / JSON)  │
        └────────────────────────────┘   └──────────────────────┘   └──────────────────────────┘
```

---

### 🔍 1. Pipeline de Detección Multicapa (19 Reglas Heurísticas y Forenses)
* **Heurística Léxica y Estructural:** Detección de IPs directas, protocolo HTTP no seguro, parámetros sensibles en texto plano (`password`, `token`), ofuscación de subdominios y patrones sospechosos (`-login`, `-secure`).
* **Detección de Typosquatting (Levenshtein):** Análisis de distancia de edición para detectar sustituciones fonéticas o visuales de marcas protegidas (ej. `bancolornbia.com` frente a `bancolombia.com`).
* **Detección de Ataques de Homógrafos (Unicode / Punycode):** Identificación de caracteres cirílicos o griegos que engañan visualmente al usuario (ej. `bаncolombia.com` con `а` cirílica `U+0430`).

---

### 🔒 2. Inspección Profunda de Certificados SSL/TLS (`sslInspector.js`)
* **Auditoría Nativa TLS:** Conexión segura con SNI para extraer la entidad emisora (DigiCert, Google Trust Services, GlobalSign, Let's Encrypt).
* **Detección de Certificados no Confiables:** Detección automática de errores en la cadena de confianza o certificados autofirmados (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`).
* **Análisis de Antigüedad Forense:** Alerta si el certificado fue emitido hace **menos de 72 horas** (técnica frecuente en campañas de phishing activas) o bonificación de confianza si el certificado supera los 90 días con emisor reconocido.

---

### 🕵️ 3. Auditoría de DOM y Formularios Sensibles (`domInspector.js`)
* **Detección de Trampas de Credenciales:** Detecta campos `<input type="password">` en dominios no autorizados (+5 pts).
* **Detección de Captura Financiera:** Identifica campos de tarjetas bancarias, números CVV/CVC y fechas de vencimiento (+6 pts).
* **Suplantación de Título (`<title>`):** Alerta cuando el título HTML dice *"Bancolombia"*, *"Outlook"*, *"PayPal"*, etc., pero el dominio es falso.
* **Score Floor Automático:** Asigna automáticamente **Riesgo Alto ($\ge 7/10$)** ante cualquier intento de captura de credenciales o datos financieros.

---

### 🤖 4. Asistente Educativo con IA Generativa y Micro-Quizzes (`aiExplanationService.js`)
* **Traducción en Lenguaje Natural:** Transforma los hallazgos técnicos en explicaciones claras y comprensibles para cualquier colaborador corporativo.
* **Acción de Mitigación Inmediata:** Recomendaciones paso a paso ante cada nivel de amenaza.
* **Micro-Quiz Interactivo de 30 Segundos:** Genera una trivia dinámica de opción múltiple contextualizada al ataque detectado con retroalimentación instantánea (verde/rojo) para fijar el aprendizaje.
* **Modo Híbrido:** Motor local enriquecido autónomo (100% offline y sin costo) con soporte nativo para **Google Gemini 1.5 Flash** (`GEMINI_API_KEY`).

---

### 🧠 5. Microservicio de Inteligencia Artificial (Python FastAPI)
* **Microservicio ML:** Modelo de aprendizaje supervisado (TF-IDF + clasificador) que evalúa las características n-gram y estructurales de la URL.
* **Probabilidad de Phishing:** Retorna una métrica continua de 0.0% a 100.0% integrada en la puntuación heurística final.

---

### 🖼️ 6. Emulador de Navegador y Sandbox Seguro (Puppeteer)
* **Capturas Aisladas:** Permite al usuario previsualizar de forma segura la apariencia visual de la página web sin abrirla en su propio navegador ni arriesgar su dispositivo a descargas automáticas (*drive-by downloads*).

---

### 📊 7. Panel de Control Administrativo Tipo SOC (Security Operations Center)
* **Vista Expandida Widescreen:** Diseñado con enfoque de Centro de Operaciones de Ciberseguridad a pantalla completa (`98vw` / `96vh`).
* **KPIs en Tiempo Real:** Métricas de URLs analizadas, amenazas bloqueadas, sitios seguros y reportes de la comunidad.
* **Gráfico Donut Interactivo:** Desglose porcentual de la distribución de riesgo global.
* **Auditoría y Exportación:** Descarga de registros forenses en formato **CSV** y alertas comunitarias en **JSON**.
* **Gestión de Seguridad:** Cambio de credenciales administrativas con validación de contraseña fuerte en tiempo real.

---

## 🛠️ Tecnologías y Stack Técnico

| Componente | Tecnologías Utilizadas |
| :--- | :--- |
| **Backend Principal** | Node.js, Express.js (ESM), TLS Nativo, Axios |
| **Microservicio ML** | Python 3.10+, FastAPI, Uvicorn, Scikit-Learn, Pandas |
| **Motor de Sandbox** | Puppeteer (Chromium Headless) |
| **Frontend** | HTML5, CSS3 Variables, Keyframe Animations, Generative UI, JavaScript Vanilla (ESM) |
| **Inteligencia de Amenazas** | VirusTotal API, Google Safe Browsing API, PhishTank Feed, Google Gemini API |
| **Persistencia** | Sistema de auditoría JSON estructurado con caché en memoria (`cache.json`, `history.json`, `reports.json`) |

---

## 🚀 Instalación y Puesta en Marcha

### 1. Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18 o superior).
* [Python](https://www.python.org/) (versión 3.10 o superior).

---

### 2. Instalación del Backend (Node.js)
Clona el repositorio e instala las dependencias de Node.js:
```bash
git clone https://github.com/Wilcam1/Phishshield-URL.git
cd phishshield1
npm install
```

---

### 3. Configuración del Microservicio de Machine Learning (Python)
Crea y activa el entorno virtual de Python, e instala los requerimientos:
```bash
# En Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn scikit-learn pandas numpy

# En Linux / macOS:
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn scikit-learn pandas numpy
```

---

### 4. Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:

```ini
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Windows12@   # Contraseña administrativa inicial
VIRUSTOTAL_API_KEY=tu_api_key_opcional
GEMINI_API_KEY=tu_gemini_api_key_opcional   # Opcional para IA Generativa
```

---

### 5. Iniciar los Servicios

#### A. Iniciar el Microservicio de Machine Learning:
```bash
# Con el entorno virtual activado:
uvicorn ml_service.main:app --port 8000
# O ejecutando directamente:
.\venv\Scripts\uvicorn.exe ml_service.main:app --port 8000
```

#### B. Iniciar el Servidor Web Principal de PhishShield:
En otra terminal:
```bash
npm run dev
```

La aplicación estará disponible de inmediato en: **[http://localhost:3001](http://localhost:3001)**

---

## 🧪 Ejecución de Pruebas de Integración

PhishShield incluye una suite de pruebas automatizadas para verificar el correcto funcionamiento del pipeline de análisis:

```bash
node test-analysis.js
```

### Casos de Prueba Verificados:
* ✅ **Sitios legítimos:** `bancolombia.com`, `google.com` (Riesgo Bajo / SSL Maduro).
* 🚨 **Typosquatting:** `bancolornbia.com` (Riesgo Alto / Detección Levenshtein + SSL Reciente).
* 🚨 **Suplantación de Marca:** `bancolombia-login-secure.xyz` (Riesgo Alto / Combosquatting).
* 🚨 **Ataque de Homógrafos:** `bаncolombia.com` (Riesgo Alto / Carácter Cirílico Punycode).
* ⚠️ **IP / HTTP Inseguro:** `http://192.168.1.1/login` (Riesgo Medio / Sin Cifrado).

---

## 📁 Estructura del Repositorio

```text
phishshield1/
├── client/                     # Frontend de la plataforma
│   ├── adminManager.js         # Panel SOC, métricas, filtros y exportaciones
│   ├── apiClient.js            # Cliente HTTP REST para comunicación con el backend
│   ├── app.js                  # Orquestador del flujo cliente
│   ├── storage.js              # Almacenamiento local del historial
│   ├── tipsEngine.js           # Motor de consejos de seguridad
│   └── uiManager.js            # Renderizado de UI, Asistente IA, Micro-Quiz y DOM
├── server/                     # Backend Node.js
│   ├── analyzers/              # Algoritmos de análisis heurístico y forense
│   │   ├── domInspector.js     # Inspección de formularios DOM con Puppeteer
│   │   ├── riskCalculator.js   # Motor dinámico de ponderación y score floor
│   │   ├── sslInspector.js     # Auditoría nativa de certificados TLS/SSL
│   │   ├── typosquattingDetector.js # Detección de homógrafos y Levenshtein
│   │   └── urlAnalyzer.js      # Extractor de características léxicas
│   ├── repositories/           # Repositorios de persistencia JSON
│   ├── services/               # Clientes externos e IA generativa
│   │   ├── aiExplanationService.js # Explicaciones contextuales y micro-quizzes
│   │   ├── cacheService.js     # Sistema de caché de análisis
│   │   ├── mlService.js        # Conexión con microservicio Python FastAPI
│   │   ├── phishTankService.js # Integración con base de datos PhishTank
│   │   ├── safeBrowsingService.js # Integración con Google Safe Browsing
│   │   └── virusTotalService.js# Integración con VirusTotal API
│   └── app.js                  # Servidor Express principal y orquestador paralelo
├── ml_service/                 # Microservicio de Machine Learning (Python)
│   ├── main.py                 # API FastAPI de inferencia
│   └── model/                  # Pesos y vectorizador del modelo entrenado
├── index.html                  # Interfaz de usuario interactiva
├── styles.css                  # Sistema de diseño, animaciones y soporte responsivo
├── test-analysis.js            # Suite de pruebas automatizadas
├── server.js                   # Punto de arranque
└── package.json                # Dependencias y scripts
```

---

## 🛡️ Descargo de Responsabilidad
Este software ha sido diseñado con fines de protección corporativa, análisis forense y concienciación en ciberseguridad. Las validaciones heurísticas y modelos de aprendizaje automático representan una sólida capa defensiva complementaria a los sistemas de seguridad de punto final (*EDR*) y pasarelas de correo seguro (*SEG*).
