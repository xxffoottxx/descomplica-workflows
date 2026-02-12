/**
 * Main Application Logic
 * Handles data fetching, UI updates, charts, and user interactions
 */

// Configuration
const CONFIG = {
  dataWebhookUrl: 'https://n8n.descomplicador.pt/webhook/dashboard-refresh',
  reportWebhookUrl: 'https://n8n.descomplicador.pt/webhook/generate-report',
  webhookAuthHeader: 'Api-Key',
  webhookAuthToken: 'pcsk_3exga9_NVmGqhfn3fSukBvAHhBQ1SfoCCNoQFGMB4Q1MhxzLuMQn7GJy9ghAFjREqDLKZH',
  refreshInterval: 30 * 60 * 1000, // 30 minutes
  dataEndpoint: 'data/dashboard-data.json', // Fallback to local JSON for demo
};

// Application State
const state = {
  currentData: null,
  lastUpdate: null,
  charts: {},
  currentPeriod: 'today',
  selectedDate: new Date().toISOString().split('T')[0],
};

/**
 * Initialize Application
 */
function initApp() {
  // Check authentication
  if (!authManager.isAuthenticated()) {
    return; // PIN screen is shown
  }

  // Hide PIN screen, show app
  document.getElementById('pin-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  setTimeout(() => {
    document.getElementById('main-app').style.opacity = '1';
  }, 10);

  // Setup UI
  setupUI();

  // Load initial data
  loadDashboardData();

  // Setup auto-refresh
  setupAutoRefresh();
}

/**
 * Setup UI Event Listeners
 */
function setupUI() {
  // Update current date
  updateCurrentDate();

  // Dark mode toggle
  setupThemeToggle();

  // Refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    loadDashboardData().finally(() => {
      refreshBtn.classList.remove('spinning');
    });
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', () => {
    authManager.logout();
    location.reload();
  });

  // Generate report button
  document.getElementById('generate-report-btn').addEventListener('click', () => {
    showReportModal();
  });

  // Report modal handlers
  document.getElementById('close-modal').addEventListener('click', hideReportModal);
  document.getElementById('cancel-report-btn').addEventListener('click', hideReportModal);
  document.getElementById('confirm-report-btn').addEventListener('click', generateReport);

  // Low stock toggle
  document.getElementById('toggle-low-stock').addEventListener('click', () => {
    const list = document.getElementById('low-stock-list');
    const btn = document.getElementById('toggle-low-stock');
    const isExpanded = list.classList.contains('expanded');

    if (isExpanded) {
      list.style.maxHeight = list.scrollHeight + 'px';
      requestAnimationFrame(() => {
        list.style.maxHeight = '0';
      });
      list.classList.remove('expanded');
      list.classList.add('collapsed');
      btn.classList.remove('open');
    } else {
      list.classList.remove('collapsed');
      list.classList.add('expanded');
      list.style.maxHeight = list.scrollHeight + 'px';
      btn.classList.add('open');
    }
  });

  // Sales period tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const period = btn.dataset.period;
      switchSalesPeriod(period);
    });
  });

  // Date picker
  const datePicker = document.getElementById('date-picker');
  if (datePicker) {
    datePicker.value = state.selectedDate;
    datePicker.max = new Date().toISOString().split('T')[0];
    datePicker.addEventListener('change', (e) => {
      state.selectedDate = e.target.value;
      updateSectionTitle();
      loadDashboardData();
    });
  }

  // Setup default report dates (last 7 days)
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  document.getElementById('report-end-date').valueAsDate = today;
  document.getElementById('report-start-date').valueAsDate = lastWeek;
}

/**
 * Setup Dark Mode Toggle
 */
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const lightIcon = document.getElementById('theme-icon-light');
  const darkIcon = document.getElementById('theme-icon-dark');

  const updateThemeIcons = (theme) => {
    if (theme === 'dark') {
      lightIcon.style.display = 'none';
      darkIcon.style.display = 'block';
    } else {
      lightIcon.style.display = 'block';
      darkIcon.style.display = 'none';
    }
  };

  // Initialize icon state
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeIcons(currentTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dashboard_theme', newTheme);
    updateThemeIcons(newTheme);
  });
}

