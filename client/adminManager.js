class AdminManager {
  constructor(apiClient, uiManager) {
    this.apiClient = apiClient;
    this.uiManager = uiManager;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Open login modal
    const adminBtn = document.getElementById("adminBtn");
    if (adminBtn) {
      adminBtn.addEventListener("click", () => {
        if (this.apiClient.token) {
          this.openDashboard();
        } else {
          document.getElementById("adminLoginModal").hidden = false;
        }
      });
    }

    // Close Modals
    document.getElementById("closeAdminLogin")?.addEventListener("click", () => {
      document.getElementById("adminLoginModal").hidden = true;
    });

    document.getElementById("closeAdminDashboard")?.addEventListener("click", () => {
      document.getElementById("adminDashboardModal").hidden = true;
    });

    // Login Submit
    const loginForm = document.getElementById("adminLoginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = document.getElementById("adminUsername").value;
        const pwd = document.getElementById("adminPassword").value;
        const errorDiv = document.getElementById("adminLoginError");
        try {
          await this.apiClient.adminLogin(user, pwd);
          document.getElementById("adminLoginModal").hidden = true;
          errorDiv.style.display = "none";
          document.getElementById("adminUsername").value = "";
          document.getElementById("adminPassword").value = "";
          this.openDashboard();
        } catch (err) {
          errorDiv.textContent = err.message;
          errorDiv.style.display = "block";
        }
      });
    }

    // Export JSON
    document.getElementById("exportJsonBtn")?.addEventListener("click", () => this.exportReportsJson());

    // Export CSV
    document.getElementById("exportCsvBtn")?.addEventListener("click", () => this.exportHistoryCsv());

    // Refresh
    document.getElementById("refreshAdminBtn")?.addEventListener("click", () => this.loadDashboardData());

    // Mostrar modal Cambio Contraseña
    document.getElementById("showChangePasswordBtn")?.addEventListener("click", () => {
      document.getElementById("adminChangePasswordModal").hidden = false;
    });

    // Cerrar modal Cambio Contraseña
    document.getElementById("closeChangePassword")?.addEventListener("click", () => {
      document.getElementById("adminChangePasswordModal").hidden = true;
      document.getElementById("changePasswordError").style.display = "none";
      document.getElementById("changePasswordForm")?.reset();

      // Reiniciar visualmente los requisitos
      const reqs = ["reqLength", "reqUpper", "reqNumber", "reqSpecial"];
      const defaultTexts = [
        "❌ Mínimo 8 caracteres",
        "❌ Mínimo una letra mayúscula",
        "❌ Mínimo un número",
        "❌ Mínimo un carácter especial (@$!%*?&#...)"
      ];
      reqs.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
          el.innerHTML = defaultTexts[idx];
          el.style.color = "var(--secondary-color)";
        }
      });
    });

    // Validación de contraseña en tiempo real
    const newPwdInput = document.getElementById("cpNewPassword");
    if (newPwdInput) {
      newPwdInput.addEventListener("input", (e) => {
        const val = e.target.value;
        const reqLength = document.getElementById("reqLength");
        const reqUpper = document.getElementById("reqUpper");
        const reqNumber = document.getElementById("reqNumber");
        const reqSpecial = document.getElementById("reqSpecial");

        const hasLength = val.length >= 8;
        const hasUpper = /[A-Z]/.test(val);
        const hasNumber = /\d/.test(val);
        const hasSpecial = /[^A-Za-z0-9]/.test(val);

        if (reqLength) {
          reqLength.innerHTML = hasLength ? "✅ Mínimo 8 caracteres" : "❌ Mínimo 8 caracteres";
          reqLength.style.color = hasLength ? "var(--safe-text)" : "var(--secondary-color)";
        }
        if (reqUpper) {
          reqUpper.innerHTML = hasUpper ? "✅ Mínimo una letra mayúscula" : "❌ Mínimo una letra mayúscula";
          reqUpper.style.color = hasUpper ? "var(--safe-text)" : "var(--secondary-color)";
        }
        if (reqNumber) {
          reqNumber.innerHTML = hasNumber ? "✅ Mínimo un número" : "❌ Mínimo un número";
          reqNumber.style.color = hasNumber ? "var(--safe-text)" : "var(--secondary-color)";
        }
        if (reqSpecial) {
          reqSpecial.innerHTML = hasSpecial ? "✅ Mínimo un carácter especial (@$!%*?&#...)" : "❌ Mínimo un carácter especial (@$!%*?&#...)";
          reqSpecial.style.color = hasSpecial ? "var(--safe-text)" : "var(--secondary-color)";
        }
      });
    }

    // Submit Cambio Contraseña
    const cpForm = document.getElementById("changePasswordForm");
    if (cpForm) {
      cpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const oldPwd = document.getElementById("cpOldPassword").value;
        const newPwd = document.getElementById("cpNewPassword").value;
        const confirmPwd = document.getElementById("cpConfirmPassword").value;
        const errorDiv = document.getElementById("changePasswordError");

        const hasLength = newPwd.length >= 8;
        const hasUpper = /[A-Z]/.test(newPwd);
        const hasNumber = /\d/.test(newPwd);
        const hasSpecial = /[^A-Za-z0-9]/.test(newPwd);

        if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
          errorDiv.textContent = "❌ La contraseña no cumple con los requisitos de seguridad";
          errorDiv.style.display = "block";
          return;
        }

        if (newPwd !== confirmPwd) {
          errorDiv.textContent = "❌ Las contraseñas nuevas no coinciden";
          errorDiv.style.display = "block";
          return;
        }

        try {
          const btn = cpForm.querySelector("button[type='submit']");
          btn.textContent = "Actualizando...";
          btn.disabled = true;

          await this.apiClient.adminChangePassword(oldPwd, newPwd);

          document.getElementById("adminChangePasswordModal").hidden = true;
          errorDiv.style.display = "none";
          cpForm.reset();
          btn.textContent = "Actualizar Contraseña";
          btn.disabled = false;

          this.uiManager.showNotification("Contraseña actualizada exitosamente", "exito");
        } catch (err) {
          const btn = cpForm.querySelector("button[type='submit']");
          btn.textContent = "Actualizar Contraseña";
          btn.disabled = false;

          errorDiv.textContent = "❌ " + err.message;
          errorDiv.style.display = "block";
        }
      });
    }

    // Logout
    document.getElementById("logoutAdminBtn")?.addEventListener("click", () => {
      this.apiClient.setToken(null);
      document.getElementById("adminDashboardModal").hidden = true;
      this.uiManager.showNotification("Sesión de administrador cerrada", "exito");
    });

    // Clic en KPIs del Admin Dashboard
    document.querySelectorAll('.stat-clickable[data-admin-filter]').forEach(card => {
      card.addEventListener('click', () => this.openAdminKpiModal(card.dataset.adminFilter));
    });
  }

  async openAdminKpiModal(filtro) {
    const modal = document.getElementById('urlsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    const TITULOS = {
      todas: '🔍 Todas las URLs analizadas',
      alto: '🔴 URLs de riesgo alto',
      medio: '🟡 URLs de riesgo medio',
      bajo: '🟢 URLs de riesgo bajo',
      reportes: '📥 Reportes Manuales (Comunitarios)'
    };

    modalTitle.textContent = TITULOS[filtro] || 'URLs analizadas';
    modalBody.innerHTML = '<p class="modal-empty">Cargando...</p>';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    try {
      if (filtro === 'reportes') {
        const reports = await this.apiClient.adminGetReports();
        if (!reports.length) {
          modalBody.innerHTML = '<p class="modal-empty">No hay reportes manuales aún.</p>';
          return;
        }
        modalBody.innerHTML = reports.map(r => {
          const fecha = new Date(r.timestamp).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
          return `
            <div class="modal-url-item">
              <span class="modal-url-text" title="${r.url}">${r.url}</span>
              <div class="modal-url-meta">
                <span class="badge alto">REPORTE</span>
                <span class="modal-url-score">Por: ${r.reportero} · ${fecha}</span>
              </div>
            </div>`;
        }).join('');
      } else {
        const history = await this.apiClient.adminGetHistory();
        const filtradas = filtro === 'todas'
          ? history
          : history.filter(e => e.riesgo === filtro);

        if (!filtradas.length) {
          modalBody.innerHTML = '<p class="modal-empty">No hay URLs en esta categoría aún.</p>';
          return;
        }

        const BADGE_CLASS = { alto: 'danger', medio: 'warning', bajo: 'safe' };
        modalBody.innerHTML = filtradas.map(e => {
          const fecha = new Date(e.timestamp).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
          return `
            <div class="modal-url-item">
              <span class="modal-url-text" title="${e.url}">${e.url}</span>
              <div class="modal-url-meta">
                <span class="badge ${e.riesgo === 'alto' ? 'alto' : e.riesgo === 'medio' ? 'medio' : 'bajo'}">${e.riesgo.toUpperCase()}</span>
                <span class="modal-url-score">${e.puntuacion}/10 · ${fecha}</span>
              </div>
            </div>`;
        }).join('');
      }
    } catch (err) {
      modalBody.innerHTML = '<p class="modal-empty">Error al cargar datos.</p>';
    }
  }

  async openDashboard() {
    document.getElementById("adminDashboardModal").hidden = false;
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      const reports = await this.apiClient.adminGetReports();
      const history = await this.apiClient.adminGetHistory();

      this.renderReports(reports);
      this.renderHistory(history);

      // Actualizar KPIs de Resumen
      const kpiTotal = document.getElementById("adminKpiTotal");
      const kpiDanger = document.getElementById("adminKpiDanger");
      const kpiSafe = document.getElementById("adminKpiSafe");
      const kpiReports = document.getElementById("adminKpiReports");

      if (kpiTotal) kpiTotal.textContent = history.length;
      if (kpiDanger) kpiDanger.textContent = history.filter(h => h.riesgo === 'alto').length;
      if (kpiSafe) kpiSafe.textContent = history.filter(h => h.riesgo === 'bajo').length;
      if (kpiReports) kpiReports.textContent = reports.length;

      // Actualizar Gráfico Donut
      this.updateDonutChart(history);

    } catch (err) {
      this.uiManager.showNotification("Error cargando datos: " + err.message, "error");
    }
  }

  updateDonutChart(history) {
    const chart = document.getElementById("adminDonutChart");
    const safeLbl = document.getElementById("donutSafe");
    const warnLbl = document.getElementById("donutWarn");
    const dangerLbl = document.getElementById("donutDanger");

    if (!chart || history.length === 0) return;

    const total = history.length;
    const safeCount = history.filter(h => h.riesgo === 'bajo').length;
    const warnCount = history.filter(h => h.riesgo === 'medio').length;
    const dangerCount = history.filter(h => h.riesgo === 'alto').length;

    const safePct = Math.round((safeCount / total) * 100) || 0;
    const warnPct = Math.round((warnCount / total) * 100) || 0;
    const dangerPct = Math.round((dangerCount / total) * 100) || 0;

    if (safeLbl) safeLbl.textContent = `${safeCount} (${safePct}%)`;
    if (warnLbl) warnLbl.textContent = `${warnCount} (${warnPct}%)`;
    if (dangerLbl) dangerLbl.textContent = `${dangerCount} (${dangerPct}%)`;

    // Calcular grados para el conic-gradient
    const safeDeg = (safeCount / total) * 360;
    const warnDeg = safeDeg + ((warnCount / total) * 360);

    // conic-gradient: color inicio_grados, color fin_grados
    chart.style.background = `conic-gradient(
      #10b981 0deg ${safeDeg}deg, 
      #f59e0b ${safeDeg}deg ${warnDeg}deg, 
      #ef4444 ${warnDeg}deg 360deg
    )`;
  }

  renderReports(reports) {
    const container = document.getElementById("adminReportsList");
    if (!reports || reports.length === 0) {
      container.innerHTML = "<div style='text-align: center; color: var(--secondary-color); padding: 20px;'>No hay alertas comunitarias activas</div>";
      return;
    }

    // Mostrar solo las últimas 5 (revertimos para que las más nuevas salgan primero)
    const topReports = [...reports].reverse().slice(0, 5);

    container.innerHTML = topReports.map(dominio => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,0,0,0.02); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px; transition: transform 0.2s;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">🚨</span>
          <span style="font-weight: 500; font-size: 0.85rem; word-break: break-all;">${dominio}</span>
        </div>
        <button class="admin-delete-btn" data-type="report" data-val="${dominio}" style="background: rgba(220,53,69,0.1); color: var(--danger-color); border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: background 0.2s;" title="Descartar Alerta">Descartar</button>
      </div>
    `).join("");

    this.bindDeleteButtons(container);
  }

  renderHistory(history) {
    const container = document.getElementById("adminHistoryList");
    if (!history || history.length === 0) {
      container.innerHTML = "<tr><td colspan='4' style='padding: 30px; text-align: center; color: var(--secondary-color);'>No hay análisis en el historial global</td></tr>";
      return;
    }

    container.innerHTML = history.map(item => {
      const dateStr = new Date(item.timestamp || Date.now()).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
      const badgeColor = item.riesgo === 'alto' ? 'var(--danger-color)' : item.riesgo === 'medio' ? 'var(--suspicious-text)' : 'var(--safe-text)';
      const badgeBg = item.riesgo === 'alto' ? 'rgba(220,53,69,0.15)' : item.riesgo === 'medio' ? 'rgba(255,193,7,0.15)' : 'rgba(40,167,69,0.15)';

      return `
      <tr style="transition: background 0.2s; background: var(--card-bg);">
        <td style="padding: 10px 15px; border-top-left-radius: 8px; border-bottom-left-radius: 8px; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); border-left: 1px solid var(--border-color);">
          <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 5px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">
            ${item.riesgo}
          </span>
        </td>
        <td style="padding: 10px 15px; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);" title="${item.url}">
          ${item.url}
        </td>
        <td style="padding: 10px 15px; font-family: monospace; font-size: 1rem; color: var(--text-color); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">${item.puntuacion || 0}<span style="font-size: 0.75rem; color: var(--secondary-color);">/10</span></td>
        <td style="padding: 10px 15px; color: var(--secondary-color); font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center; border-top-right-radius: 8px; border-bottom-right-radius: 8px; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); border-right: 1px solid var(--border-color);">
          ${dateStr}
          <button class="admin-delete-btn" data-type="history" data-val="${item.url}" style="background: none; border: none; color: var(--danger-color); cursor: pointer; padding: 4px; border-radius: 4px; font-size: 0.9rem; opacity: 0.7; transition: opacity 0.2s;" title="Eliminar Registro">🗑️</button>
        </td>
      </tr>
      `;
    }).join("");

    this.bindDeleteButtons(container);
  }

  bindDeleteButtons(container) {
    container.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const type = e.target.getAttribute('data-type');
        const val = e.target.getAttribute('data-val');

        if (!confirm("¿Seguro que deseas eliminar este registro (" + val + ")?")) return;

        try {
          const btnTxt = e.target.textContent;
          e.target.textContent = "Borrando...";
          e.target.disabled = true;

          if (type === 'report') {
            await this.apiClient.adminDeleteReport(val);
          } else {
            await this.apiClient.adminDeleteHistory(val);
          }

          this.uiManager.showNotification("Registro eliminado", "exito");
          await this.loadDashboardData(); // Refresh list it
        } catch (err) {
          e.target.textContent = "Error";
          this.uiManager.showNotification("Error: " + err.message, "error");
        }
      });
    });
  }

  async exportReportsJson() {
    try {
      const reports = await this.apiClient.adminGetReports();
      if (!reports || reports.length === 0) {
        this.uiManager.showNotification("No hay reportes para exportar", "error");
        return;
      }

      const jsonContent = JSON.stringify(reports, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", "reportes_phishing.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      this.uiManager.showNotification("Error al exportar: " + err.message, "error");
    }
  }

  async exportHistoryCsv() {
    try {
      const history = await this.apiClient.adminGetHistory();
      if (!history || history.length === 0) {
        this.uiManager.showNotification("No hay historial para exportar", "error");
        return;
      }

      const header = ["Timestamp,URL,Puntuacion,Riesgo"];
      const rows = history.map(item => {
        // escape url to prevent comma issues
        const urlEscaped = '"' + item.url.replace(/"/g, '""') + '"';
        return `${item.timestamp},${urlEscaped},${item.puntuacion},${item.riesgo}`;
      });

      const csvContent = header.concat(rows).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "historial_analisis.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      this.uiManager.showNotification("Error al exportar: " + err.message, "error");
    }
  }
}

export { AdminManager };
