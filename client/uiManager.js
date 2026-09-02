import { TipsEngine } from './tipsEngine.js';

class UIManager {
  constructor() {
    this.elements = this.cacheElements();
    this._toggleHandler = null; // Referencia persistente para poder removerla
    this.tipsEngine = new TipsEngine();
  }

  cacheElements() {
    return {
      urlInput: document.getElementById("urlInput"),
      analyzeBtn: document.getElementById("analyzeBtn"),
      result: document.getElementById("result"),
      urlOut: document.getElementById("urlOut"),
      riskBadge: document.getElementById("riskBadge"),
      riskProgress: document.getElementById("riskProgress"),
      riskScore: document.getElementById("riskScore"),
      securityResult: document.getElementById("securityResult"),
      detailsGrid: document.getElementById("detailsGrid"),
      toggleDetails: document.getElementById("toggleDetails"),
      detailsContent: document.getElementById("detailsContent"),
      searchHistory: document.getElementById("searchHistory")
    };
  }

  validateUrl(url) {
    if (!url) {
      this.showNotification("⚠️ Ingresa una URL para analizar.", "error");
      return false;
    }

    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      this.showNotification("❌ URL inválida", "error");
      return false;
    }
  }

  setLoadingState(loading) {
    const btn = this.elements.analyzeBtn;
    if (loading) {
      btn.textContent = "🔍 Analizando...";
      btn.disabled = true;
    } else {
      btn.textContent = "🔍 Analizar";
      btn.disabled = false;
    }
  }

  displayResults(url, analysisResult) {
    this.showResultSection();
    this.updateUrlOutput(url);
    this.updateRiskBadge(analysisResult.riesgo);
    this.updateRiskMeter(analysisResult.puntuacion, analysisResult.riesgo);
    this.updateSecurityResult(analysisResult.riesgo, analysisResult.indicadores);
    this.updateAnalysisDetails(url, analysisResult);
    this.displayTips(analysisResult);
    this.displayPreview(url);
  }

  displayPreview(url) {
    const previewContainer = document.getElementById("previewContainer");
    const previewImage = document.getElementById("previewImage");
    const previewLoading = document.getElementById("previewLoading");
    
    if (!previewContainer || !previewImage) return;
    
    // Solo mostrar si es una URL http/https válida
    if (!url.startsWith('http')) {
      previewContainer.style.display = "none";
      return;
    }
    
    previewContainer.style.display = "block";
    previewImage.style.display = "none";
    if (previewLoading) {
      previewLoading.textContent = "⏳ Generando vista previa de la página...";
      previewLoading.style.display = "flex";
    }
    
    // Utilizamos el endpoint de emulación de navegador local (Puppeteer)
    const previewUrl = `/api/screenshot?url=${encodeURIComponent(url)}`;
    
    previewImage.onload = () => {
      if (previewLoading) previewLoading.style.display = "none";
      previewImage.style.display = "block";
      // Añadir un pequeño retraso para que la transición CSS funcione
      setTimeout(() => {
        previewImage.style.opacity = "1";
      }, 50);
    };
    
    previewImage.onerror = () => {
      if (previewLoading) previewLoading.textContent = "❌ No se pudo cargar la vista previa (Sitio no disponible o protegido)";
    };
    
    previewImage.src = previewUrl;
  }

  displayTips(analysisResult) {
    const tipsContainer = document.getElementById("tipsContainer");
    if (!tipsContainer) return;
    
    tipsContainer.innerHTML = ''; // Limpiar anteriores
    
    const tips = this.tipsEngine.generateTips(analysisResult);
    if (tips.length > 0) {
      tipsContainer.innerHTML = tips.map((tip, index) => `
        <div class="tip-card ${tip.type}" style="animation-delay: ${index * 0.15}s;">
          <div class="tip-title">${tip.title}</div>
          <div class="tip-text">${tip.text}</div>
        </div>
      `).join('');
    }
  }

  showResultSection() {
    this.elements.result.hidden = false;
    // Reiniciar y aplicar animación de entrada
    this.elements.result.classList.remove('animate__animated', 'animate__fadeInUp', 'animate__faster');
    void this.elements.result.offsetWidth; // Reflow
    this.elements.result.classList.add('animate__animated', 'animate__fadeInUp', 'animate__faster');
  }

  updateUrlOutput(url) {
    this.elements.urlOut.textContent = url.length > 60 ? url.substring(0, 60) + '...' : url;
  }

  updateRiskBadge(riesgo) {
    this.elements.riskBadge.textContent = riesgo.toUpperCase();
    this.elements.riskBadge.className = "badge " + riesgo;
  }

  updateRiskMeter(puntuacion, riesgo) {
    const porcentaje = Math.min(puntuacion * 10, 100);

    // CORRECCIÓN: Actualizar barra de progreso correctamente
    this.elements.riskProgress.style.width = `${porcentaje}%`;

    // Determinar clase de riesgo
    let riskClass = "low-risk";
    if (puntuacion >= 7) {
      riskClass = "high-risk";
    } else if (puntuacion >= 4) {
      riskClass = "medium-risk";
    }

    // Aplicar clase correctamente
    this.elements.riskProgress.className = "progress-fill " + riskClass;
    this.elements.riskScore.textContent = `Puntuación: ${puntuacion}/10 - ${riesgo.toUpperCase()}`;
  }

  updateSecurityResult(riesgo, indicadores) {
    const config = this.getRiskConfig(riesgo);

    this.elements.securityResult.innerHTML = `
      <div class="result-header ${config.clase}">
        <span class="status-icon" aria-hidden="true">${config.icono}</span>
        <h3>${config.titulo}</h3>
      </div>
      <div class="result-body">
        <p><strong>Resumen:</strong> ${config.descripcion}</p>
        ${this.formatIndicators(indicadores)}
      </div>
    `;
  }

  getRiskConfig(riesgo) {
    const configs = {
      bajo: {
        icono: "✅",
        clase: "safe",
        titulo: "URL SEGURA DETECTADA",
        descripcion: "No se encontraron indicadores de phishing significativos."
      },
      medio: {
        icono: "⚠️",
        clase: "suspicious",
        titulo: "POSIBLE RIESGO DETECTADO",
        descripcion: "Se encontraron algunos indicadores que requieren atención."
      },
      alto: {
        icono: "🚨",
        clase: "danger",
        titulo: "ALTO RIESGO - POSIBLE PHISHING",
        descripcion: "Múltiples indicadores de phishing detectados. Extreme precauciones."
      }
    };

    return configs[riesgo] || configs.medio;
  }

  formatIndicators(indicadores) {
    if (!indicadores || indicadores.length === 0) {
      return '<p><strong>No se detectaron indicadores específicos.</strong></p>';
    }

    return `
      <p><strong>Indicadores detectados (${indicadores.length}):</strong></p>
      <ul>
        ${indicadores.map(ind => `<li>${ind}</li>`).join('')}
      </ul>
    `;
  }

  updateAnalysisDetails(url, analysisResult) {
    // Eliminar el listener anterior usando la referencia guardada en la instancia
    if (this._toggleHandler) {
      this.elements.toggleDetails.removeEventListener("click", this._toggleHandler);
    }

    this._toggleHandler = () => {
      const isExpanded = this.elements.detailsContent.classList.toggle("show");
      const toggleText = this.elements.toggleDetails.querySelector(".toggle-text");

      if (isExpanded) {
        this.elements.detailsContent.setAttribute("aria-hidden", "false");
        this.elements.toggleDetails.setAttribute("aria-expanded", "true");
        toggleText.textContent = "Ocultar análisis detallado";
        this.elements.detailsContent.classList.remove('animate__animated', 'animate__fadeIn', 'animate__faster');
        void this.elements.detailsContent.offsetWidth;
        this.elements.detailsContent.classList.add('animate__animated', 'animate__fadeIn', 'animate__faster');
      } else {
        this.elements.detailsContent.setAttribute("aria-hidden", "true");
        this.elements.toggleDetails.setAttribute("aria-expanded", "false");
        toggleText.textContent = "Ver análisis detallado";
        this.elements.detailsContent.classList.remove('animate__animated', 'animate__fadeIn', 'animate__faster');
      }
    };

    this.elements.toggleDetails.addEventListener("click", this._toggleHandler);

    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      console.error('❌ Error parseando URL para detalles:', e);
      return;
    }

    const dominio = urlObj.hostname;
    const protocolo = urlObj.protocol.replace(':', '');
    const tieneSubdominio = urlObj.hostname.split('.').length > 2;
    const esHTTPS = protocolo === 'https';
    const longitudRuta = urlObj.pathname.length;

    const detalles = [
      { label: "Dominio analizado", valor: dominio, estado: "safe" },
      { label: "Protocolo", valor: protocolo.toUpperCase(), estado: esHTTPS ? "safe" : "warning" },
      { label: "Subdominios", valor: tieneSubdominio ? "Sí" : "No", estado: tieneSubdominio ? "warning" : "safe" },
      { label: "Longitud de URL", valor: url.length > 50 ? "Larga" : "Normal", estado: url.length > 50 ? "warning" : "safe" },
      { label: "Caracteres especiales", valor: (url.match(/[^a-zA-Z0-9.:/]/g) || []).length, estado: "safe" },
      { label: "Nivel de riesgo", valor: analysisResult.riesgo.toUpperCase(), estado: analysisResult.riesgo === "alto" ? "danger" : analysisResult.riesgo === "medio" ? "warning" : "safe" },
      { label: "Puntuación heurística", valor: `${analysisResult.puntuacion}/10`, estado: analysisResult.puntuacion <= 3 ? "safe" : analysisResult.puntuacion <= 7 ? "warning" : "danger" },
      { label: "Indicadores encontrados", valor: analysisResult.indicadores.length, estado: analysisResult.indicadores.length === 0 ? "safe" : analysisResult.indicadores.length <= 2 ? "warning" : "danger" }
    ];

    this.elements.detailsGrid.innerHTML = detalles.map(detalle => `
      <div class="detail-item">
        <span class="detail-label">${detalle.label}:</span>
        <span class="detail-value ${detalle.estado}">${detalle.valor}</span>
      </div>
    `).join('');
  }

  displayHistory(history) {
    if (!history || history.length === 0) {
      this.elements.searchHistory.innerHTML = '<p class="muted">Aún no hay búsquedas recientes.</p>';
      return;
    }

    this.elements.searchHistory.innerHTML = history.map(entrada => {
      const urlCorta = entrada.url.length > 40 ? entrada.url.substring(0, 40) + '...' : entrada.url;
      const fecha = new Date(entrada.fecha).toLocaleTimeString();

      return `
        <div class="history-item ${entrada.riesgo}">
          <span title="${entrada.url}">${urlCorta}</span>
          <div>
            <span class="result-tag ${entrada.riesgo}">${entrada.riesgo.toUpperCase()}</span>
            <small class="muted">${fecha}</small>
          </div>
        </div>
      `;
    }).join('');
  }

  loadExampleUrl(url) {
    this.elements.urlInput.value = url;
    this.showNotification("✅ URL de ejemplo cargada. Haz clic en 'Analizar'.", "exito");
  }

  showNotification(mensaje, tipo = "exito") {
    const noti = document.getElementById("notificacion");
    if (!noti) {
      console.error("❌ Elemento de notificación no encontrado");
      return;
    }

    noti.textContent = mensaje;
    noti.className = `toast ${tipo}`;
    noti.hidden = false;

    noti.offsetHeight;

    noti.classList.add("show");

    setTimeout(() => {
      noti.classList.remove("show");
      setTimeout(() => {
        noti.hidden = true;
      }, 300);
    }, 4000);
  }

  closeTopAlert() {
    const topAlert = document.querySelector(".top-alert");
    if (topAlert) {
      topAlert.style.display = "none";
      document.body.style.paddingTop = "0";
    }
  }
}

export { UIManager };