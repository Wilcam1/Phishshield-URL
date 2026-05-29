# 🛡️ PhishShield — Sistema de Detección de Phishing para PYMEs

PhishShield es una herramienta educativa y técnica diseñada para ayudar a las Pequeñas y Medianas Empresas (PYMEs) a detectar y analizar enlaces (URLs) sospechosos que puedan ser intentos de phishing o fraudes financieros. Combina análisis heurístico local con servicios externos de reputación para ofrecer un veredicto de riesgo rápido y entendible.

---

## 🚀 Características Principales

### 🔍 Análisis de URLs Multicapa
1. **Heurística Técnica Local:**
   * Detección de uso de direcciones IP en lugar de dominio legítimo.
   * Alertas por el uso de conexiones inseguras (`HTTP` en lugar de `HTTPS`).
   * Detección de parámetros sensibles en la URL (como `password`, `key`, `token`, `session`, etc.).
   * Detección de técnicas de ofuscación, como el uso excesivo de subdominios, guiones consecutivos o URLs extremadamente largas.
2. **Detección de Typosquatting:**
   * Compara los dominios analizados con marcas conocidas y entidades legítimas comunes (bancos, tiendas online) para identificar nombres falsos que buscan engañar al usuario.
3. **Servicios de Reputación de Terceros (en paralelo):**
   * Integración directa con las APIs y bases de datos de **VirusTotal**, **PhishTank** y **Google Safe Browsing** (con respaldo de bases de datos locales).

### 👮 Panel de Control Administrativo (Dashboard)
Panel seguro para los administradores del sistema, que permite:
* **Métricas en Tiempo Real (KPIs):** Visualización del total de análisis, amenazas detectadas, sitios seguros y reportes de la comunidad.
* **Gráfico Dinámico de Distribución:** Un gráfico circular interactivo que desglosa el porcentaje de sitios clasificados según su nivel de riesgo.
* **Gestión de Amenazas y Reportes:**
  * Visualización y exportación en formato **CSV** del historial global de análisis.
  * Gestión y exportación en formato **JSON** de las alertas reportadas por la comunidad.
  * Opción de eliminar reportes o análisis del historial (limpieza de falsos positivos).
* **Seguridad Avanzada:**
  * Cambio de contraseña directo desde la interfaz con requerimientos de complejidad fuerte (mayúscula, minúscula, caracteres especiales y números).

### 🧪 Zona de Pruebas Integrada
Incluye accesos directos interactivos para emular diversos escenarios de navegación:
* **Entornos seguros:** Sitios web genuinos de comercio y banca.
* **Técnicas sospechosas:** Ofuscación de subdominios y guiones adicionales.
* **Malicioso/Peligroso:** Uso de IPs directas y typosquatting explícito.

---

## 🛠️ Tecnologías Utilizadas

* **Backend:** [Node.js](https://nodejs.org/) con [Express.js](https://expressjs.com/)
* **Frontend:** HTML5, CSS3 vanilla (con soporte nativo para **Modo Oscuro**) y JavaScript (ESM) para la interactividad.
* **Base de Datos / Persistencia:** Sistema ligero basado en archivos estructurados JSON localizados en el servidor (`history.json`, `reports.json`, `cache.json`, `blacklist.json`).
* **Seguridad y Monitorización:** Autenticación por token Bearer en APIs administrativas y hashing de contraseñas.

---

## 📦 Instalación y Configuración

### 1. Prerrequisitos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior sugerida).

### 2. Instalación de dependencias
Clona este repositorio o entra al directorio del proyecto y ejecuta en tu terminal:
```bash
npm install
```

### 3. Variables de Entorno (`.env`)
Crea un archivo llamado `.env` en la raíz del proyecto (puedes tomar como base el archivo `.env.example`). Define los siguientes valores:

```ini
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Windows12@   # Contraseña por defecto para el primer inicio de sesión
VIRUSTOTAL_API_KEY=tu_api_key_aqui
```

---

## 🚦 Ejecución del Proyecto

Para iniciar el servidor de desarrollo con recarga automática en caso de cambios (`nodemon`):
```bash
npm run dev
```

El servidor estará disponible en: **[http://localhost:3001](http://localhost:3001)**

---

## 📁 Estructura del Proyecto

```text
├── client/                 # Código JavaScript del lado del cliente (Frontend)
│   ├── adminManager.js     # Lógica de autenticación, dashboard y administración
│   ├── apiClient.js        # Cliente HTTP para consultar el backend
│   ├── app.js              # Controlador principal de la aplicación cliente
│   ├── storage.js          # Manejador del almacenamiento local (historial rápido)
│   ├── tipsEngine.js       # Motor de generación de tarjetas educativas y consejos
│   └── uiManager.js        # Manipulación del DOM y visualización de resultados
├── server/                 # Código del Backend (Node.js)
│   ├── analyzers/          # Algoritmos de análisis heurístico y typosquatting
│   ├── repositories/       # Lectura y escritura de archivos de persistencia JSON
│   ├── services/           # Clientes para APIs externas (VirusTotal, PhishTank, etc.)
│   └── app.js              # Enrutador y middleware principal del servidor Express
├── index.html              # Archivo de interfaz de usuario principal
├── styles.css              # Estilos CSS globales (variables de color, responsivo, modo oscuro)
├── server.js               # Punto de entrada inicial del servidor
├── package.json            # Scripts de ejecución y dependencias de Node.js
└── .env                    # Configuración confidencial del servidor (puerto y API keys)
```

---

## 🛡️ Descargo de Responsabilidad (Educativo)
Este proyecto ha sido desarrollado con fines educativos y de concienciación sobre ciberseguridad. Las reglas heurísticas locales y las APIs de consulta no son 100% infalibles y no reemplazan las herramientas profesionales de seguridad de red ni las políticas oficiales de ciberseguridad bancaria.
