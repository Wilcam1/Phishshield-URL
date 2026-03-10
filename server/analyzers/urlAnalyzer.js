class UrlAnalyzer {
  analyze(url) {
    const urlConProtocolo = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlConProtocolo);
    
    return {
      dominio: urlObj.hostname,
      protocolo: urlObj.protocol.replace(':', ''),
      subdominios: urlObj.hostname.split('.').length - 2,
      esHTTPS: urlObj.protocol === 'https:',
      puerto: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
      longitudRuta: urlObj.pathname.length,
      numeroParametros: urlObj.search ? new URLSearchParams(urlObj.search).size : 0,
      parametrosSensibles: this.detectSensitiveParameters(urlObj),
      tieneGuionesMultiples: (urlObj.hostname.match(/-/g) || []).length > 2,
      tieneNumerosEnDominio: /\d/.test(urlObj.hostname),
      esIP: /^(?:\d{1,3}\.){3}\d{1,3}$/.test(urlObj.hostname),
      longitudTotal: urlObj.href.length
    };
  }

  detectSensitiveParameters(urlObj) {
    const parametrosSensibles = ['password', 'pwd', 'credit', 'card', 'ssn', 'login', 'auth', 'token', 'user', 'pass', 'account'];
    const sensitiveParams = [];
    
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      parametrosSensibles.forEach(param => {
        if (params.has(param)) sensitiveParams.push(param);
      });
    }
    
    return sensitiveParams;
  }
}

export default UrlAnalyzer;