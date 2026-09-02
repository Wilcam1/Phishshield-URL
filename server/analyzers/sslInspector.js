import tls from 'tls';
import { URL } from 'url';

class SslInspector {
  /**
   * Inspecciona el certificado SSL/TLS de una URL
   * @param {string} urlString 
   * @returns {Promise<Object>}
   */
  async inspeccionar(urlString) {
    let hostname;
    let protocol;
    try {
      const urlObj = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      hostname = urlObj.hostname;
      protocol = urlObj.protocol;
    } catch {
      return { analizado: false, error: 'URL inválida' };
    }

    if (protocol === 'http:') {
      return {
        analizado: true,
        tieneSsl: false,
        indicadores: ['🔓 Sitio web sin cifrado SSL/TLS (utiliza protocolo HTTP inseguro)'],
        factores: []
      };
    }

    // Omitir inspección TLS si es una IP directa
    const esIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (esIP) {
      return {
        analizado: true,
        tieneSsl: false,
        esIP: true,
        indicadores: ['🌐 El destino es una dirección IP directa'],
        factores: []
      };
    }

    return new Promise((resolve) => {
      const options = {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false, // Permitir capturar certificados inválidos/autofirmados para inspección
        timeout: 4000
      };

      const socket = tls.connect(options, () => {
        try {
          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const authError = socket.authorizationError;

          socket.destroy();

          if (!cert || Object.keys(cert).length === 0) {
            return resolve({
              analizado: true,
              tieneSsl: false,
              indicadores: ['⚠️ No se pudo obtener el certificado SSL del servidor'],
              factores: []
            });
          }

          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          const now = new Date();

          const diasActivo = Math.floor((now - validFrom) / (1000 * 60 * 60 * 24));
          const diasRestantes = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

          const emisor = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Desconocido') : 'Desconocido';
          const sujeto = cert.subject ? (cert.subject.CN || cert.subject.O || hostname) : hostname;

          const esAutofirmado = cert.issuer && cert.subject && (cert.issuer.CN === cert.subject.CN || cert.issuer.O === cert.subject.O);
          const esReciente = diasActivo <= 3 && diasActivo >= 0;
          const estaExpirado = diasRestantes < 0;

          const indicadores = [];
          const factores = [];

          // 1. Validar si es autofirmado o no autorizado
          if (!authorized && authError) {
            indicadores.push(`🔒 Certificado SSL no confiable o autofirmado (${authError})`);
            factores.push('Certificado SSL no confiable/autofirmado (+5)');
          } else if (esAutofirmado) {
            indicadores.push('🔒 Certificado SSL autofirmado (sin entidad emisora de confianza)');
            factores.push('Certificado SSL autofirmado (+4)');
          }

          // 2. Validar expiración
          if (estaExpirado) {
            indicadores.push(`⚠️ Certificado SSL expirado hace ${Math.abs(diasRestantes)} días`);
            factores.push('Certificado SSL expirado (+3)');
          }

          // 3. Validar si es sospechosamente nuevo (< 72 horas)
          if (esReciente) {
            indicadores.push(`📅 Certificado SSL muy reciente (emitido hace ${diasActivo === 0 ? 'menos de 24 horas' : diasActivo + ' días'}) - Técnica frecuente en campañas de phishing activas`);
            factores.push('Certificado SSL recién emitido (< 72h) (+3)');
          } else if (diasActivo > 90 && authorized) {
            factores.push('Certificado SSL maduro y confiable (-1)');
          }

          resolve({
            analizado: true,
            tieneSsl: true,
            autorizado: authorized,
            emisor: emisor,
            sujeto: sujeto,
            validoDesde: validFrom.toISOString(),
            validoHasta: validTo.toISOString(),
            diasActivo: diasActivo,
            diasRestantes: diasRestantes,
            esReciente: esReciente,
            esAutofirmado: esAutofirmado,
            estaExpirado: estaExpirado,
            indicadores: indicadores,
            factores: factores
          });

        } catch (err) {
          socket.destroy();
          resolve({
            analizado: true,
            tieneSsl: false,
            error: err.message,
            indicadores: [],
            factores: []
          });
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          analizado: true,
          tieneSsl: false,
          timeout: true,
          indicadores: [],
          factores: []
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({
          analizado: true,
          tieneSsl: false,
          error: err.message,
          indicadores: [],
          factores: []
        });
      });
    });
  }
}

export default SslInspector;
