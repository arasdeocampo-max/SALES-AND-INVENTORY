function currentPage() {
  return location.pathname.split('/').pop() || 'login.html';
}

function getSession() {
  return readStore(STORAGE_KEYS.session, null);
}

function requireAuth() {
  const page = currentPage();
  const publicPages = ['login.html', 'signup.html'];
  if (!publicPages.includes(page) && !getSession()) {
    location.href = 'login.html';
  }
}

function renderSidebarActive() {
  const page = currentPage();
  document.querySelectorAll('.menu a').forEach((link) => {
    link.classList.toggle('active', link.dataset.page === page);
  });
  const roleBadge = document.getElementById('roleBadge');
  if (roleBadge && getSession()) roleBadge.textContent = getSession().role;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  if (window.innerWidth <= 860) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    document.querySelector('.main')?.classList.toggle('expanded');
  }
}

function showToast(type, message) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    wrap.id = 'toastWrap';
    document.body.appendChild(wrap);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  wrap.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function showModalConfirm(message, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>Confirm Action</h3>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="btn btn-muted" id="cancelBtn">Cancel</button>
        <button class="btn btn-danger" id="confirmBtn">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#cancelBtn').onclick = () => backdrop.remove();
  backdrop.querySelector('#confirmBtn').onclick = () => {
    onConfirm();
    backdrop.remove();
  };
}

function exportTableToCSV(tableId, filename = 'export.csv') {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = [...table.querySelectorAll('tr')].map((row) =>
    [...row.children].map((cell) => `"${(cell.innerText || '').replace(/"/g, '""')}"`).join(',')
  );
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function setPageTitle() {
  const el = document.getElementById('pageTitle');
  if (!el) return;
  const map = {
    'dashboard.html': 'Dashboard',
    'medicines.html': 'Medicines',
    'inventory.html': 'Inventory',
    'pos.html': 'POS',
    'reorder.html': 'Reorder List',
    'reports.html': 'Reports',
    'audit.html': 'Audit Trail'
  };
  el.textContent = map[currentPage()] || 'Pharmacy System';
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.session);
  showToast('success', 'Logged out');
  setTimeout(() => (location.href = 'login.html'), 400);
}

function medicineById(id) {
  return readStore(STORAGE_KEYS.medicines, []).find((m) => m.id === id);
}

function renderDashboard() {
  const inv = readStore(STORAGE_KEYS.inventory, []);
  const meds = readStore(STORAGE_KEYS.medicines, []);
  const sales = readStore(STORAGE_KEYS.sales, []);
  const totalStock = inv.reduce((sum, row) => sum + Number(row.stock || 0), 0);
  const lowStock = inv.filter((row) => {
    const med = medicineById(row.medicineId);
    return med && Number(row.stock) <= Number(med.reorderLevel);
  }).length;
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.ts.slice(0, 10) === today);
  const revenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);

  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('kpiMeds', meds.length);
  set('kpiStock', totalStock);
  set('kpiLow', lowStock);
  set('kpiRevenue', `₱${revenue.toFixed(2)}`);

  document.getElementById('resetDemoBtn')?.addEventListener('click', () => {
    showModalConfirm('Reset all demo data? This will erase current localStorage data.', () => {
      seedDemoData(true);
      addAudit('Reset Demo Data', 'Dashboard reset performed');
      showToast('success', 'Demo data reset complete');
      location.reload();
    });
  });
}

