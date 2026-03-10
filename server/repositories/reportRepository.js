class ReportRepository {
  constructor() {
    this.reportesPhishing = new Set();
  }

  guardarReporte(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const dominio = urlObj.hostname;
      this.reportesPhishing.add(dominio);

      console.log('📋 URL reportada como phishing:', dominio);
      return true;
    } catch (error) {
      console.error('❌ Error guardando reporte:', error);
      throw error;
    }
  }

  obtenerReportes() {
    return [...this.reportesPhishing];
  }

  totalReportes() {
    return this.reportesPhishing.size;
  }
}

export default ReportRepository;