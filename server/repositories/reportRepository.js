import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportRepository {
  constructor() {
    this.reportFile = path.join(__dirname, '../../reports.json');
    this.reportesPhishing = this._loadReports();
  }

  _loadReports() {
    try {
      if (fs.existsSync(this.reportFile)) {
        const data = JSON.parse(fs.readFileSync(this.reportFile, 'utf8'));
        return new Set(data);
      }
    } catch (error) {
      console.error('❌ Error cargando reportes:', error.message);
    }
    return new Set();
  }

  _saveReports() {
    try {
      fs.writeFileSync(this.reportFile, JSON.stringify([...this.reportesPhishing], null, 2));
    } catch (error) {
      console.error('❌ Error guardando reportes:', error.message);
    }
  }

  guardarReporte(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const dominio = urlObj.hostname;
      this.reportesPhishing.add(dominio);
      this._saveReports();

      console.log('📋 URL reportada como phishing:', dominio);
      return true;
    } catch (error) {
      console.error('❌ Error guardando reporte:', error);
      throw error;
    }
  }

  eliminarReporte(dominio) {
    if (this.reportesPhishing.has(dominio)) {
      this.reportesPhishing.delete(dominio);
      this._saveReports();
      console.log('🗑️ URL eliminada de reportes:', dominio);
      return true;
    }
    return false;
  }

  obtenerReportes() {
    return [...this.reportesPhishing];
  }

  totalReportes() {
    return this.reportesPhishing.size;
  }
}

export default ReportRepository;