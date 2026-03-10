class StorageManager {
  constructor() {
    this.historyKey = 'phishshield_historial';
  }

  saveToHistory(url, riesgo) {
    let historial = this.getHistory();
    
    if (!historial.find(entry => entry.url === url)) {
      historial.unshift({
        url,
        riesgo,
        fecha: new Date().toISOString()
      });
      
      historial = historial.slice(0, 5);
      localStorage.setItem(this.historyKey, JSON.stringify(historial));
    }
    
    return historial;
  }

  getHistory() {
    return JSON.parse(localStorage.getItem(this.historyKey) || '[]');
  }

  clearHistory() {
    localStorage.removeItem(this.historyKey);
    return [];
  }
}

export { StorageManager };