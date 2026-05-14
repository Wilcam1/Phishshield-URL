import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Importar los módulos refactorizados
import UrlAnalyzer from './analyzers/urlAnalyzer.js';
import TyposquattingDetector from './analyzers/typosquattingDetector.js';
import RiskCalculator from './analyzers/riskCalculator.js';
import PhishTankService from './services/phishTankService.js';
import SafeBrowsingService from './services/safeBrowsingService.js';
import ReportRepository from './repositories/reportRepository.js';
import HistoryRepository from './repositories/historyRepository.js';
import VirusTotalService from './services/virusTotalService.js';
import AnalysisCache from './services/cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PhishShieldServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    // Inyectar dependencias
    this.urlAnalyzer = new UrlAnalyzer();
    this.typosquattingDetector = new TyposquattingDetector();
    this.riskCalculator = new RiskCalculator();
    this.phishTankService = new PhishTankService();
    this.safeBrowsingService = new SafeBrowsingService();
    this.virusTotalService = new VirusTotalService();
    this.reportRepository = new ReportRepository();
    this.historyRepository = new HistoryRepository();
    this.cache = new AnalysisCache();

    // Sesiones de admin
    this.activeTokens = new Set();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupAdminRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../')));
  }

  setupRoutes() {
    this.app.post('/analizar', (req, res) => this.analyzeUrl(req, res));
    this.app.post('/reportar', (req, res) => this.reportUrl(req, res));
    this.app.get('/estadisticas', (req, res) => this.getStats(req, res));
    this.app.get('/historial', (req, res) => this.getHistory(req, res));
    this.app.get('/health', (req, res) => this.healthCheck(req, res));

    // Ruta para servir el archivo HTML principal
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../index.html'));
    });
  }

  // Middleware de autenticación de admin
  authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const token = authHeader.split(' ')[1];
    if (!this.activeTokens.has(token)) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    next();
  }

  setupAdminRoutes() {
    // Login
    this.app.post('/api/login', (req, res) => {
      const { username, password } = req.body;
      const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
      const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (username === expectedUsername && password === expectedPassword) {
        // Generar un token simple (en un entorno real usar JWT)
        const token = 'admin_token_' + Math.random().toString(36).substr(2);
        this.activeTokens.add(token);
        res.json({ success: true, token });
      } else {
        res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      }
    });

    // Exportar Datos
    this.app.get('/api/admin/export/reportes', (req, res) => this.authenticateAdmin(req, res, () => {
      const reportes = this.reportRepository.obtenerReportes();
      res.json(reportes);
    }));

    this.app.get('/api/admin/export/historial', (req, res) => this.authenticateAdmin(req, res, () => {
      const historial = this.historyRepository.obtenerTodoHistorial();
      res.json(historial);
    }));

    // Eliminar Falsos Positivos
    this.app.delete('/api/admin/reportar', (req, res) => this.authenticateAdmin(req, res, () => {
      const { dominio } = req.body;
      const eliminado = this.reportRepository.eliminarReporte(dominio);
      if (eliminado) {
        this.cache.invalidateByDomain(dominio);
        res.json({ success: true, mensaje: 'Reporte eliminado' });
      } else {
        res.status(404).json({ success: false, error: 'Dominio no encontrado' });
      }
    }));

    this.app.delete('/api/admin/historial', (req, res) => this.authenticateAdmin(req, res, () => {
      const { url } = req.body;
      const eliminado = this.historyRepository.eliminarAnalisis(url);
      if (eliminado) {
        res.json({ success: true, mensaje: 'Análisis eliminado' });
      } else {
        res.status(404).json({ success: false, error: 'URL no encontrada' });
      }
    }));

    // Cambiar contraseña
    this.app.post('/api/admin/change-password', (req, res) => this.authenticateAdmin(req, res, () => {
      const { oldPassword, newPassword } = req.body;
      const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (oldPassword !== expectedPassword) {
        return res.status(401).json({ success: false, error: 'Contraseña actual incorrecta' });
      }

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' });
      }

      const hasUpper = /[A-Z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

      if (!hasUpper || !hasNumber || !hasSpecial) {
        return res.status(400).json({ success: false, error: 'La nueva contraseña debe contener al menos una mayúscula, un número y un carácter especial.' });
      }

      try {
        const envPath = path.join(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          // Replace exactly the value assigned to ADMIN_PASSWORD
          envContent = envContent.replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${newPassword}`);
          // If for some reason it wasn't there
          if (!envContent.includes(`ADMIN_PASSWORD=${newPassword}`)) {
            envContent += `\nADMIN_PASSWORD=${newPassword}`;
          }
          fs.writeFileSync(envPath, envContent);
        } else {
          fs.writeFileSync(envPath, `ADMIN_PASSWORD=${newPassword}`);
        }

        // Update it in memory, too
        process.env.ADMIN_PASSWORD = newPassword;
        res.json({ success: true, mensaje: 'Contraseña actualizada' });
      } catch (err) {
        res.status(500).json({ success: false, error: 'No se pudo guardar la nueva contraseña' });
      }
    }));
  }

  async analyzeUrl(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL requerida' });
      }

      // Intentar obtener de caché primero
      const cacheHit = this.cache.get(url);
      if (cacheHit) {
        console.log('⚡ Respondiendo desde caché para:', url);
        return res.json(cacheHit);
      }

      console.log('🔍 Analizando URL:', url);

      // 1. Análisis técnico
      const caracteristicas = this.urlAnalyzer.analyze(url);

      // 2. Detección de typosquatting
      const typosquatting = this.typosquattingDetector.detectar(caracteristicas.dominio);

      // 3. Verificaciones externas en paralelo (PhishTank + Safe Browsing + VirusTotal)
      const verificacionesExternas = [];

      // Validar si el dominio ya fue reportado manualmente por un usuario
      const reportes = this.reportRepository.obtenerReportes();
      if (reportes.includes(caracteristicas.dominio)) {
        verificacionesExternas.push('reportado_manualmente');
      }

      const [phishTankRes, safeBrowsingRes, virusTotalRes] = await Promise.allSettled([
        this.phishTankService.verificar(url),
        this.safeBrowsingService.verificar(url),
        this.virusTotalService.verificar(url)
      ]);

      if (phishTankRes.status === 'fulfilled' && phishTankRes.value) {
        verificacionesExternas.push(phishTankRes.value);
      }
      if (safeBrowsingRes.status === 'fulfilled' && safeBrowsingRes.value) {
        verificacionesExternas.push(safeBrowsingRes.value);
      }
      if (virusTotalRes.status === 'fulfilled' && virusTotalRes.value) {
        verificacionesExternas.push(virusTotalRes.value);
      }

      // 4. Reunir indicadores
      const indicadores = [
        ...typosquatting.indicadores,
        ...this.getTechnicalIndicators(caracteristicas)
      ];

      // 5. Calcular riesgo
      const { puntuacion, factores } = this.riskCalculator.calcular(
        indicadores,
        caracteristicas,
        verificacionesExternas
      );

      const riesgo = this.riskCalculator.determinarRiesgo(puntuacion);

      const resultado = {
        url,
        riesgo,
        indicadores,
        puntuacion,
        caracteristicas_tecnicas: caracteristicas,
        factores_puntuacion: factores,
        timestamp: new Date().toISOString()
      };

      // Guardar en historial
      this.historyRepository.guardarAnalisis(resultado);

      // Guardar en caché
      this.cache.set(url, resultado);

      console.log('✅ Análisis completado - Riesgo:', riesgo, 'Puntuación:', puntuacion);
      res.json(resultado);

    } catch (error) {
      console.error('❌ Error analizando URL:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        detalles: error.message
      });
    }
  }

  getTechnicalIndicators(caracteristicas) {
    const indicadores = [];

    if (caracteristicas.esIP) {
      indicadores.push('🌐 Usa dirección IP en lugar de dominio legítimo');
    }

    if (!caracteristicas.esHTTPS) {
      indicadores.push('🔓 Usa HTTP inseguro en lugar de HTTPS');
    }

    if (caracteristicas.parametrosSensibles.length > 0) {
      indicadores.push(`⚡ Contiene parámetros sensibles: ${caracteristicas.parametrosSensibles.join(', ')}`);
    }

    if (caracteristicas.tieneGuionesMultiples) {
      indicadores.push('🕵️ Múltiples guiones en dominio (técnica común en phishing)');
    }

    if (caracteristicas.subdominios > 2) {
      indicadores.push('🔗 Muchos subdominios (posible ofuscación)');
    }

    if (caracteristicas.longitudTotal > 100) {
      indicadores.push('📏 URL excesivamente larga (posible ofuscación)');
    }

    return indicadores;
  }

  reportUrl(req, res) {
    const { url } = req.body;

    try {
      this.reportRepository.guardarReporte(url);
      this.cache.invalidate(url);

      res.json({
        success: true,
        mensaje: '✅ URL reportada correctamente',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'URL inválida',
        detalles: error.message
      });
    }
  }

  getStats(req, res) {
    const estadisticas = {
      total_analisis: this.historyRepository.total(),
      reportes_phishing: this.reportRepository.totalReportes(),
      analisis_hoy: this.historyRepository.obtenerAnalisisHoy().length,
      distribucion_riesgo: this.historyRepository.obtenerDistribucionRiesgo(),
      ultima_actualizacion: new Date().toISOString()
    };
    res.json(estadisticas);
  }

  getHistory(req, res) {
    const { limite = 10 } = req.query;
    const historial = this.historyRepository.obtenerHistorial(parseInt(limite));
    res.json(historial);
  }

  healthCheck(req, res) {
    res.json({
      status: 'ok',
      servicio: 'PhishShield API',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Servidor PhishShield ejecutándose en http://localhost:${this.port}`);
      console.log(`📊 Endpoints disponibles:`);
      console.log(`   POST /analizar - Analizar URL`);
      console.log(`   POST /reportar - Reportar phishing`);
      console.log(`   GET  /estadisticas - Ver estadísticas`);
      console.log(`   GET  /health - Estado del servidor`);
    });
  }
}

export default PhishShieldServer;