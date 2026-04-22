const STORAGE = {
  admin: 'portal_admin_v1',
  auth: 'portal_auth_v1',
  items: 'portal_items_v1',
};

const el = {
  email: document.getElementById('email'),
  passphrase: document.getElementById('passphrase'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  authStatus: document.getElementById('authStatus'),
  adminCard: document.getElementById('adminCard'),
  itemName: document.getElementById('itemName'),
  sku: document.getElementById('sku'),
  price: document.getElementById('price'),
  stock: document.getElementById('stock'),
  description: document.getElementById('description'),
  imageUpload: document.getElementById('imageUpload'),
  addBtn: document.getElementById('addBtn'),
  clearBtn: document.getElementById('clearBtn'),
  inventoryRows: document.getElementById('inventoryRows'),
  filterText: document.getElementById('filterText'),
};

let uploadedImageBase64 = '';

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sanitizeText(text, maxLen = 200) {
  return String(text || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function getItems() {
  return safeParse(STORAGE.items, []);
}

function setItems(items) {
  saveJSON(STORAGE.items, items);
}

function isAuthenticated() {
  return safeParse(STORAGE.auth, { ok: false }).ok === true;
}

function setAuth(ok) {
  saveJSON(STORAGE.auth, { ok, ts: Date.now() });
}

function setStatus(msg, ok = false) {
  el.authStatus.textContent = msg;
  el.authStatus.className = `status ${ok ? 'ok' : 'warn'}`;
}

function renderInventory() {
  const filter = sanitizeText(el.filterText.value || '', 100).toLowerCase();
  const rows = getItems()
    .filter(item => {
      if (!filter) return true;
      return item.name.toLowerCase().includes(filter) || item.sku.toLowerCase().includes(filter);
    })
    .map(item => `
      <tr>
        <td>${item.image ? `<img class="preview" src="${item.image}" alt="${item.name} image"/>` : '-'}</td>
        <td>${item.name}<div class="small">${item.description || ''}</div></td>
        <td>${item.sku}</td>
        <td>
          <input type="number" min="0" step="0.01" value="${item.price.toFixed(2)}" data-action="price" data-id="${item.id}" ${isAuthenticated() ? '' : 'disabled'} />
        </td>
        <td>
          <input type="number" min="0" step="1" value="${item.stock}" data-action="stock" data-id="${item.id}" ${isAuthenticated() ? '' : 'disabled'} />
        </td>
        <td>
          <button class="danger" data-action="delete" data-id="${item.id}" ${isAuthenticated() ? '' : 'disabled'}>Delete</button>
        </td>
      </tr>`)
    .join('');

  el.inventoryRows.innerHTML = rows || '<tr><td colspan="6">No inventory items yet.</td></tr>';
}

function updateAuthUI() {
  const ok = isAuthenticated();
  el.adminCard.classList.toggle('hidden', !ok);
  setStatus(ok ? 'Authenticated. Admin controls unlocked.' : 'Not authenticated.', ok);
  renderInventory();
}

async function handleAuth() {
  const email = sanitizeText(el.email.value, 120).toLowerCase();
  const pass = el.passphrase.value || '';

  if (!email || !pass || pass.length < 10) {
    setStatus('Use a valid email and passphrase (min 10 chars).');
    return;
  }

  const storedAdmin = safeParse(STORAGE.admin, null);
  const passHash = await sha256(pass);

  if (!storedAdmin) {
    saveJSON(STORAGE.admin, { email, passHash, createdAt: Date.now() });
    setAuth(true);
    setStatus('Admin initialized and signed in.', true);
    updateAuthUI();
    return;
  }

  const ok = storedAdmin.email === email && storedAdmin.passHash === passHash;
  if (!ok) {
    setAuth(false);
    setStatus('Invalid credentials. Access denied.');
    updateAuthUI();
    return;
  }

  setAuth(true);
  setStatus('Welcome back. Signed in.', true);
  updateAuthUI();
}

function clearForm() {
  el.itemName.value = '';
  el.sku.value = '';
  el.price.value = '';
  el.stock.value = '';
  el.description.value = '';
  el.imageUpload.value = '';
  uploadedImageBase64 = '';
}

function validateImage(file) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  const maxSize = 2 * 1024 * 1024;
  if (!file) return 'Choose an image file.';
  if (!allowed.includes(file.type)) return 'Only PNG, JPEG, and WEBP files are allowed.';
  if (file.size > maxSize) return 'Image must be 2MB or smaller.';
  return '';
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Image read failed.'));
    reader.readAsDataURL(file);
  });
}

async function addInventoryItem() {
  if (!isAuthenticated()) {
    setStatus('Sign in before editing inventory.');
    return;
  }

  const name = sanitizeText(el.itemName.value, 80);
  const sku = sanitizeText(el.sku.value, 40).toUpperCase();
  const price = Number(el.price.value);
  const stock = Number(el.stock.value);
  const description = sanitizeText(el.description.value, 500);

  if (!name || !sku || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    setStatus('Enter valid item name, SKU, price, and stock.');
    return;
  }

  const items = getItems();
  if (items.some(item => item.sku === sku)) {
    setStatus('SKU already exists. Use a unique SKU.');
    return;
  }

  items.push({
    id: crypto.randomUUID(),
    name,
    sku,
    price,
    stock,
    description,
    image: uploadedImageBase64,
    updatedAt: Date.now(),
  });

  setItems(items);
  clearForm();
  setStatus('Inventory item added.', true);
  renderInventory();
}

function updateItem(id, field, value) {
  if (!isAuthenticated()) {
    setStatus('Sign in before editing inventory.');
    renderInventory();
    return;
  }

  const items = getItems();
  const item = items.find(it => it.id === id);
  if (!item) return;

  if (field === 'price') {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      setStatus('Invalid price value.');
      renderInventory();
      return;
    }
    item.price = num;
  }

  if (field === 'stock') {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0) {
      setStatus('Invalid stock value.');
      renderInventory();
      return;
    }
    item.stock = num;
  }

  item.updatedAt = Date.now();
  setItems(items);
  setStatus('Item updated.', true);
  renderInventory();
}

function deleteItem(id) {
  if (!isAuthenticated()) {
    setStatus('Sign in before deleting items.');
    return;
  }
  const filtered = getItems().filter(item => item.id !== id);
  setItems(filtered);
  setStatus('Item deleted.', true);
  renderInventory();
}

el.loginBtn.addEventListener('click', handleAuth);
el.logoutBtn.addEventListener('click', () => {
  setAuth(false);
  setStatus('Signed out.');
  updateAuthUI();
});
el.addBtn.addEventListener('click', addInventoryItem);
el.clearBtn.addEventListener('click', clearForm);
el.filterText.addEventListener('input', renderInventory);

el.imageUpload.addEventListener('change', async () => {
  const file = el.imageUpload.files && el.imageUpload.files[0];
  if (!file) {
    uploadedImageBase64 = '';
    return;
  }

  const validationError = validateImage(file);
  if (validationError) {
    setStatus(validationError);
    el.imageUpload.value = '';
    uploadedImageBase64 = '';
    return;
  }

  try {
    uploadedImageBase64 = await loadImage(file);
    setStatus('Image loaded successfully.', true);
  } catch {
    setStatus('Image processing failed.');
    uploadedImageBase64 = '';
  }
});

el.inventoryRows.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'delete' && id) {
    deleteItem(id);
  }
});

el.inventoryRows.addEventListener('change', event => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if ((action === 'price' || action === 'stock') && id) {
    updateItem(id, action, target.value);
  }
});

updateAuthUI();
renderInventory();
