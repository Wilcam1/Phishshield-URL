import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TyposquattingDetector {
  constructor() {
    this.legitimoBancos = [
      { nombre: 'bancolombia', dominios: ['bancolombia.com', 'bancolombia.com.co', 'bancolombia.com.mx', 'bancolombia.net'] },
      { nombre: 'davivienda', dominios: ['davivienda.com', 'davivienda.com.co', 'davivienda.net', 'davivienda.com.mx'] },
      { nombre: 'bbva', dominios: ['bbva.com.co', 'bbva.es', 'bbva.com', 'bbva.mx', 'bbva.com.ar'] },
      { nombre: 'citibank', dominios: ['citibank.com.co', 'citi.com', 'citibanamex.com', 'citibank.com'] }
    ];

    this.caracteresSospechosos = ['-login', 'secure-', 'verify-', 'account-', 'online-', 'validation', 'banking', 'auth-', 'access-', 'portal-'];

    // Cargar blacklist desde archivo JSON
    this.dominiosSospechosos = this._cargarBlacklist();
  }

  _cargarBlacklist() {
    try {
      const blacklistPath = path.join(__dirname, '../../blacklist.json');
      const contenido = fs.readFileSync(blacklistPath, 'utf-8');
      const datos = JSON.parse(contenido);
      const dominios = datos.dominios_sospechosos || [];
      console.log(`📋 Blacklist cargada: ${dominios.length} dominios sospechosos`);
      return dominios;
    } catch (error) {
      console.warn('⚠️ No se pudo cargar blacklist.json, usando lista vacía:', error.message);
      return [];
    }
  }

  detectar(hostname) {
    const indicadores = [];
    let bancoImitado = null;
    let detectado = false;

    for (const banco of this.legitimoBancos) {
      if (hostname.toLowerCase().includes(banco.nombre.toLowerCase())) {
        bancoImitado = banco.nombre;

        let esDominioLegitimo = false;
        if (banco.dominios.length > 0) {
          esDominioLegitimo = banco.dominios.some(dominio => {
            return hostname === dominio ||
              hostname.endsWith('.' + dominio) ||
              hostname.includes(dominio.replace('.', '-'));
          });
        }

        if (!esDominioLegitimo) {
          detectado = true;
          indicadores.push(`🎯 POSIBLE SUPLANTACIÓN - Imita al banco "${banco.nombre}" pero no es dominio oficial`);
        }
      }
    }

    this.caracteresSospechosos.forEach(caracter => {
      if (hostname.includes(caracter)) {
        indicadores.push(`🕵️ Contiene patrón sospechoso: "${caracter}"`);
        if (bancoImitado) {
          detectado = true;
        }
      }
    });

    if (this.dominiosSospechosos.some(sospechoso => hostname.includes(sospechoso))) {
      detectado = true;
      indicadores.push('🚨 Dominio en lista negra - Posible phishing confirmado');
    }

    return {
      detectado: detectado,
      bancoImitado: bancoImitado,
      indicadores: indicadores
    };
  }
}

export default TyposquattingDetector;