/**
 * Update Current Date Display
 */
function updateCurrentDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const dateStr = now.toLocaleDateString('pt-PT', options);
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    dateEl.textContent = capitalizedDate;
  }
}

/**
 * Update Section Title Based on Selected Date
 */
function updateSectionTitle() {
  const today = new Date().toISOString().split('T')[0];
  const sectionTitle = document.querySelector('.dashboard-section .section-title');
  if (!sectionTitle) return;

  if (state.selectedDate === today) {
    sectionTitle.textContent = 'Resumo do Dia';
  } else {
    const parts = state.selectedDate.split('-');
    const formatted = parts[2] + '/' + parts[1] + '/' + parts[0];
    sectionTitle.textContent = 'Resumo de ' + formatted;
  }
}

/**
 * Load Dashboard Data
 */
async function loadDashboardData() {
  showLoading();

  try {
    // Try to fetch from webhook/API first
    let data;
    try {
      const response = await fetch(CONFIG.dataWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CONFIG.webhookAuthHeader]: CONFIG.webhookAuthToken,
        },
        body: JSON.stringify({ date: state.selectedDate }),
      });
      if (!response.ok) throw new Error('API not available');
      data = await response.json();
    } catch (apiError) {
      // Fallback to demo data
      data = getDemoData();
    }

    state.currentData = data;
    state.lastUpdate = new Date();

    updateDashboard(data);
    updateLastUpdateTime();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showError('Erro ao carregar dados. A tentar novamente...');
  } finally {
    hideLoading();
  }
}

/**
 * Update All Dashboard Sections
 */
function updateDashboard(data) {
  updateResumo(data.resumo);
  updateVendas(data.vendas);
  updateTarefas(data.tarefas);
  updateStock(data.stock);
  updateEmail(data.email);
  updateEquipa(data.equipa);
}

/**
 * Update Resumo do Dia Section
 */
function updateResumo(resumo) {
  document.getElementById('revenue-today').textContent = formatCurrency(resumo.receitaHoje);
  document.getElementById('revenue-change').textContent = formatPercentage(resumo.receitaMudanca);
  document.getElementById('revenue-change').className = `metric-change ${resumo.receitaMudanca >= 0 ? 'positive' : 'negative'}`;

  document.getElementById('orders-today').textContent = resumo.pedidosHoje;
  document.getElementById('orders-change').textContent = formatPercentage(resumo.pedidosMudanca);

  document.getElementById('tasks-open').textContent = resumo.tarefasAbertas;
  document.getElementById('tasks-completed').textContent = `${resumo.tarefasConcluidas} concluídas`;

  document.getElementById('emails-unread').textContent = resumo.emailsNaoLidos;
  document.getElementById('emails-important').textContent = `${resumo.emailsImportantes} importantes`;
}

/**
 * Update Vendas Section with Chart
 */
function updateVendas(vendas) {
  // Update stats
  document.getElementById('avg-ticket').textContent = formatCurrency(vendas.ticketMedio);
  document.getElementById('week-total').textContent = formatCurrency(vendas.totalSemana);
  document.getElementById('month-total').textContent = formatCurrency(vendas.totalMes);

  // Update chart
  updateSalesChart(vendas[state.currentPeriod]);
}

/**
 * Update Sales Chart
 */
function updateSalesChart(data) {
  const ctx = document.getElementById('sales-chart');
  if (!ctx) return;

  // Destroy existing chart
  if (state.charts.sales) {
    state.charts.sales.destroy();
  }

  // Create new chart
  state.charts.sales = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Vendas',
        data: data.values,
        borderColor: '#b5e04e',
        backgroundColor: 'rgba(181, 224, 78, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#b5e04e',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 13
          },
          bodyFont: {
            size: 14,
            weight: 'bold'
          },
          callbacks: {
            label: (context) => {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              if (value >= 1000) return (value / 1000).toFixed(1) + 'k EUR';
              return value + ' EUR';
            },
            font: {
              size: 11
            }
          },
          grid: {
            color: document.documentElement.getAttribute('data-theme') === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 11
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * Switch Sales Period
 */
function switchSalesPeriod(period) {
  state.currentPeriod = period;

  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.period === period) {
      btn.classList.add('active');
    }
  });

  // Update chart
  if (state.currentData && state.currentData.vendas) {
    updateSalesChart(state.currentData.vendas[period]);
  }
}

