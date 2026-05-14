export class TipsEngine {
  constructor() {
    this.tipsLibrary = [
      {
        keyword: 'Protocolo HTTP inseguro',
        title: '🔒 Falta de Cifrado',
        text: 'Nunca ingreses contraseñas o tarjetas de crédito en sitios HTTP. Cualquiera en tu red Wi-Fi podría robar esa información. Busca siempre el candado (HTTPS).',
        type: 'warning'
      },
      {
        keyword: 'Usa dirección IP',
        title: '🕵️ Servidor Anónimo',
        text: 'Los atacantes a menudo usan números IP (192.x.x.x) en vez de comprar un nombre de dominio para ocultar sus rastros y levantar campañas fraudulentas.',
        type: 'danger'
      },
      {
        keyword: 'Parámetros sensibles en URL',
        title: '✂️ Datos Expuestos',
        text: 'La URL lleva palabras como "login" o "password". Enviar parámetros confidenciales directamente en el enlace puede provocar extravío de tu sesión.',
        type: 'warning'
      },
      {
        keyword: 'Muchos subdominios',
        title: '🧩 Ocultamiento por Subdominios', // e.g. login.secure.banco.com
        text: 'Los enlaces exageradamente compuestos buscan confundirte. Revisa siempre la palabra principal, que es la que se encuentra justo antes del ".com" o ".net".',
        type: 'warning'
      },
      {
        keyword: 'Typosquatting detectado',
        title: '👀 Falsificación de Identidad',
        text: 'El atacante está fingiendo ser una marca conocida. El nombre del dominio fue alterado sutilmente. ¡Tus credenciales están en peligro!',
        type: 'danger'
      },
      {
        keyword: 'Múltiples guiones en dominio',
        title: '➖ Dominios Camuflados',
        text: 'Los dominios con múltiples guiones (ej. envios-gratis-hoy) son comúnmente registrados por cibercriminales porque son baratos y fugaces.',
        type: 'warning'
      },
      {
        keyword: 'Confirmado en PhishTank',
        title: '🚨 Phishing Comprobado',
        text: 'Este enlace ya se encuentra en las listas internacionales de la policía cibernética. Es 100% una estafa, ¡Ciérralo inmediatamente!',
        type: 'danger'
      },
      {
        keyword: 'Google Safe Browsing',
        title: '🛡️ Bloqueo de Google',
        text: 'El motor de seguridad global de Google ya identificó esta página repartiendo software malicioso o intentando engañar a los usuarios.',
        type: 'danger'
      },
      {
        keyword: 'VirusTotal',
        title: '☢️ Alerta Antivirus',
        text: 'Múltiples empresas de seguridad global informaron que este enlace contiene fraude o archivos peligrosos.',
        type: 'danger'
      },
      {
        keyword: 'Reportado manualmente',
        title: '👥 Reporte Comunitario',
        text: 'Tus propios administradores o usuarios de confianza han verificado manualmente que este sitio es perjudicial para tu entorno corporativo.',
        type: 'danger'
      }
    ];
  }

  generateTips(analysisResult) {
    const matchedTips = [];
    
    // Si hay indicadores obvios
    if (analysisResult.indicadores && analysisResult.indicadores.length > 0) {
      analysisResult.indicadores.forEach(indicator => {
        const found = this.tipsLibrary.find(t => indicator.includes(t.keyword));
        if (found) {
          matchedTips.push(found);
        }
      });
    }

    // Agregar un tip general según el riesgo final
    if (matchedTips.length === 0) {
      if (analysisResult.riesgo === 'Bajo' || analysisResult.riesgo === 'bajo') {
        matchedTips.push({
          title: '✅ Zona Segura, pero mantente Alerta',
          text: 'Aunque nuestros motores no encontraron virus ni trucos evidentes, tu mejor antivirus eres tú. Nunca envíes dinero ni compartas claves si nadie te lo pidió oficialmente.',
          type: 'safe'
        });
      } else if (analysisResult.riesgo === 'Medio' || analysisResult.riesgo === 'medio') {
        matchedTips.push({
          title: '⚠️ Algo Huele Raro',
          text: 'Esta página tiene prácticas poco profesionales (como falta de candado SSL o subdirectorios extraños). Procede con precaución y no ingreses tu cuenta bancaria.',
          type: 'warning'
        });
      } else if (analysisResult.riesgo === 'Alto' || analysisResult.riesgo === 'alto') {
        matchedTips.push({
          title: '📛 Alerta de Peligro Extremo',
          text: 'Nuestro algoritmo ha detectado comportamientos altamente maliciosos propios de una campaña de fraude. Cierra la pestaña inmediatamente.',
          type: 'danger'
        });
      }
    }

    // Remover duplicados por título
    const uniqueTips = [];
    const map = new Map();
    for (const item of matchedTips) {
        if(!map.has(item.title)){
            map.set(item.title, true);
            uniqueTips.push(item);
        }
    }

    return uniqueTips;
  }
}
