const STORAGE_KEYS = {
  users: 'pi_users',
  session: 'pi_session',
  medicines: 'pi_medicines',
  inventory: 'pi_inventory',
  sales: 'pi_sales',
  audit: 'pi_audit'
};

function readStore(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uuid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function addAudit(action, details = '') {
  const logs = readStore(STORAGE_KEYS.audit, []);
  const session = readStore(STORAGE_KEYS.session, null);
  logs.unshift({
    id: uuid('aud'),
    ts: new Date().toISOString(),
    user: session?.username || 'System',
    role: session?.role || 'System',
    action,
    details
  });
  writeStore(STORAGE_KEYS.audit, logs.slice(0, 500));
}

function getInventoryMap() {
  const inv = readStore(STORAGE_KEYS.inventory, []);
  return inv.reduce((acc, item) => {
    acc[item.medicineId] = item;
    return acc;
  }, {});
}

function seedDemoData(force = false) {
  const hasUsers = readStore(STORAGE_KEYS.users, []).length;
  if (!force && hasUsers) return;

  const users = [
    { id: uuid('usr'), username: 'admin', password: 'admin123', role: 'Admin' },
    { id: uuid('usr'), username: 'staff', password: 'staff123', role: 'Staff' }
  ];

  const medicines = [
    { id: uuid('med'), name: 'Paracetamol 500mg', barcode: '480000111001', shelf: 'A1', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 20, expiryDate: '2027-01-15', price: 3.5 },
    { id: uuid('med'), name: 'Amoxicillin 500mg', barcode: '480000111002', shelf: 'B4', type: 'RX', classification: 'Capsule', reorderLevel: 15, expiryDate: '2026-07-22', price: 12.0 },
    { id: uuid('med'), name: 'Cetirizine 10mg', barcode: '480000111003', shelf: 'A3', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 25, expiryDate: '2026-11-30', price: 6.5 },
    { id: uuid('med'), name: 'Losartan 50mg', barcode: '480000111004', shelf: 'C2', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 10, expiryDate: '2025-12-15', price: 18.25 },
    { id: uuid('med'), name: 'Ibuprofen 400mg', barcode: '480000111005', shelf: 'A2', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 30, expiryDate: '2027-06-10', price: 4.75 },
    { id: uuid('med'), name: 'Cough Syrup', barcode: '480000111006', shelf: 'D1', type: 'OTC', classification: 'Syrup', reorderLevel: 18, expiryDate: '2026-12-05', price: 8.50 },
    { id: uuid('med'), name: 'Metformin 500mg', barcode: '480000111007', shelf: 'B2', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 22, expiryDate: '2026-08-20', price: 5.99 },
    { id: uuid('med'), name: 'Omeprazole 20mg', barcode: '480000111008', shelf: 'B1', type: 'RX', classification: 'Capsule', reorderLevel: 16, expiryDate: '2026-09-30', price: 14.50 },
    { id: uuid('med'), name: 'Aspirin 500mg', barcode: '480000111009', shelf: 'A4', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 28, expiryDate: '2027-02-14', price: 3.25 },
    { id: uuid('med'), name: 'Lisinopril 10mg', barcode: '480000111010', shelf: 'C1', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 12, expiryDate: '2026-10-15', price: 9.75 },
    { id: uuid('med'), name: 'Fluoxetine 20mg', barcode: '480000111011', shelf: 'B3', type: 'RX', classification: 'Capsule', reorderLevel: 14, expiryDate: '2026-07-08', price: 16.00 },
    { id: uuid('med'), name: 'Atorvastatin 10mg', barcode: '480000111012', shelf: 'C3', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 15, expiryDate: '2026-11-22', price: 11.25 },
    { id: uuid('med'), name: 'Vitamin C 500mg', barcode: '480000111013', shelf: 'A5', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 35, expiryDate: '2027-03-30', price: 2.50 },
    { id: uuid('med'), name: 'Multivitamin Syrup', barcode: '480000111014', shelf: 'D2', type: 'OTC', classification: 'Syrup', reorderLevel: 20, expiryDate: '2026-10-10', price: 7.99 },
    { id: uuid('med'), name: 'Insulin Vial', barcode: '480000111015', shelf: 'E1', type: 'RX', classification: 'Vial', reorderLevel: 8, expiryDate: '2026-06-30', price: 45.00 },
    { id: uuid('med'), name: 'Antibiotics Injection', barcode: '480000111016', shelf: 'E2', type: 'RX', classification: 'Injection', reorderLevel: 10, expiryDate: '2026-08-12', price: 22.50 },
    { id: uuid('med'), name: 'Antihistamine Cream', barcode: '480000111017', shelf: 'F1', type: 'OTC', classification: 'Cream/Ointment', reorderLevel: 12, expiryDate: '2026-12-20', price: 6.75 },
    { id: uuid('med'), name: 'Antibiotic Ointment', barcode: '480000111018', shelf: 'F2', type: 'OTC', classification: 'Cream/Ointment', reorderLevel: 18, expiryDate: '2027-01-05', price: 5.50 },
    { id: uuid('med'), name: 'Cimetidine 200mg', barcode: '480000111019', shelf: 'B5', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 20, expiryDate: '2026-09-18', price: 7.25 },
    { id: uuid('med'), name: 'Ranitidine 150mg', barcode: '480000111020', shelf: 'B6', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 14, expiryDate: '2026-08-25', price: 8.99 },
    { id: uuid('med'), name: 'Mebendazole 100mg', barcode: '480000111021', shelf: 'A6', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 16, expiryDate: '2026-11-08', price: 4.50 },
    { id: uuid('med'), name: 'Albendazole 400mg', barcode: '480000111022', shelf: 'A7', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 18, expiryDate: '2026-10-30', price: 5.75 },
    { id: uuid('med'), name: 'Diclofenac 50mg', barcode: '480000111023', shelf: 'C4', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 20, expiryDate: '2026-09-15', price: 6.25 },
    { id: uuid('med'), name: 'Naproxen 250mg', barcode: '480000111024', shelf: 'A8', type: 'OTC', classification: 'Tablet/Capsule', reorderLevel: 22, expiryDate: '2026-12-01', price: 5.50 },
    { id: uuid('med'), name: 'Domperidone 10mg', barcode: '480000111025', shelf: 'B7', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 14, expiryDate: '2026-08-18', price: 7.99 },
    { id: uuid('med'), name: 'Metoclopramide 10mg', barcode: '480000111026', shelf: 'B8', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 12, expiryDate: '2026-07-25', price: 8.50 },
    { id: uuid('med'), name: 'Ondansetron 4mg', barcode: '480000111027', shelf: 'B9', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 10, expiryDate: '2026-09-12', price: 15.75 },
    { id: uuid('med'), name: 'Promethazine 25mg', barcode: '480000111028', shelf: 'B10', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 13, expiryDate: '2026-10-05', price: 9.25 },
    { id: uuid('med'), name: 'Losartan+HCTZ', barcode: '480000111029', shelf: 'C5', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 11, expiryDate: '2026-06-20', price: 19.50 },
    { id: uuid('med'), name: 'Amlodipine 5mg', barcode: '480000111030', shelf: 'C6', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 15, expiryDate: '2026-11-15', price: 10.00 },
    { id: uuid('med'), name: 'Atenolol 50mg', barcode: '480000111031', shelf: 'C7', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 12, expiryDate: '2026-12-12', price: 8.75 },
    { id: uuid('med'), name: 'Verapamil 40mg', barcode: '480000111032', shelf: 'C8', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 10, expiryDate: '2026-09-08', price: 12.50 },
    { id: uuid('med'), name: 'Simvastatin 20mg', barcode: '480000111033', shelf: 'C9', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 14, expiryDate: '2026-10-22', price: 11.75 },
    { id: uuid('med'), name: 'Pravastatin 10mg', barcode: '480000111034', shelf: 'C10', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 13, expiryDate: '2026-08-30', price: 10.50 },
    { id: uuid('med'), name: 'Glipizide 5mg', barcode: '480000111035', shelf: 'D3', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 11, expiryDate: '2026-07-14', price: 9.99 },
    { id: uuid('med'), name: 'Gliclazide 80mg', barcode: '480000111036', shelf: 'D4', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 12, expiryDate: '2026-09-25', price: 8.25 },
    { id: uuid('med'), name: 'Acarbose 50mg', barcode: '480000111037', shelf: 'D5', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 10, expiryDate: '2026-11-03', price: 14.00 },
    { id: uuid('med'), name: 'Miglitol 25mg', barcode: '480000111038', shelf: 'D6', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 9, expiryDate: '2026-10-18', price: 13.50 },
    { id: uuid('med'), name: 'Pioglitazone 15mg', barcode: '480000111039', shelf: 'D7', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 8, expiryDate: '2026-08-08', price: 16.75 },
    { id: uuid('med'), name: 'Rosiglitazone 4mg', barcode: '480000111040', shelf: 'D8', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 8, expiryDate: '2026-07-30', price: 17.25 },
    { id: uuid('med'), name: 'Albuterol Inhaler', barcode: '480000111041', shelf: 'E3', type: 'RX', classification: 'Medical Equipment', reorderLevel: 15, expiryDate: '2026-05-15', price: 28.00 },
    { id: uuid('med'), name: 'Fluticasone Inhaler', barcode: '480000111042', shelf: 'E4', type: 'RX', classification: 'Medical Equipment', reorderLevel: 12, expiryDate: '2026-06-10', price: 35.50 },
    { id: uuid('med'), name: 'Ipratropium Inhaler', barcode: '480000111043', shelf: 'E5', type: 'RX', classification: 'Medical Equipment', reorderLevel: 10, expiryDate: '2026-07-20', price: 32.00 },
    { id: uuid('med'), name: 'Sertraline 50mg', barcode: '480000111044', shelf: 'D9', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 14, expiryDate: '2026-09-05', price: 15.50 },
    { id: uuid('med'), name: 'Paroxetine 20mg', barcode: '480000111045', shelf: 'D10', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 12, expiryDate: '2026-10-12', price: 14.75 },
    { id: uuid('med'), name: 'Citalopram 20mg', barcode: '480000111046', shelf: 'D11', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 13, expiryDate: '2026-08-28', price: 13.25 },
    { id: uuid('med'), name: 'Escitalopram 10mg', barcode: '480000111047', shelf: 'D12', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 11, expiryDate: '2026-11-10', price: 14.50 },
    { id: uuid('med'), name: 'Amitriptyline 25mg', barcode: '480000111048', shelf: 'D13', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 12, expiryDate: '2026-09-22', price: 7.50 },
    { id: uuid('med'), name: 'Doxepin 10mg', barcode: '480000111049', shelf: 'D14', type: 'RX', classification: 'Capsule', reorderLevel: 10, expiryDate: '2026-07-18', price: 8.99 },
    { id: uuid('med'), name: 'Imipramine 25mg', barcode: '480000111050', shelf: 'D15', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 9, expiryDate: '2026-10-25', price: 7.75 },
    { id: uuid('med'), name: 'Chlorpromazine 100mg', barcode: '480000111051', shelf: 'E6', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 8, expiryDate: '2026-08-15', price: 6.50 },
    { id: uuid('med'), name: 'Haloperidol 5mg', barcode: '480000111052', shelf: 'E7', type: 'RX', classification: 'Tablet/Capsule', reorderLevel: 9, expiryDate: '2026-09-30', price: 7.99 }
  ];

  const inventory = medicines.map((m, idx) => {
    const stockLevels = [45, 22, 60, 9, 35, 28, 42, 31, 55, 19, 38, 26, 50, 24, 12, 18, 15, 32, 41, 20, 37, 29, 44, 33, 25, 21, 14, 27, 16, 39, 36, 23, 48, 30, 17, 40, 13, 28, 52, 34, 43, 20, 38, 25, 19, 11, 26, 33, 15, 47, 22, 29];
    return {
      id: uuid('inv'),
      medicineId: m.id,
      stock: stockLevels[idx] || Math.floor(Math.random() * 60) + 5,
      lastUpdated: new Date().toISOString(),
      history: [
        { id: uuid('mov'), type: 'Stock In', qty: 10, note: 'Initial load', ts: new Date().toISOString() }
      ]
    };
  });

  writeStore(STORAGE_KEYS.users, users);
  writeStore(STORAGE_KEYS.medicines, medicines);
  writeStore(STORAGE_KEYS.inventory, inventory);
  writeStore(STORAGE_KEYS.sales, []);
  writeStore(STORAGE_KEYS.audit, []);
  localStorage.removeItem(STORAGE_KEYS.session);

  addAudit('Seed Data', 'Demo data initialized');
}

seedDemoData(false);