/**
 * Update Tarefas Section
 */
function updateTarefas(tarefas) {
  document.getElementById('tasks-open-count').textContent = tarefas.abertas;
  document.getElementById('tasks-completed-count').textContent = tarefas.concluidasHoje;
  document.getElementById('tasks-overdue-count').textContent = tarefas.atrasadas;

  const totalTasks = tarefas.abertas + tarefas.concluidasHoje;
  const completionRate = totalTasks > 0 ? (tarefas.concluidasHoje / totalTasks) * 100 : 0;

  document.getElementById('tasks-progress').style.width = `${completionRate}%`;
  document.getElementById('tasks-progress-text').textContent = `${Math.round(completionRate)}% concluído`;
}

/**
 * Update Stock Section
 */
function updateStock(stock) {
  document.getElementById('low-stock-count').textContent = stock.baixoStock.length;
  document.getElementById('total-products').textContent = stock.totalProdutos;
  document.getElementById('stock-value').textContent = formatCurrency(stock.valorTotal);

  // Update low stock alerts
  const alertList = document.getElementById('low-stock-list');
  const toggleBtn = document.getElementById('toggle-low-stock');
  const toggleText = document.getElementById('low-stock-toggle-text');
  alertList.innerHTML = '';

  if (stock.baixoStock.length > 0) {
    toggleBtn.style.display = 'flex';
    toggleText.textContent = `Ver ${stock.baixoStock.length} produtos em baixo stock`;

    stock.baixoStock.forEach(item => {
      const alertEl = document.createElement('div');
      alertEl.className = 'alert-item';
      alertEl.textContent = `${item.produto}: ${item.quantidade} unidades (mín: ${item.minimo})`;
      alertList.appendChild(alertEl);
    });

    // Set max-height for animation if already expanded
    if (alertList.classList.contains('expanded')) {
      alertList.style.maxHeight = alertList.scrollHeight + 'px';
    }
  } else {
    toggleBtn.style.display = 'none';
    alertList.classList.remove('expanded');
    alertList.classList.add('collapsed');
    toggleBtn.classList.remove('open');
  }
}

/**
 * Update Email Section
 */
function updateEmail(email) {
  document.getElementById('email-unread-count').textContent = email.naoLidas;
  document.getElementById('email-important-count').textContent = email.importantes;
  document.getElementById('email-sent-count').textContent = email.enviadasHoje;
  document.getElementById('email-response-rate').textContent = `${email.taxaResposta}%`;
}

/**
 * Update Equipa Section
 */
function updateEquipa(equipa) {
  document.getElementById('team-present').textContent = equipa.presentes;
  document.getElementById('team-hours').textContent = `${equipa.horasTrabalhadas}h`;

  // Update team member list
  const teamList = document.getElementById('team-list');
  teamList.innerHTML = '';

  equipa.membros.forEach(membro => {
    const memberEl = document.createElement('div');
    memberEl.className = 'team-member';

    const avatar = document.createElement('div');
    avatar.className = 'team-avatar';
    avatar.textContent = getInitials(membro.nome);

    const info = document.createElement('div');
    info.className = 'team-info';
    const name = document.createElement('div');
    name.className = 'team-name';
    name.textContent = membro.nome;
    const role = document.createElement('div');
    role.className = 'team-role';
    role.textContent = membro.funcao;
    info.appendChild(name);
    info.appendChild(role);

    const hours = document.createElement('div');
    hours.className = 'team-hours';
    hours.textContent = `${membro.horas}h`;

    memberEl.appendChild(avatar);
    memberEl.appendChild(info);
    memberEl.appendChild(hours);
    teamList.appendChild(memberEl);
  });
}

/**
 * Show Report Modal
 */
function showReportModal() {
  document.getElementById('report-modal').style.display = 'flex';
}

