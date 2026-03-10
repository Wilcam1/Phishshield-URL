import axios from 'axios';

class SafeBrowsingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY || null;
    this.apiUrl = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

    if (this.apiKey) {
      console.log('✅ Google Safe Browsing: usando API real');
    } else {
      console.log('⚠️ Google Safe Browsing: sin API key, usando lista local (define GOOGLE_SAFE_BROWSING_API_KEY en .env)');
    }

    // Lista local de respaldo (cuando no hay API key)
    this.urlsPeligrosasLocales = [
      'secure-bancolombia-login.com',
      'envios-gratis-temu.com',
      'free-bitcoin-offer.net',
      'bancolombia-secure.com',
      'davivienda-online.net'
    ];
  }

  async verificar(url) {
    if (this.apiKey) {
      return await this._verificarConAPI(url);
    }
    return this._verificarLocal(url);
  }

  async _verificarConAPI(url) {
    try {
      console.log('🌍 Consultando Google Safe Browsing API...');

      const body = {
        client: { clientId: 'phishshield', clientVersion: '2.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      };

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        body,
        { timeout: 5000 }
      );

      if (response.data && response.data.matches && response.data.matches.length > 0) {
        console.log('🚨 Safe Browsing: URL peligrosa detectada');
        return 'safebrowsing_alert';
      }

      return 'safebrowsing_clean';
    } catch (error) {
      console.log('⚠️ Google Safe Browsing API no disponible:', error.message);
      return null;
    }
  }

  _verificarLocal(url) {
    const esPeligrosa = this.urlsPeligrosasLocales.some(peligrosa =>
      url.toLowerCase().includes(peligrosa.toLowerCase())
    );

    return esPeligrosa ? 'safebrowsing_alert' : 'safebrowsing_clean';
  }
}

export default SafeBrowsingService;