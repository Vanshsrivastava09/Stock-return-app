const STORAGE_KEY = 'medisearch-stock-return-history';
const LEGACY_STORAGE_KEY = 'medisearch-stock-return-report';
const THEME_KEY = 'medisearch-stock-return-theme';
const INR = '\u20b9';
let toastTimer;

const fmtMoney = (n) => {
  const x = Number(n);
  return `${INR}${Number.isFinite(x) ? x.toFixed(2) : '0.00'}`;
};

const toNumber = (v) => {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const byId = (id) => document.getElementById(id);

function showToast(message, type = 'success') {
  const toast = byId('toast');
  toast.textContent = message;
  toast.classList.toggle('error', type === 'error');
  toast.classList.add('show');

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

function setToday() {
  if (!byId('dateReceived').value) {
    byId('dateReceived').valueAsDate = new Date();
  }
}

function emptyRow(kind) {
  const tr = document.createElement('tr');
  tr.className = 'empty-row';
  const colspan = kind === 'expiry' ? 8 : 7;
  const label = kind === 'expiry'
    ? 'No expiry products added. Click "Add Row" to begin.'
    : 'No goods issued yet. Click "Add Row" to begin.';
  tr.innerHTML = `<td colspan="${colspan}">${label}</td>`;
  return tr;
}

function ensureEmptyState(tbody, kind) {
  const realRows = [...tbody.querySelectorAll('tr:not(.empty-row)')];
  const existingEmpty = tbody.querySelector('.empty-row');

  if (realRows.length === 0 && !existingEmpty) {
    tbody.appendChild(emptyRow(kind));
  }

  if (realRows.length > 0 && existingEmpty) {
    existingEmpty.remove();
  }
}

function updateSno(tbody) {
  [...tbody.querySelectorAll('tr:not(.empty-row)')].forEach((tr, idx) => {
    const snoEl = tr.querySelector('[data-sno]');
    if (snoEl) snoEl.textContent = String(idx + 1);
  });
}

function recalcExpiry() {
  const tbody = byId('expiryTbody');
  let total = 0;

  for (const tr of [...tbody.querySelectorAll('tr:not(.empty-row)')]) {
    const qty = toNumber(tr.querySelector('[data-qty]')?.value);
    const mrp = toNumber(tr.querySelector('[data-mrp]')?.value);
    const amount = qty * mrp;
    tr.querySelector('[data-amount]').textContent = fmtMoney(amount);
    total += amount;
  }

  byId('expiryTotalCell').textContent = fmtMoney(total);
  byId('totalExpiryAmount').textContent = fmtMoney(total);
  recalcBalance();
}

function recalcGoods() {
  const tbody = byId('goodsTbody');
  let total = 0;

  for (const tr of [...tbody.querySelectorAll('tr:not(.empty-row)')]) {
    const qty = toNumber(tr.querySelector('[data-qty]')?.value);
    const rate = toNumber(tr.querySelector('[data-rate]')?.value);
    const amount = qty * rate;
    tr.querySelector('[data-amount]').textContent = fmtMoney(amount);
    total += amount;
  }

  byId('goodsTotalCell').textContent = fmtMoney(total);
  byId('totalGoodsAmount').textContent = fmtMoney(total);
  recalcBalance();
}

function recalcBalance() {
  const expiryTotal = totalFromRows(byId('expiryTbody'));
  const goodsTotal = totalFromRows(byId('goodsTbody'), 'rate');
  const diff = expiryTotal - goodsTotal;
  const label = byId('balanceLabel');

  byId('balanceAmount').textContent = fmtMoney(Math.abs(diff));
  label.textContent = diff === 0
    ? 'Settled - No Balance'
    : diff > 0
      ? 'Balance Receivable'
      : 'Excess Goods Given';
}

function totalFromRows(tbody, priceField = 'mrp') {
  return [...tbody.querySelectorAll('tr:not(.empty-row)')].reduce((sum, tr) => {
    const qty = toNumber(tr.querySelector('[data-qty]')?.value);
    const price = toNumber(tr.querySelector(`[data-${priceField}]`)?.value);
    return sum + qty * price;
  }, 0);
}

function removeRow(tr, kind) {
  const tbody = kind === 'expiry' ? byId('expiryTbody') : byId('goodsTbody');
  tr.remove();
  updateSno(tbody);
  ensureEmptyState(tbody, kind);
  kind === 'expiry' ? recalcExpiry() : recalcGoods();
}

function createExpiryRow(data = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td data-sno></td>
    <td><input type="text" value="${escapeAttr(data.product || '')}" placeholder="Product name" data-product class="row-input" /></td>
    <td><input type="text" value="${escapeAttr(data.batch || '')}" placeholder="Batch no" data-batch class="row-input" /></td>
    <td><input type="date" value="${escapeAttr(data.expiryDate || '')}" data-expiry-date class="row-input" /></td>
    <td><input type="number" min="0" step="0.01" value="${escapeAttr(data.qty || '')}" placeholder="0" data-qty class="row-input" /></td>
    <td><input type="number" min="0" step="0.01" value="${escapeAttr(data.mrp || '')}" placeholder="0" data-mrp class="row-input" /></td>
    <td class="amount-cell" data-amount>${INR}0.00</td>
    <td class="no-print"><button type="button" class="icon-btn" data-del aria-label="Remove row">&times;</button></td>
  `;

  tr.querySelector('[data-qty]').addEventListener('input', recalcExpiry);
  tr.querySelector('[data-mrp]').addEventListener('input', recalcExpiry);
  tr.querySelector('[data-del]').addEventListener('click', () => removeRow(tr, 'expiry'));
  return tr;
}

function createGoodsRow(data = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td data-sno></td>
    <td><input type="text" value="${escapeAttr(data.product || '')}" placeholder="Product name" data-product class="row-input" /></td>
    <td><input type="date" value="${escapeAttr(data.givenDate || '')}" data-given-date class="row-input" /></td>
    <td><input type="number" min="0" step="0.01" value="${escapeAttr(data.qty || '')}" placeholder="0" data-qty class="row-input" /></td>
    <td><input type="number" min="0" step="0.01" value="${escapeAttr(data.rate || '')}" placeholder="0" data-rate class="row-input" /></td>
    <td class="amount-cell" data-amount>${INR}0.00</td>
    <td class="no-print"><button type="button" class="icon-btn" data-del aria-label="Remove row">&times;</button></td>
  `;

  tr.querySelector('[data-qty]').addEventListener('input', recalcGoods);
  tr.querySelector('[data-rate]').addEventListener('input', recalcGoods);
  tr.querySelector('[data-del]').addEventListener('click', () => removeRow(tr, 'goods'));
  return tr;
}

function addExpiryRow(data) {
  const tbody = byId('expiryTbody');
  tbody.appendChild(createExpiryRow(data));
  ensureEmptyState(tbody, 'expiry');
  updateSno(tbody);
  recalcExpiry();
}

function addGoodsRow(data) {
  const tbody = byId('goodsTbody');
  tbody.appendChild(createGoodsRow(data));
  ensureEmptyState(tbody, 'goods');
  updateSno(tbody);
  recalcGoods();
}

function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeHtml(value) {
  return escapeAttr(value).replaceAll("'", '&#39;');
}

function collectRows(tbody, kind) {
  return [...tbody.querySelectorAll('tr:not(.empty-row)')].map((tr) => {
    if (kind === 'expiry') {
      return {
        product: tr.querySelector('[data-product]').value,
        batch: tr.querySelector('[data-batch]').value,
        expiryDate: tr.querySelector('[data-expiry-date]').value,
        qty: tr.querySelector('[data-qty]').value,
        mrp: tr.querySelector('[data-mrp]').value,
      };
    }

    return {
      product: tr.querySelector('[data-product]').value,
      givenDate: tr.querySelector('[data-given-date]').value,
      qty: tr.querySelector('[data-qty]').value,
      rate: tr.querySelector('[data-rate]').value,
    };
  });
}

function collectCurrentReport() {
  return {
    id: String(Date.now()),
    savedAt: new Date().toISOString(),
    partyName: byId('partyName').value,
    dateReceived: byId('dateReceived').value,
    refNumber: byId('refNumber').value,
    remarks: byId('remarks').value,
    expiry: collectRows(byId('expiryTbody'), 'expiry'),
    goods: collectRows(byId('goodsTbody'), 'goods'),
  };
}

function saveReport() {
  const data = collectCurrentReport();
  const reports = getSavedReports();
  reports.unshift(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  showToast('Report saved successfully.');
}

function getSavedReports() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyRaw) return [];

  try {
    const legacy = JSON.parse(legacyRaw);
    return [{ ...legacy, id: 'legacy', savedAt: new Date().toISOString() }];
  } catch {
    return [];
  }
}

function populateReport(report) {
  byId('partyName').value = report.partyName || '';
  byId('dateReceived').value = report.dateReceived || '';
  byId('refNumber').value = report.refNumber || '';
  byId('remarks').value = report.remarks || '';
  clearRows();
  (report.expiry || []).forEach(addExpiryRow);
  (report.goods || []).forEach(addGoodsRow);
  recalcExpiry();
  recalcGoods();
}

function loadReportById(id) {
  const report = getSavedReports().find((item) => item.id === id);
  if (!report) {
    showToast('Saved report could not be opened.', 'error');
    return false;
  }

  populateReport(report);
  closeHistory();
  showToast('Saved report loaded.');
  return true;
}

function printReportById(id) {
  const report = getSavedReports().find((item) => item.id === id);
  if (!report) {
    showToast('Saved report could not be opened.', 'error');
    return;
  }

  populateReport(report);
  closeHistory();
  window.setTimeout(() => window.print(), 100);
}

function deleteReportById(id) {
  const reports = getSavedReports().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  if (id === 'legacy') localStorage.removeItem(LEGACY_STORAGE_KEY);
  renderHistory();
  showToast('Saved report deleted.');
}

function reportTitle(report) {
  return report.partyName?.trim() || report.refNumber?.trim() || 'Untitled stock return';
}

function reportSearchText(report) {
  return [
    report.partyName,
    report.refNumber,
    report.remarks,
    report.dateReceived,
    ...(report.expiry || []).flatMap((item) => [item.product, item.batch]),
    ...(report.goods || []).map((item) => item.product),
  ].filter(Boolean).join(' ').toLowerCase();
}

function filteredReports() {
  const query = byId('historySearch').value.trim().toLowerCase();
  const from = byId('historyFrom').value;
  const to = byId('historyTo').value;

  return getSavedReports().filter((report) => {
    const date = report.dateReceived || '';
    const matchesText = !query || reportSearchText(report).includes(query);
    const matchesFrom = !from || (date && date >= from);
    const matchesTo = !to || (date && date <= to);
    return matchesText && matchesFrom && matchesTo;
  });
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved report';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderHistory() {
  const list = byId('historyList');
  const allReports = getSavedReports();
  const reports = filteredReports();

  if (allReports.length === 0) {
    list.innerHTML = '<div class="history-empty">No saved reports yet.</div>';
    return;
  }

  if (reports.length === 0) {
    list.innerHTML = '<div class="history-empty">No reports match these filters.</div>';
    return;
  }

  list.innerHTML = reports.map((report) => `
    <article class="history-item">
      <div>
        <div class="history-title">${escapeHtml(reportTitle(report))}</div>
        <div class="history-meta">
          ${escapeHtml(formatSavedAt(report.savedAt))}
          ${report.dateReceived ? ` &middot; Date received: ${escapeHtml(report.dateReceived)}` : ''}
          ${report.refNumber ? ` &middot; Ref: ${escapeHtml(report.refNumber)}` : ''}
        </div>
      </div>
      <div class="history-actions">
        <button type="button" class="btn btn-outline btn-small" data-load-report="${escapeAttr(report.id)}">Load</button>
        <button type="button" class="btn btn-outline btn-small" data-print-report="${escapeAttr(report.id)}">Print</button>
        <button type="button" class="btn btn-outline btn-small" data-export-report="${escapeAttr(report.id)}">Excel</button>
        <button type="button" class="btn btn-danger btn-small" data-delete-report="${escapeAttr(report.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-load-report]').forEach((btn) => {
    btn.addEventListener('click', () => loadReportById(btn.dataset.loadReport));
  });
  list.querySelectorAll('[data-print-report]').forEach((btn) => {
    btn.addEventListener('click', () => printReportById(btn.dataset.printReport));
  });
  list.querySelectorAll('[data-export-report]').forEach((btn) => {
    btn.addEventListener('click', () => exportReportById(btn.dataset.exportReport));
  });
  list.querySelectorAll('[data-delete-report]').forEach((btn) => {
    btn.addEventListener('click', () => deleteReportById(btn.dataset.deleteReport));
  });
}

function openHistory() {
  renderHistory();
  byId('historyModal').classList.add('show');
  byId('historyModal').setAttribute('aria-hidden', 'false');
}

function closeHistory() {
  byId('historyModal').classList.remove('show');
  byId('historyModal').setAttribute('aria-hidden', 'true');
}

function clearHistoryFilters() {
  byId('historySearch').value = '';
  byId('historyFrom').value = '';
  byId('historyTo').value = '';
  renderHistory();
}

function safeFileName(value) {
  return String(value || 'stock-return-report')
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'stock-return-report';
}

function excelCell(value) {
  return escapeHtml(value ?? '').replaceAll('\n', '<br>');
}

function rowsToTable(title, headers, rows) {
  const head = headers.map((item) => `<th>${excelCell(item)}</th>`).join('');
  const body = rows.length
    ? rows.map((row) => `<tr>${row.map((cell) => `<td>${excelCell(cell)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${headers.length}">No records</td></tr>`;
  return `<h3>${excelCell(title)}</h3><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function reportToWorkbook(report) {
  const expiryRows = (report.expiry || []).map((item, index) => {
    const qty = toNumber(item.qty);
    const mrp = toNumber(item.mrp);
    return [index + 1, item.product, item.batch, item.expiryDate, qty, mrp, qty * mrp];
  });
  const goodsRows = (report.goods || []).map((item, index) => {
    const qty = toNumber(item.qty);
    const rate = toNumber(item.rate);
    return [index + 1, item.product, item.givenDate, qty, rate, qty * rate];
  });
  const expiryTotal = expiryRows.reduce((sum, row) => sum + toNumber(row[6]), 0);
  const goodsTotal = goodsRows.reduce((sum, row) => sum + toNumber(row[5]), 0);
  const diff = expiryTotal - goodsTotal;

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h2>Medisearch Life Sciences - Stock Return Report</h2>
        ${rowsToTable('Party Information', ['Field', 'Value'], [
          ['Party / Customer Name', report.partyName || ''],
          ['Date Received', report.dateReceived || ''],
          ['Invoice / Reference Number', report.refNumber || ''],
          ['Remarks', report.remarks || ''],
          ['Saved At', formatSavedAt(report.savedAt)],
        ])}
        ${rowsToTable('Expiry Products Received', ['S.No', 'Product Name', 'Batch No', 'Expiry Date', 'Qty', 'MRP', 'Amount'], expiryRows)}
        ${rowsToTable('Goods Given in Exchange', ['S.No', 'Product Name', 'Given Date', 'Qty', 'Rate', 'Amount'], goodsRows)}
        ${rowsToTable('Summary', ['Metric', 'Amount'], [
          ['Total Expiry Products', expiryTotal],
          ['Total Goods Given', goodsTotal],
          [diff === 0 ? 'Settled - No Balance' : diff > 0 ? 'Balance Receivable' : 'Excess Goods Given', Math.abs(diff)],
        ])}
      </body>
    </html>`;
}

function downloadExcel(report) {
  const blob = new Blob([reportToWorkbook(report)], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFileName(reportTitle(report))}-${report.dateReceived || 'report'}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Excel report exported.');
}

function exportCurrentReport() {
  recalcExpiry();
  recalcGoods();
  downloadExcel(collectCurrentReport());
}

function exportReportById(id) {
  const report = getSavedReports().find((item) => item.id === id);
  if (!report) {
    showToast('Saved report could not be exported.', 'error');
    return;
  }
  downloadExcel(report);
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  byId('themeIcon').innerHTML = isDark ? '&#9728;' : '&#9790;';
  byId('themeText').textContent = isDark ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function clearRows() {
  byId('expiryTbody').innerHTML = '';
  byId('goodsTbody').innerHTML = '';
  ensureEmptyState(byId('expiryTbody'), 'expiry');
  ensureEmptyState(byId('goodsTbody'), 'goods');
  recalcExpiry();
  recalcGoods();
}

function resetReport(removeSaved = false) {
  byId('partyName').value = '';
  byId('dateReceived').value = '';
  byId('refNumber').value = '';
  byId('remarks').value = '';
  clearRows();
  setToday();
  if (removeSaved) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

function init() {
  byId('addExpiryRow').addEventListener('click', () => addExpiryRow());
  byId('addGoodsRow').addEventListener('click', () => addGoodsRow());
  byId('resetBtn').addEventListener('click', () => resetReport(false));
  byId('newReportBtn').addEventListener('click', () => resetReport(false));
  byId('saveBtn').addEventListener('click', saveReport);
  byId('exportBtn').addEventListener('click', exportCurrentReport);
  byId('savedBtn').addEventListener('click', openHistory);
  byId('closeHistoryBtn').addEventListener('click', closeHistory);
  byId('themeBtn').addEventListener('click', toggleTheme);
  byId('historySearch').addEventListener('input', renderHistory);
  byId('historyFrom').addEventListener('change', renderHistory);
  byId('historyTo').addEventListener('change', renderHistory);
  byId('clearFiltersBtn').addEventListener('click', clearHistoryFilters);
  byId('historyModal').addEventListener('click', (event) => {
    if (event.target === byId('historyModal')) closeHistory();
  });
  byId('printBtn').addEventListener('click', () => {
    recalcExpiry();
    recalcGoods();
    window.print();
  });

  ensureEmptyState(byId('expiryTbody'), 'expiry');
  ensureEmptyState(byId('goodsTbody'), 'goods');
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');
  setToday();
  recalcExpiry();
  recalcGoods();
}

window.addEventListener('DOMContentLoaded', init);
