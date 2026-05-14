class RiskCalculator {
  calcular(indicadores, caracteristicas, verificacionesExternas) {
    let puntuacion = 0;
    const factores = [];

    // Factores de alto riesgo
    if (verificacionesExternas.includes('reportado_manualmente')) {
      puntuacion += 10;
      factores.push('Reportado manualmente como Phishing (+10)');
    }

    if (verificacionesExternas.includes('phishtank_confirmado')) {
      puntuacion += 10;
      factores.push('Confirmado en PhishTank (+10)');
    }

    if (verificacionesExternas.includes('safebrowsing_alert')) {
      puntuacion += 5;
      factores.push('Detectado por Google Safe Browsing (+5)');
    }

    if (verificacionesExternas.includes('virustotal_malicious')) {
      puntuacion += 8;
      factores.push('Detectado como malicioso por VirusTotal (+8)');
    } else if (verificacionesExternas.includes('virustotal_suspicious')) {
      puntuacion += 4;
      factores.push('Marcado como sospechoso por VirusTotal (+4)');
    }

    if (caracteristicas.esIP) {
      puntuacion += 3;
      factores.push('Usa dirección IP (+3)');
    }

    if (caracteristicas.parametrosSensibles && caracteristicas.parametrosSensibles.length > 0) {
      puntuacion += 3;
      factores.push('Parámetros sensibles en URL (+3)');
    }

    // Detección de typosquatting
    const tieneTyposquatting = indicadores.some(ind =>
      ind.includes('POSIBLE SUPLANTACIÓN') ||
      ind.includes('Imita al banco') ||
      ind.includes('Dominio de alta sospecha')
    );

    if (tieneTyposquatting) {
      puntuacion += 4;
      factores.push('Typosquatting detectado (+4)');
    }

    // Factores de medio riesgo
    if (!caracteristicas.esHTTPS) {
      puntuacion += 2;
      factores.push('Protocolo HTTP inseguro (+2)');
    }

    if (caracteristicas.tieneGuionesMultiples) {
      puntuacion += 2;
      factores.push('Múltiples guiones en dominio (+2)');
    }

    if (caracteristicas.subdominios > 2) {
      puntuacion += 2;
      factores.push('Muchos subdominios (+2)');
    }

    if (caracteristicas.longitudTotal > 100) {
      puntuacion += 2;
      factores.push('URL muy larga (+2)');
    }

    // Puntos por indicadores generales
    const indicadoresCount = indicadores.length;
    if (indicadoresCount > 0) {
      const indicadoresNoTyposquatting = indicadores.filter(ind =>
        !ind.includes('POSIBLE SUPLANTACIÓN') &&
        !ind.includes('Imita al banco') &&
        !ind.includes('Dominio de alta sospecha')
      ).length;

      const puntosPorIndicadores = Math.min(indicadoresNoTyposquatting, 3);
      if (puntosPorIndicadores > 0) {
        puntuacion += puntosPorIndicadores;
        factores.push(`Indicadores detectados: ${indicadoresNoTyposquatting} (+${puntosPorIndicadores})`);
      }
    }

    // Factores de bajo riesgo
    if (caracteristicas.tieneNumerosEnDominio) {
      puntuacion += 1;
      factores.push('Números en dominio (+1)');
    }

    if (caracteristicas.numeroParametros > 5) {
      puntuacion += 1;
      factores.push('Muchos parámetros (+1)');
    }

    if (caracteristicas.longitudRuta > 50) {
      puntuacion += 1;
      factores.push('Ruta muy larga (+1)');
    }

    // Ajustar por verificaciones externas limpias
    if (verificacionesExternas.includes('phishtank_clean')) {
      puntuacion = Math.max(0, puntuacion - 1);
      factores.push('Verificado en PhishTank (-1)');
    }

    if (verificacionesExternas.includes('safebrowsing_clean')) {
      puntuacion = Math.max(0, puntuacion - 1);
      factores.push('Verificado en Safe Browsing (-1)');
    }

    if (verificacionesExternas.includes('virustotal_clean')) {
      puntuacion = Math.max(0, puntuacion - 2);
      factores.push('Verificado limpio por VirusTotal (-2)');
    }

    // Asegurar que la puntuación esté entre 0 y 10
    puntuacion = Math.max(0, Math.min(10, Math.round(puntuacion)));

    return { puntuacion: puntuacion, factores };
  }

  determinarRiesgo(puntuacion) {
    if (puntuacion >= 7) return 'alto';
    if (puntuacion >= 4) return 'medio';
    return 'bajo';
  }
}

export default RiskCalculator;