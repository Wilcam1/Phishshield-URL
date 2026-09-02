import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función auxiliar para calcular distancia de Levenshtein
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          Math.min(
            matrix[i][j - 1] + 1, // inserción
            matrix[i - 1][j] + 1  // eliminación
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Normalización de caracteres visualmente similares (Homógrafos Unicode y Leetspeak)
function mapHomoglyphs(str) {
  const homoglyphMap = {
    // Homógrafos cirílicos/griegos comunes a latinos
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x',
    'і': 'i', 'ѕ': 's', 'ԁ': 'd', 'һ': 'h', 'ј': 'j', 'ԝ': 'w', 'м': 'm',
    'ո': 'n', 'ս': 'u', 'օ': 'o', '𝗀': 'g', '𝖻': 'b', '𝗅': 'l', '𝗌': 's',
    // Leetspeak común
    '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g'
  };
  return str.split('').map(char => homoglyphMap[char] || char).join('');
}

// Obtener el Second-Level Domain (SLD)
function obtenerSLD(hostname) {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];
    
    // Lista común de TLDs dobles de países
    const tldDobles = ['com', 'org', 'net', 'gov', 'edu', 'co', 'nom', 'org', 'gob'];
    if (tldDobles.includes(secondLastPart) && lastPart.length === 2) {
      return parts[parts.length - 3] || parts[0];
    }
    return secondLastPart;
  }
  return hostname;
}

class TyposquattingDetector {
  constructor() {
    this.marcasLegitimas = [
      { sld: 'bancolombia', dominios: ['bancolombia.com', 'bancolombia.com.co', 'bancolombia.com.mx', 'bancolombia.net'] },
      { sld: 'davivienda', dominios: ['davivienda.com', 'davivienda.com.co', 'davivienda.net', 'davivienda.com.mx'] },
      { sld: 'bbva', dominios: ['bbva.com.co', 'bbva.es', 'bbva.com', 'bbva.mx', 'bbva.com.ar'] },
      { sld: 'citibank', dominios: ['citibank.com.co', 'citi.com', 'citibanamex.com', 'citibank.com'] },
      { sld: 'paypal', dominios: ['paypal.com'] },
      { sld: 'netflix', dominios: ['netflix.com'] },
      { sld: 'amazon', dominios: ['amazon.com', 'amazon.es', 'amazon.co', 'amazon.com.co'] },
      { sld: 'google', dominios: ['google.com', 'google.com.co', 'google.es'] },
      { sld: 'facebook', dominios: ['facebook.com'] },
      { sld: 'apple', dominios: ['apple.com'] }
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
    let marcaImitada = null;
    let detectado = false;
    const hostnameLower = hostname.toLowerCase();

    // 1. Identificar si contiene caracteres Unicode sospechosos (Homógrafo IDN / Punycode)
    const esPunycode = hostnameLower.startsWith('xn--');
    const contieneUnicode = /[^\x00-\x7F]/.test(hostnameLower);
    if (esPunycode || contieneUnicode) {
      indicadores.push('🌐 Contiene caracteres Unicode no estándar o formato Punycode (posible ataque de homógrafos/IDN)');
      detectado = true;
    }

    // 2. Extraer y normalizar el SLD
    const sldAnalizado = obtenerSLD(hostnameLower);
    const sldNormalizado = mapHomoglyphs(sldAnalizado);

    // 3. Comparación difusa (Levenshtein) y suplantación exacta de dominio
    for (const marca of this.marcasLegitimas) {
      // Caso A: Uso exacto de la marca en el SLD (ej. bancolombia.xyz o secure-bancolombia.com)
      const contieneMarcaExacta = sldNormalizado.includes(marca.sld);
      
      if (contieneMarcaExacta) {
        marcaImitada = marca.sld;
        // Verificar si es un dominio legítimo registrado por la marca
        const esDominioOficial = marca.dominios.some(dom => {
          return hostnameLower === dom || hostnameLower.endsWith('.' + dom);
        });

        if (!esDominioOficial) {
          detectado = true;
          indicadores.push(`🎯 POSIBLE SUPLANTACIÓN - Utiliza el nombre oficial de "${marca.sld}" en un dominio no autorizado`);
        }
        continue;
      }

      // Caso B: Distancia Levenshtein pequeña (typosquatting, ej. bancolornbia.com, amaz0n.com)
      const distancia = getLevenshteinDistance(sldNormalizado, marca.sld);
      
      // Permitir distancia 1 o 2 para marcas largas, y sólo 1 para marcas cortas (ej. citi, bbva)
      const maxDistanciaPermitida = marca.sld.length > 5 ? 2 : 1;
      
      if (distancia > 0 && distancia <= maxDistanciaPermitida) {
        detectado = true;
        marcaImitada = marca.sld;
        indicadores.push(`🎯 TYPOSQUATTING DETECTADO - El dominio "${sldAnalizado}" es extremadamente similar a la marca legítima "${marca.sld}" (distancia Levenshtein: ${distancia})`);
      }
    }

    // 4. Buscar palabras sospechosas adicionales
    this.caracteresSospechosos.forEach(caracter => {
      if (hostnameLower.includes(caracter)) {
        indicadores.push(`🕵️ Contiene patrón sospechoso: "${caracter}"`);
        if (marcaImitada) {
          detectado = true;
        }
      }
    });

    // 5. Comparar con Blacklist local
    if (this.dominiosSospechosos.some(sospechoso => hostnameLower.includes(sospechoso))) {
      detectado = true;
      indicadores.push('🚨 Dominio en lista negra - Posible phishing confirmado');
    }

    return {
      detectado: detectado,
      bancoImitado: marcaImitada, // Mantenemos nombre por retrocompatibilidad en app.js
      indicadores: indicadores
    };
  }
}

export default TyposquattingDetector;