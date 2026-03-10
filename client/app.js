import { UIManager } from './uiManager.js';
import { ApiClient } from './apiClient.js';
import { StorageManager } from './storage.js';

class PhishShieldApp {
  constructor(uiManager, apiClient, storageManager) {
    this.uiManager = uiManager;
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadHistory();
  }

  bindEvents() {
    document.getElementById("analyzeBtn").addEventListener("click", () => this.analyzeUrl());
    document.getElementById("reportBtnTop").addEventListener("click", () => this.reportUrl());

    document.querySelectorAll(".chip").forEach(btn => {
      btn.addEventListener("click", () => this.loadExample(btn.dataset.demo));
    });

    document.querySelector(".close-alert")?.addEventListener("click", () => {
      this.uiManager.closeTopAlert();
    });
  }

  async analyzeUrl() {
    const url = document.getElementById("urlInput").value.trim();

    if (!this.uiManager.validateUrl(url)) return;

    try {
      this.uiManager.setLoadingState(true);
      const analysisResult = await this.apiClient.analyzeUrl(url);
      this.uiManager.displayResults(url, analysisResult);
      this.storageManager.saveToHistory(url, analysisResult.riesgo);
    } catch (error) {
      this.uiManager.showNotification(error.message, "error");
    } finally {
      this.uiManager.setLoadingState(false);
    }
  }

  async reportUrl() {
    const url = document.getElementById("urlInput").value.trim();
    if (!url) {
      this.uiManager.showNotification("⚠️ Ingresa una URL primero para reportar.", "error");
      return;
    }

    try {
      await this.apiClient.reportUrl(url);
      this.uiManager.showNotification("✅ URL reportada correctamente.", "exito");
    } catch (error) {
      this.uiManager.showNotification("❌ Error al reportar la URL.", "error");
    }
  }

  loadExample(url) {
    this.uiManager.loadExampleUrl(url);
  }

  loadHistory() {
    const history = this.storageManager.getHistory();
    this.uiManager.displayHistory(history);
  }
}

export { PhishShieldApp };