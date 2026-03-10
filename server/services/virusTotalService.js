import axios from 'axios';

class VirusTotalService {
    constructor() {
        this.apiKey = process.env.VIRUSTOTAL_API_KEY || null;
        this.baseUrl = 'https://www.virustotal.com/api/v3';

        if (this.apiKey) {
            console.log('✅ VirusTotal: API key configurada, usando análisis real');
        } else {
            console.log('⚠️ VirusTotal: sin API key (define VIRUSTOTAL_API_KEY en .env)');
        }
    }

    async verificar(url) {
        if (!this.apiKey) return null;

        try {
            // Paso 1: Enviar URL para análisis
            const urlBase64 = Buffer.from(url).toString('base64url');

            // Intentar obtener reporte existente primero (evita gastar cuota)
            let analisis = await this._obtenerReporte(urlBase64);

            // Si no existe reporte reciente, enviar para análisis nuevo
            if (!analisis) {
                const submitId = await this._submitUrl(url);
                if (!submitId) return null;
                analisis = await this._esperarAnalisis(submitId);
            }

            if (!analisis) return null;

            return this._interpretarResultado(analisis);

        } catch (error) {
            console.log('⚠️ VirusTotal no disponible:', error.message);
            return null;
        }
    }

    async _obtenerReporte(urlBase64) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/urls/${urlBase64}`,
                {
                    headers: { 'x-apikey': this.apiKey },
                    timeout: 8000
                }
            );
            return response.data?.data?.attributes?.last_analysis_stats || null;
        } catch {
            return null; // URL no analizada antes, se enviará nueva
        }
    }

    async _submitUrl(url) {
        try {
            const formData = new URLSearchParams();
            formData.append('url', url);

            const response = await axios.post(
                `${this.baseUrl}/urls`,
                formData.toString(),
                {
                    headers: {
                        'x-apikey': this.apiKey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 8000
                }
            );
            return response.data?.data?.id || null;
        } catch (error) {
            console.log('⚠️ VirusTotal submit error:', error.message);
            return null;
        }
    }

    async _esperarAnalisis(analysisId, intentos = 3) {
        for (let i = 0; i < intentos; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            try {
                const response = await axios.get(
                    `${this.baseUrl}/analyses/${analysisId}`,
                    {
                        headers: { 'x-apikey': this.apiKey },
                        timeout: 8000
                    }
                );
                const status = response.data?.data?.attributes?.status;
                if (status === 'completed') {
                    return response.data?.data?.attributes?.stats || null;
                }
            } catch {
                // Continuar reintentando
            }
        }
        return null;
    }

    _interpretarResultado(stats) {
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const total = (stats.harmless || 0) + malicious + suspicious + (stats.undetected || 0);

        console.log(`🔍 VirusTotal: ${malicious} malicioso, ${suspicious} sospechoso de ${total} motores`);

        if (malicious >= 3) return 'virustotal_malicious';
        if (malicious >= 1 || suspicious >= 3) return 'virustotal_suspicious';
        return 'virustotal_clean';
    }
}

export default VirusTotalService;
