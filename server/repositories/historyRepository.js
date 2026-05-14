import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HistoryRepository {
    constructor(maxEntries = 100) {
        this.historyFile = path.join(__dirname, '../../history.json');
        this.maxEntries = maxEntries;
        this.historialAnalisis = this._loadHistory();
    }

    _loadHistory() {
        try {
            if (fs.existsSync(this.historyFile)) {
                return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
            }
        } catch (error) {
            console.error('❌ Error cargando historial:', error.message);
        }
        return [];
    }

    _saveHistory() {
        try {
            fs.writeFileSync(this.historyFile, JSON.stringify(this.historialAnalisis, null, 2));
        } catch (error) {
            console.error('❌ Error guardando historial:', error.message);
        }
    }

    guardarAnalisis(analisis) {
        this.historialAnalisis.unshift(analisis);

        if (this.historialAnalisis.length > this.maxEntries) {
            this.historialAnalisis.pop();
        }
        this._saveHistory();
    }

    eliminarAnalisis(url) {
        const initialLength = this.historialAnalisis.length;
        this.historialAnalisis = this.historialAnalisis.filter(a => a.url !== url);
        if (this.historialAnalisis.length !== initialLength) {
            this._saveHistory();
            console.log('🗑️ URL eliminada del historial:', url);
            return true;
        }
        return false;
    }

    obtenerHistorial(limite = 10) {
        return this.historialAnalisis.slice(0, limite);
    }

    obtenerTodoHistorial() {
        return this.historialAnalisis;
    }

    obtenerAnalisisHoy() {
        const hoy = new Date().toDateString();
        return this.historialAnalisis.filter(a =>
            new Date(a.timestamp).toDateString() === hoy
        );
    }

    obtenerDistribucionRiesgo() {
        return {
            alto: this.historialAnalisis.filter(a => a.riesgo === 'alto').length,
            medio: this.historialAnalisis.filter(a => a.riesgo === 'medio').length,
            bajo: this.historialAnalisis.filter(a => a.riesgo === 'bajo').length
        };
    }

    total() {
        return this.historialAnalisis.length;
    }
}

export default HistoryRepository;
