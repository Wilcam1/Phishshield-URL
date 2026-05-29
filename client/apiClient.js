class ApiClient {
  constructor(baseURL = window.location.origin) {
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

  // --- MÉTODOS DE ADMINISTRADOR ---
  setToken(token) {
    this.token = token;
  }

  async adminLogin(username, password) {
    const response = await fetch(`${this.baseURL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Error de inicio de sesión");
    }
    this.setToken(data.token);
    return data;
  }

  async adminGetReports() {
    const res = await fetch(`${this.baseURL}/api/admin/export/reportes`, {
      headers: { "Authorization": `Bearer ${this.token}` }
    });
    if (!res.ok) throw new Error("No autorizado");
    return await res.json();
  }

  async adminGetHistory() {
    const res = await fetch(`${this.baseURL}/api/admin/export/historial`, {
      headers: { "Authorization": `Bearer ${this.token}` }
    });
    if (!res.ok) throw new Error("No autorizado");
    return await res.json();
  }

  async adminDeleteReport(dominio) {
    const res = await fetch(`${this.baseURL}/api/admin/reportar`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`
      },
      body: JSON.stringify({ dominio })
    });
    if (!res.ok) throw new Error("Error borrando reporte");
    return await res.json();
  }

  async adminDeleteHistory(url) {
    const res = await fetch(`${this.baseURL}/api/admin/historial`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`
      },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error("Error borrando historial");
    return await res.json();
  }

  async adminChangePassword(oldPassword, newPassword) {
    const res = await fetch(`${this.baseURL}/api/admin/change-password`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Error cambiando contraseña");
    }
    return data;
  }
}

export { ApiClient };