// assets/js/main.js — iande Admin Panel

/* ── Chart.js Global Defaults ───────────────────────────────── */
if (typeof Chart !== 'undefined') {
  Chart.defaults.color          = '#a0aec0';
  Chart.defaults.borderColor    = 'rgba(255,255,255,0.07)';
  Chart.defaults.font.family    = "'DM Sans', sans-serif";
  Chart.defaults.font.size      = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding       = 18;
  Chart.defaults.plugins.tooltip.backgroundColor     = 'rgba(17,28,72,0.95)';
  Chart.defaults.plugins.tooltip.borderColor         = 'rgba(0,212,170,0.3)';
  Chart.defaults.plugins.tooltip.borderWidth         = 1;
  Chart.defaults.plugins.tooltip.cornerRadius        = 8;
  Chart.defaults.plugins.tooltip.padding             = 12;
  Chart.defaults.plugins.tooltip.titleColor          = '#ffffff';
  Chart.defaults.plugins.tooltip.bodyColor           = '#a0aec0';
}

/* ── Color Palettes ──────────────────────────────────────────── */
const PALETTE = {
  teal:   '#00d4aa',
  gold:   '#f6ad55',
  red:    '#fc8181',
  green:  '#68d391',
  blue:   '#63b3ed',
  purple: '#b794f4',
  orange: '#f6ad55',
};
const CATEGORY_COLORS = [
  '#00d4aa','#00b5d8','#63b3ed','#b794f4',
  '#f6ad55','#fc8181','#68d391','#4fd1c5',
  '#f687b3','#fbd38d','#9ae6b4','#90cdf4',
];

/* ── Number Formatting ───────────────────────────────────────── */
function formatMoney(n, decimals = 2) {
  return Number(n).toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ── Chart Builders ──────────────────────────────────────────── */

/**
 * Line chart – users per month
 */
function buildUsersLineChart(canvasId, labels, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'New Users',
        data,
        borderColor: PALETTE.teal,
        backgroundColor: 'rgba(0,212,170,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: PALETTE.teal,
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxRotation: 30 } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { stepSize: 1 } },
      },
      plugins: { legend: { display: false } },
    }
  });
}

/**
 * Pie chart – income vs expense
 */
function buildIncomeExpensePie(canvasId, income, expense) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['รายรับ (Income)', 'รายจ่าย (Expense)'],
      datasets: [{
        data: [income, expense],
        backgroundColor: [PALETTE.teal, PALETTE.red],
        borderColor: ['rgba(0,212,170,0.3)', 'rgba(252,129,129,0.3)'],
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => ` ฿${formatMoney(ctx.raw)}`,
          }
        }
      }
    }
  });
}

/**
 * Bar chart – expense by category
 */
function buildExpenseBarChart(canvasId, labels, data) {

  const filtered = labels.map((label, i) => ({ label, v: data[i] })).filter(x => x.v > 0);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: filtered.map(x => x.label),
      datasets: [{
        label: 'Expense Amount (฿)',
        data: filtered.map(x => x.v),
        backgroundColor: CATEGORY_COLORS.slice(0, filtered.length).map(c => c + 'cc'),
        borderColor:      CATEGORY_COLORS.slice(0, filtered.length),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          beginAtZero: true,
          ticks: { callback: v => formatMoney(v, 0) },
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ฿${formatMoney(c.raw)}` } }
      }
    }
  });
}

/**
 * Doughnut – Maslow distribution
 */
function buildMaslowChart(canvasId, labels, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const colors = ['#00d4aa','#63b3ed','#b794f4','#f6ad55','#fc8181'];
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'bb'),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 10,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: c => ` ฿${formatMoney(c.raw)}` } }
      }
    }
  });
}

/**
 * Yearly grouped bar chart – income vs expense by month
 */
function buildYearlyChart(canvasId, labels, incomeData, expenseData) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(0,212,170,0.7)',
          borderColor: PALETTE.teal,
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: 'rgba(252,129,129,0.7)',
          borderColor: PALETTE.red,
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          beginAtZero: true,
          ticks: { callback: v => '฿' + formatMoney(v, 0) }
        }
      },
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: c => ` ฿${formatMoney(c.raw)}` } }
      }
    }
  });
}

/* ── Delete Modal ─────────────────────────────────────────────── */
function initDeleteModal() {
  const overlay    = document.getElementById('deleteModal');
  const msgEl      = document.getElementById('deleteMsg');
  const titleEl    = document.getElementById('deleteTitleText');
  const iconEl     = document.getElementById('deleteIcon');
  const confirmBtn = document.getElementById('deleteConfirmBtn');
  if (!overlay) return;

  let targetUrl = '';

  document.querySelectorAll('[data-delete-url]').forEach(btn => {
    btn.addEventListener('click', () => {
      targetUrl         = btn.dataset.deleteUrl;
      msgEl.textContent = btn.dataset.deleteMsg || 'คุณแน่ใจหรือไม่ที่จะลบรายการนี้?';

      if (titleEl) titleEl.textContent = btn.dataset.modalTitle || 'Confirm Delete';
      if (iconEl)  iconEl.textContent  = btn.dataset.modalIcon  || 'delete';
      if (confirmBtn) confirmBtn.textContent = btn.dataset.confirmLabel || 'Delete';

      overlay.classList.add('open');
    });
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  document.getElementById('deleteCancelBtn')?.addEventListener('click', () => {
    overlay.classList.remove('open');
  });

  confirmBtn?.addEventListener('click', () => {
    if (targetUrl) window.location.href = targetUrl;
  });
}

/* ── Auto-dismiss Alerts ─────────────────────────────────────── */
function initAlerts() {
  document.querySelectorAll('.alert[data-auto-dismiss]').forEach(el => {
    setTimeout(() => {
      el.style.transition = 'opacity .4s ease';
      el.style.opacity    = '0';
      setTimeout(() => el.remove(), 400);
    }, parseInt(el.dataset.autoDismiss, 10) || 4000);
  });
}

/* ── Table Search ────────────────────────────────────────────── */
function initTableSearch(inputId, tableId) {
  const input = document.getElementById(inputId);
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!input || !tbody) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    tbody.querySelectorAll('tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

/* ── Current date in topbar ──────────────────────────────────── */
function renderDate() {
  const el = document.getElementById('topbarDate');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('th-TH', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

/* ── DOM Ready ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderDate();
  initDeleteModal();
  initAlerts();
});
