class HistoryRepository {
    constructor(maxEntries = 100) {
        this.historialAnalisis = [];
        this.maxEntries = maxEntries;
    }

    guardarAnalisis(analisis) {
        this.historialAnalisis.unshift(analisis);

        if (this.historialAnalisis.length > this.maxEntries) {
            this.historialAnalisis.pop();
        }
    }

    obtenerHistorial(limite = 10) {
        return this.historialAnalisis.slice(0, limite);
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
