import axios from 'axios';

class MlService {
  constructor() {
    this.serviceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 2000; // 2 segundos max para no retrasar la consulta
  }

  async predecirRiesgo(url) {
    try {
      console.log(`🤖 Consultando servicio ML para: ${url}...`);
      const response = await axios.post(`${this.serviceUrl}/predict`, {
        url: url
      }, {
        timeout: this.timeout
      });

      if (response.data) {
        return {
          isFraud: response.data.is_fraud,
          probability: response.data.probability,
          features: response.data.features
        };
      }
    } catch (error) {
      console.warn('⚠️ No se pudo conectar al microservicio de Machine Learning en Python:', error.message);
      // Retornar null para que el servidor Node.js continúe con heurísticas/VirusTotal sin interrumpir el flujo
      return null;
    }
    return null;
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.serviceUrl}/health`, { timeout: 1000 });
      return response.data;
    } catch (error) {
      return { status: 'offline', details: error.message };
    }
  }
}

export default MlService;