/**
 * Hide Report Modal
 */
function hideReportModal() {
  document.getElementById('report-modal').style.display = 'none';
}

/**
 * Generate Report
 */
async function generateReport() {
  const startDate = document.getElementById('report-start-date').value;
  const endDate = document.getElementById('report-end-date').value;

  if (!startDate || !endDate) {
    showToast('Por favor, selecione ambas as datas', 'warning');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showToast('A data de início deve ser anterior à data de fim', 'warning');
    return;
  }

  showLoading('A gerar relatório...');
  hideReportModal();

  try {
    const response = await fetch(CONFIG.reportWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [CONFIG.webhookAuthHeader]: CONFIG.webhookAuthToken,
      },
      body: JSON.stringify({
        startDate,
        endDate
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar relatório');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${startDate}-${endDate}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    console.error('Report generation error:', error);
    showToast('Erro ao gerar relatório. Por favor, tente novamente.', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Setup Auto Refresh
 */
function setupAutoRefresh() {
  setInterval(() => {
    loadDashboardData();
  }, CONFIG.refreshInterval);
}

/**
 * Update Last Update Time
 */
function updateLastUpdateTime() {
  if (!state.lastUpdate) return;

  const timeStr = state.lastUpdate.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  document.getElementById('last-update-time').textContent = timeStr;
}

/**
 * Show Loading Overlay
 */
function showLoading(message = 'A atualizar dados...') {
  const overlay = document.getElementById('loading-overlay');
  const text = overlay.querySelector('p');
  if (text) text.textContent = message;
  overlay.style.display = 'flex';
}

/**
 * Hide Loading Overlay
 */
function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'error', duration = 4000) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}

/**
 * Show Error Message
 */
function showError(message) {
  console.error(message);
  showToast(message, 'error');
}

/**
 * Utility Functions
 */

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function formatPercentage(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value}%`;
}

function getInitials(name) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Demo Data Generator
 */
function getDemoData() {
  const now = new Date();
  const hour = now.getHours();

  return {
    resumo: {
      receitaHoje: 2450.00 + (hour * 150),
      receitaMudanca: 12.5,
      pedidosHoje: 15 + Math.floor(hour / 2),
      pedidosMudanca: 8.3,
      tarefasAbertas: 8,
      tarefasConcluidas: 5,
      emailsNaoLidos: 12,
      emailsImportantes: 3
    },
    vendas: {
      ticketMedio: 163.33,
      totalSemana: 15234.50,
      totalMes: 62450.00,
      today: {
        labels: ['9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'],
        values: [120, 340, 580, 890, 1150, 1480, 1820, 2100, 2350, 2450]
      },
      week: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        values: [1850, 2340, 2180, 2890, 3150, 1480, 1344]
      },
      month: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        values: [12450, 15234, 18900, 15866]
      }
    },
    tarefas: {
      abertas: 8,
      concluidasHoje: 5,
      atrasadas: 2
    },
    stock: {
      totalProdutos: 342,
      valorTotal: 45230.00,
      baixoStock: [
        { produto: 'Produto A', quantidade: 3, minimo: 10 },
        { produto: 'Produto B', quantidade: 5, minimo: 15 },
        { produto: 'Produto C', quantidade: 1, minimo: 5 }
      ]
    },
    email: {
      naoLidas: 12,
      importantes: 3,
      enviadasHoje: 8,
      taxaResposta: 85
    },
    equipa: {
      presentes: 5,
      horasTrabalhadas: 32,
      membros: [
        { nome: 'Ana Silva', funcao: 'Gerente', horas: 8 },
        { nome: 'João Santos', funcao: 'Vendedor', horas: 7 },
        { nome: 'Maria Costa', funcao: 'Atendimento', horas: 6 },
        { nome: 'Pedro Alves', funcao: 'Stock', horas: 6 },
        { nome: 'Sofia Ribeiro', funcao: 'Vendedor', horas: 5 }
      ]
    }
  };
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for debugging
if (typeof window !== 'undefined') {
  window.dashboardApp = {
    state,
    loadDashboardData,
    switchSalesPeriod,
    getDemoData
  };
}
