import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar los módulos refactorizados
import UrlAnalyzer from './analyzers/urlAnalyzer.js';
import TyposquattingDetector from './analyzers/typosquattingDetector.js';
import RiskCalculator from './analyzers/riskCalculator.js';
import PhishTankService from './services/phishTankService.js';
import SafeBrowsingService from './services/safeBrowsingService.js';
import ReportRepository from './repositories/reportRepository.js';
import HistoryRepository from './repositories/historyRepository.js';
import VirusTotalService from './services/virusTotalService.js';

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

    this.setupMiddleware();
    this.setupRoutes();
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

  async analyzeUrl(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL requerida' });
      }

      console.log('🔍 Analizando URL:', url);

      // 1. Análisis técnico
      const caracteristicas = this.urlAnalyzer.analyze(url);

      // 2. Detección de typosquatting
      const typosquatting = this.typosquattingDetector.detectar(caracteristicas.dominio);

      // 3. Verificaciones externas en paralelo (PhishTank + Safe Browsing + VirusTotal)
      const verificacionesExternas = [];

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