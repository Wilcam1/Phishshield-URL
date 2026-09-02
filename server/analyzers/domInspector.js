import puppeteer from 'puppeteer';

class DomInspector {
  constructor() {
    this.marcasConocidas = [
      'bancolombia', 'davivienda', 'bbva', 'banco de bogota', 'banco de occidente',
      'banco popular', 'av villas', 'scotiabank', 'colpatria', 'citibank',
      'nequi', 'daviplata', 'paypal', 'netflix', 'amazon', 'mercado libre',
      'mercadolibre', 'facebook', 'instagram', 'whatsapp', 'google', 'microsoft',
      'outlook', 'office 365', 'apple', 'icloud', 'shein', 'dhl', 'servientrega',
      'interrapidisimo', 'dian'
    ];
  }

  /**
   * Inspecciona el contenido y DOM renderizado de una página
   * @param {string} urlString 
   * @param {string} sldDominio - Second level domain de la URL analizada
   * @param {boolean} esDominioOficial - Si ya fue verificado como oficial
   * @returns {Promise<Object>}
   */
  async inspeccionar(urlString, sldDominio = '', esDominioOficial = false) {
    let browser;
    try {
      const targetUrl = urlString.startsWith('http') ? urlString : `https://${urlString}`;

      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--disable-blink-features=AutomationControlled'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1280, height: 800 });

      // Cargar la página con timeout de 8 segundos para no demorar la respuesta
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });

      const domData = await page.evaluate(() => {
        const title = document.title ? document.title.trim() : '';
        const metaRefresh = document.querySelector('meta[http-equiv="refresh"]') !== null;
        
        // Detectar campos de contraseñas
        const hasPasswordField = document.querySelector('input[type="password"]') !== null;
        
        // Detectar campos de tarjeta de crédito / CVV
        const inputs = Array.from(document.querySelectorAll('input'));
        const hasCreditCardField = inputs.some(input => {
          const name = (input.name || '').toLowerCase();
          const placeholder = (input.placeholder || '').toLowerCase();
          const id = (input.id || '').toLowerCase();
          const aria = (input.getAttribute('aria-label') || '').toLowerCase();
          const combined = `${name} ${placeholder} ${id} ${aria}`;
          return /card|tarjeta|tarj|cvv|cvc|ccv|expir|vencimiento|creditcard|numerotarjeta/.test(combined);
        });

        // Conteo de iframes y formularios
        const formCount = document.querySelectorAll('form').length;
        const iframeCount = document.querySelectorAll('iframe').length;

        return {
          title,
          metaRefresh,
          hasPasswordField,
          hasCreditCardField,
          formCount,
          iframeCount
        };
      });

      const indicadores = [];
      const factores = [];

      // 1. Validar captura de credenciales / contraseñas en sitios no oficiales
      if (domData.hasPasswordField && !esDominioOficial) {
        indicadores.push('🚨 FORMULARIO DE ACCESO - La página contiene campos para ingresar contraseñas en un dominio no oficial');
        factores.push('Formulario de contraseña en dominio no oficial (+5)');
      }

      // 2. Validar captura de tarjetas de crédito
      if (domData.hasCreditCardField && !esDominioOficial) {
        indicadores.push('💳 CAPTURA DE DATOS FINANCIEROS - La página solicita números de tarjeta o códigos CVV/CVC');
        factores.push('Formulario de tarjeta de crédito no oficial (+6)');
      }

      // 3. Validar si el título de la página suplanta una marca conocida
      const titleLower = domData.title.toLowerCase();
      let marcaDetectadaEnTitulo = null;

      for (const marca of this.marcasConocidas) {
        if (titleLower.includes(marca)) {
          marcaDetectadaEnTitulo = marca;
          break;
        }
      }

      if (marcaDetectadaEnTitulo && !sldDominio.includes(marcaDetectadaEnTitulo.replace(/\s+/g, '')) && !esDominioOficial) {
        indicadores.push(`🎯 SUPLANTACIÓN VISUAL - El título de la página ("${domData.title}") imita a "${marcaDetectadaEnTitulo.toUpperCase()}" en un dominio completamente diferente`);
        factores.push(`Título imita marca "${marcaDetectadaEnTitulo}" en dominio no oficial (+5)`);
      }

      // 4. Redirección oculta por meta-refresh
      if (domData.metaRefresh) {
        indicadores.push('🔄 REDIRECCIÓN OCULTA - La página contiene una etiqueta meta-refresh para redirigir automáticamente al usuario');
        factores.push('Redirección oculta meta-refresh (+2)');
      }

      return {
        analizado: true,
        titulo: domData.title,
        tienePassword: domData.hasPasswordField,
        tieneTarjeta: domData.hasCreditCardField,
        formularios: domData.formCount,
        iframes: domData.iframeCount,
        metaRefresh: domData.metaRefresh,
        marcaEnTitulo: marcaDetectadaEnTitulo,
        indicadores,
        factores
      };

    } catch (error) {
      return {
        analizado: false,
        error: error.message,
        indicadores: [],
        factores: []
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
    }
  }
}

export default DomInspector;