function renderMedicines() {
  const tableBody = document.getElementById('medTableBody');
  if (!tableBody) return;

  const draw = (query = '') => {
    const rows = readStore(STORAGE_KEYS.medicines, []).filter((m) =>
      `${m.name} ${m.barcode} ${m.shelf}`.toLowerCase().includes(query.toLowerCase())
    );
    tableBody.innerHTML = rows.map((m) => `
      <tr>
        <td>${m.name}</td><td>${m.barcode}</td><td>${m.shelf}</td><td>${m.type}</td><td>${m.classification || '-'}</td>
        <td>${m.reorderLevel}</td><td>${m.expiryDate}</td><td>₱${Number(m.price).toFixed(2)}</td>
        <td>
          <button class="btn btn-muted" onclick="editMedicine('${m.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteMedicine('${m.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  };

  window.editMedicine = (id) => {
    const med = medicineById(id);
    if (!med) return;
    ['id','name','barcode','shelf','type','classification','reorderLevel','expiryDate','price'].forEach((k) => {
      const input = document.getElementById(`med_${k}`);
      if (input) input.value = med[k];
    });
  };

  window.deleteMedicine = (id) => {
    showModalConfirm('Delete this medicine?', () => {
      writeStore(STORAGE_KEYS.medicines, readStore(STORAGE_KEYS.medicines, []).filter((m) => m.id !== id));
      writeStore(STORAGE_KEYS.inventory, readStore(STORAGE_KEYS.inventory, []).filter((i) => i.medicineId !== id));
      addAudit('Delete Medicine', id);
      showToast('success', 'Medicine deleted');
      draw(document.getElementById('searchMed').value || '');
    });
  };

  document.getElementById('searchMed')?.addEventListener('input', (e) => draw(e.target.value));

  document.getElementById('medicineForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      id: document.getElementById('med_id').value || uuid('med'),
      name: document.getElementById('med_name').value.trim(),
      barcode: document.getElementById('med_barcode').value.trim(),
      shelf: document.getElementById('med_shelf').value.trim(),
      type: document.getElementById('med_type').value,
      classification: document.getElementById('med_classification').value,
      reorderLevel: Number(document.getElementById('med_reorderLevel').value),
      expiryDate: document.getElementById('med_expiryDate').value,
      price: Number(document.getElementById('med_price').value)
    };
    if (!payload.name || !payload.barcode || !payload.classification) {
      showToast('error', 'Name, barcode, and form classification are required');
      return;
    }
    const meds = readStore(STORAGE_KEYS.medicines, []);
    const index = meds.findIndex((m) => m.id === payload.id);
    if (index >= 0) {
      meds[index] = payload;
      addAudit('Update Medicine', payload.name);
    } else {
      meds.push(payload);
      const inv = readStore(STORAGE_KEYS.inventory, []);
      inv.push({ id: uuid('inv'), medicineId: payload.id, stock: 0, lastUpdated: new Date().toISOString(), history: [] });
      writeStore(STORAGE_KEYS.inventory, inv);
      addAudit('Create Medicine', payload.name);
    }
    writeStore(STORAGE_KEYS.medicines, meds);
    e.target.reset();
    document.getElementById('med_id').value = '';
    showToast('success', 'Medicine saved');
    draw();
  });

  draw();
}

function renderInventory() {
  const tbody = document.getElementById('invTableBody');
  if (!tbody) return;

  const draw = (q = '') => {
    const inv = readStore(STORAGE_KEYS.inventory, []);
    tbody.innerHTML = inv.map((row) => {
      const med = medicineById(row.medicineId);
      if (!med) return '';
      const txt = `${med.name} ${med.barcode}`.toLowerCase();
      if (!txt.includes(q.toLowerCase())) return '';
      return `<tr><td>${med.name}</td><td>${med.barcode}</td><td>${row.stock}</td><td>${new Date(row.lastUpdated).toLocaleString()}</td></tr>`;
    }).join('');

    const select = document.getElementById('inv_medicineId');
    if (select && !select.options.length) {
      select.innerHTML = readStore(STORAGE_KEYS.medicines, []).map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
    }
  };

  document.getElementById('searchInv')?.addEventListener('input', (e) => draw(e.target.value));

  document.getElementById('inventoryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const medId = document.getElementById('inv_medicineId').value;
    const action = document.getElementById('inv_action').value;
    const qty = Number(document.getElementById('inv_qty').value);
    const note = document.getElementById('inv_note').value.trim();
    const inv = readStore(STORAGE_KEYS.inventory, []);
    const row = inv.find((i) => i.medicineId === medId);
    if (!row || qty <= 0) return showToast('error', 'Invalid inventory entry');

    if (action === 'Stock In') row.stock += qty;
    if (action === 'Stock Out') row.stock -= qty;
    if (action === 'Adjustment') row.stock = qty;
    if (row.stock < 0) return showToast('error', 'Stock cannot be negative');

    row.lastUpdated = new Date().toISOString();
    row.history.unshift({ id: uuid('mov'), type: action, qty, note, ts: row.lastUpdated });
    writeStore(STORAGE_KEYS.inventory, inv);
    addAudit('Inventory Movement', `${action} ${qty} for ${medicineById(medId)?.name}`);
    showToast('success', 'Inventory updated');
    e.target.reset();
    draw();
  });

  draw();
}

function renderPOS() {
  const form = document.getElementById('posForm');
  if (!form) return;
  const medSelect = document.getElementById('pos_medicineId');
  const barcodeInput = document.getElementById('pos_barcode');
  const qtyInput = document.getElementById('pos_qty');
  
  medSelect.innerHTML = readStore(STORAGE_KEYS.medicines, []).map((m) => `<option value="${m.id}">${m.name} (${m.type})</option>`).join('');

  let lastSale = null;

  // Barcode scanner/input handler
  barcodeInput?.addEventListener('keypress', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    
    const barcode = barcodeInput.value.trim();
    if (!barcode) return;
    
    const medicines = readStore(STORAGE_KEYS.medicines, []);
    const foundMed = medicines.find((m) => m.barcode === barcode);
    
    if (!foundMed) {
      showToast('error', 'Barcode not found');
      barcodeInput.value = '';
      return;
    }
    
    // Select the medicine in dropdown
    medSelect.value = foundMed.id;
    barcodeInput.value = '';
    
    // Focus on quantity input
    qtyInput.focus();
    qtyInput.select();
    showToast('success', `${foundMed.name} selected`);
  });

  const showReceiptModal = (sale) => {
    const receiptContent = document.getElementById('receiptContent');
    const med = medicineById(sale.medicineId);
    const today = new Date(sale.ts);
    receiptContent.innerHTML = `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #f9fbff;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 18px; font-weight: bold;">LIFE AND HEALTH PHARM</div>
          <div style="font-size: 12px; color: #6b7280;">Pharmacy Receipt</div>
        </div>
        <div style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 12px 0; margin: 12px 0; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Receipt #:</span>
            <span style="font-weight: 600;">${sale.id.slice(-8)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Date:</span>
            <span>${today.toLocaleDateString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Time:</span>
            <span>${today.toLocaleTimeString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Cashier:</span>
            <span>${sale.cashier}</span>
          </div>
        </div>
        <div style="margin: 16px 0; font-size: 13px;">
          <div style="margin-bottom: 12px;">
            <div style="font-weight: 600;">${sale.medicineName}</div>
            <div style="display: flex; justify-content: space-between; color: #6b7280; margin-top: 4px;">
              <span>${sale.qty} x ₱${(sale.total / sale.qty).toFixed(2)}</span>
              <span>₱${(sale.total / sale.qty).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding: 12px 0; margin: 12px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 600;">
            <span>Total Amount:</span>
            <span>₱${sale.total.toFixed(2)}</span>
          </div>
        </div>
        <div style="text-align: center; font-size: 11px; color: #6b7280; margin-top: 16px;">
          <div>Thank you for your purchase!</div>
          <div>Please keep this receipt for warranty purposes.</div>
        </div>
      </div>
    `;
    document.getElementById('receiptModal').style.display = 'block';
  };

  const printReceipt = (sale) => {
    const today = new Date(sale.ts);
    const receiptHTML = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .print-receipt { width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }
        .receipt-header { text-align: center; margin-bottom: 10px; }
        .pharmacy-name { font-size: 14px; font-weight: bold; }
        .receipt-type { font-size: 10px; color: #666; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .receipt-info { font-size: 11px; margin: 8px 0; line-height: 1.6; }
        .info-row { display: flex; justify-content: space-between; }
        .item-section { margin: 8px 0; }
        .item-name { font-weight: bold; }
        .item-details { font-size: 10px; color: #666; margin-top: 4px; }
        .total-section { margin: 8px 0; font-weight: bold; font-size: 13px; }
        .footer-text { text-align: center; font-size: 9px; color: #666; margin-top: 10px; line-height: 1.5; }
        .thank-you { font-weight: bold; }
      </style>
      <div class="print-receipt">
        <div class="receipt-header">
          <div class="pharmacy-name">LIFE AND HEALTH PHARM</div>
          <div class="receipt-type">Pharmacy Receipt</div>
        </div>
        <div class="divider"></div>
        <div class="receipt-info">
          <div class="info-row">
            <span>Receipt #:</span>
            <span>${sale.id.slice(-8)}</span>
          </div>
          <div class="info-row">
            <span>Date:</span>
            <span>${today.toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span>Time:</span>
            <span>${today.toLocaleTimeString()}</span>
          </div>
          <div class="info-row">
            <span>Cashier:</span>
            <span>${sale.cashier}</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="item-section">
          <div class="item-name">${sale.medicineName}</div>
          <div class="item-details">
            <div class="info-row">
              <span>${sale.qty} x ₱${(sale.total / sale.qty).toFixed(2)}</span>
              <span>₱${sale.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="total-section">
          <div class="info-row">
            <span>Total Amount:</span>
            <span>₱${sale.total.toFixed(2)}</span>
          </div>
        </div>
        <div class="footer-text">
          <div class="thank-you">Thank you for your purchase!</div>
          <div>Please keep this receipt for warranty purposes.</div>
        </div>
      </div>
    `;

    const printWindow = window.open('', 'PRINT', 'height=600,width=800');
    printWindow.document.write('<!DOCTYPE html><html><head><title>Receipt</title>');
    printWindow.document.write(receiptHTML);
    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 100);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const medId = medSelect.value;
    const qty = Number(document.getElementById('pos_qty').value);
    const hasRx = document.getElementById('pos_hasRx').value === 'yes';
    const med = medicineById(medId);
    const inv = readStore(STORAGE_KEYS.inventory, []);
    const invRow = inv.find((r) => r.medicineId === medId);
    if (!med || !invRow) return showToast('error', 'Medicine unavailable');
    if (new Date(med.expiryDate) < new Date()) return showToast('error', 'Cannot sell expired medicine');
    if (med.type === 'RX' && !hasRx) return showToast('error', 'RX medicine requires prescription');
    if (qty <= 0 || qty > invRow.stock) return showToast('error', 'Invalid quantity or not enough stock');

    invRow.stock -= qty;
    invRow.lastUpdated = new Date().toISOString();
    invRow.history.unshift({ id: uuid('mov'), type: 'POS Sale', qty, note: 'Sold via POS', ts: invRow.lastUpdated });
    writeStore(STORAGE_KEYS.inventory, inv);

    const sales = readStore(STORAGE_KEYS.sales, []);
    const total = qty * Number(med.price);
    const saleRecord = { id: uuid('sale'), medicineId: medId, medicineName: med.name, qty, total, ts: new Date().toISOString(), cashier: getSession()?.username || 'unknown' };
    sales.unshift(saleRecord);
    writeStore(STORAGE_KEYS.sales, sales);
    addAudit('POS Sale', `${med.name} x${qty}`);

    lastSale = saleRecord;
    document.getElementById('posTotal').textContent = `₱${total.toFixed(2)}`;
    document.getElementById('printReceiptBtn').style.display = 'inline-block';
    showToast('success', 'Sale completed');
    form.reset();
    barcodeInput.focus();
  });

  document.getElementById('printReceiptBtn')?.addEventListener('click', () => {
    if (lastSale) showReceiptModal(lastSale);
  });

  document.getElementById('closeReceiptBtn')?.addEventListener('click', () => {
    document.getElementById('receiptModal').style.display = 'none';
  });

  document.getElementById('confirmPrintBtn')?.addEventListener('click', () => {
    if (lastSale) {
      printReceipt(lastSale);
      document.getElementById('receiptModal').style.display = 'none';
    }
  });
}

function renderReorder() {
  const body = document.getElementById('reorderTableBody');
  if (!body) return;
  const inv = readStore(STORAGE_KEYS.inventory, []);
  const reorderRows = inv.map((i) => {
    const med = medicineById(i.medicineId);
    if (!med) return null;
    if (Number(i.stock) > Number(med.reorderLevel)) return null;
    return { name: med.name, stock: i.stock, reorderLevel: med.reorderLevel, shelf: med.shelf };
  }).filter(Boolean);
  body.innerHTML = reorderRows.map((r) => `<tr><td>${r.name}</td><td>${r.stock}</td><td>${r.reorderLevel}</td><td>${r.shelf}</td></tr>`).join('');
}

function renderReports() {
  const salesBody = document.getElementById('salesTableBody');
  if (!salesBody) return;
  const sales = readStore(STORAGE_KEYS.sales, []);
  salesBody.innerHTML = sales.map((s) => `<tr><td>${new Date(s.ts).toLocaleString()}</td><td>${s.medicineName}</td><td>${s.qty}</td><td>₱${Number(s.total).toFixed(2)}</td><td>${s.cashier}</td></tr>`).join('');
  const totalRevenue = sales.reduce((a, b) => a + Number(b.total), 0);
  document.getElementById('repRevenue').textContent = `₱${totalRevenue.toFixed(2)}`;
  document.getElementById('btnExportCSV')?.addEventListener('click', () => exportTableToCSV('salesTable', 'sales-report.csv'));
  document.getElementById('btnPrint')?.addEventListener('click', () => {
    const sales = readStore(STORAGE_KEYS.sales, []);
    const totalRevenue = sales.reduce((a, b) => a + Number(b.total), 0);
    const today = new Date();
    
    let tableRows = sales.map((s) => `
      <tr>
        <td>${new Date(s.ts).toLocaleString()}</td>
        <td>${s.medicineName}</td>
        <td>${s.qty}</td>
        <td>₱${Number(s.total).toFixed(2)}</td>
        <td>${s.cashier}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .company-name { font-size: 18px; font-weight: bold; }
          .report-title { font-size: 14px; color: #666; }
          .report-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .total-section { margin-top: 20px; text-align: right; font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="company-name">LIFE AND HEALTH PHARM</div>
          <div class="report-title">Sales Report</div>
        </div>
        <div class="report-info">
          <div>Date Range: All Sales</div>
          <div>Generated: ${today.toLocaleString()}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Medicine</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Cashier</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="total-section">
          Total Revenue: ₱${totalRevenue.toFixed(2)}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  });
}

function renderAudit() {
  const body = document.getElementById('auditTableBody');
  if (!body) return;
  const logs = readStore(STORAGE_KEYS.audit, []);
  body.innerHTML = logs.map((l) => `<tr><td>${new Date(l.ts).toLocaleString()}</td><td>${l.user}</td><td>${l.role}</td><td>${l.action}</td><td>${l.details}</td></tr>`).join('');
}

function bindAuthForms() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login_username');
      const password = document.getElementById('login_password');
      const user = readStore(STORAGE_KEYS.users, []).find((u) => u.username === username.value.trim() && u.password === password.value);
      if (!user) {
        username.classList.add('input-error');
        password.classList.add('input-error');
        showToast('error', 'Invalid credentials');
        return;
      }
      writeStore(STORAGE_KEYS.session, { id: user.id, username: user.username, role: user.role });
      addAudit('Login', `${user.username} logged in`);
      location.href = 'dashboard.html';
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('signup_username').value.trim();
      const password = document.getElementById('signup_password').value;
      const role = document.getElementById('signup_role').value;
      const users = readStore(STORAGE_KEYS.users, []);
      if (users.some((u) => u.username === username)) return showToast('error', 'Username already exists');
      users.push({ id: uuid('usr'), username, password, role });
      writeStore(STORAGE_KEYS.users, users);
      addAudit('Signup', `New ${role} account: ${username}`);
      showToast('success', 'Account created. Please login.');
      setTimeout(() => (location.href = 'login.html'), 700);
    });
  }
}

function bindGlobalActions() {
  document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
  document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
}

function initPage() {
  requireAuth();
  setPageTitle();
  renderSidebarActive();
  bindGlobalActions();
  bindAuthForms();

  const page = currentPage();
  if (page === 'dashboard.html') renderDashboard();
  if (page === 'medicines.html') renderMedicines();
  if (page === 'inventory.html') renderInventory();
  if (page === 'pos.html') renderPOS();
  if (page === 'reorder.html') renderReorder();
  if (page === 'reports.html') renderReports();
  if (page === 'audit.html') renderAudit();
}

document.addEventListener('DOMContentLoaded', initPage);