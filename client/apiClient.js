class ApiClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  async analyzeUrl(url) {
    const response = await fetch(`${this.baseURL}/analizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async reportUrl(url) {
    const response = await fetch(`${this.baseURL}/reportar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async getStats() {
    const response = await fetch(`${this.baseURL}/estadisticas`);
    return await response.json();
  }

  async getHistory(limit = 10) {
    const response = await fetch(`${this.baseURL}/historial?limite=${limit}`);
    return await response.json();
  }
}

export { ApiClient };