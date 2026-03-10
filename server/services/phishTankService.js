import axios from 'axios';

class PhishTankService {
  async verificar(url) {
    try {
      console.log('🌍 Consultando PhishTank...');
      
      const response = await axios.post(
        'http://checkurl.phishtank.com/checkurl/',
        `url=${encodeURIComponent(url)}&format=json`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'PhishShield/1.0'
          },
          timeout: 10000
        }
      );
      
      console.log('✅ Respuesta PhishTank recibida');
      
      if (response.data && response.data.results) {
        if (response.data.results.in_database) {
          return 'phishtank_confirmado';
        } else {
          return 'phishtank_clean';
        }
      }
      
      return null;
    } catch (error) {
      console.log('⚠️ PhishTank no disponible:', error.message);
      return null;
    }
  }
}

export default PhishTankService;