// ============================================
//  CANTIFY - Admin JavaScript
// ============================================

let adminCategories = [];
let editingItemId = null;

function getAdminItemImage(item) {
  if (typeof getItemImage === 'function') return getItemImage(item);
  return item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60';
}

// ── SECTION SWITCHER ────────────────────────
function adminSection(section, el) {
  document.querySelectorAll('[id^="admin-section-"]').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.side-btn').forEach(l => l.classList.remove('active'));

  const sec = document.getElementById('admin-section-' + section);
  if (sec) sec.style.display = '';
  if (el) el.classList.add('active');

  if (section === 'dashboard') loadAdminDashboard();
  if (section === 'menu')      loadAdminMenu();
  if (section === 'orders')    loadAdminOrders();
  if (section === 'feedback')  loadAdminFeedback();
  if (section === 'contacts')  loadAdminContacts();
}

// ── DASHBOARD ────────────────────────────────
async function loadAdminDashboard() {
  const [ordersRes, menuRes, msgRes] = await Promise.all([
    api('php/orders.php',  { query: { action: 'all_orders' } }),
    api('php/menu.php',    { query: { action: 'admin_get_all' } }),
    api('php/contact.php', { query: { action: 'get_all' } })
  ]);

  const orders = ordersRes.data || [];
  const today  = new Date().toISOString().slice(0, 10);
  const todayRevenue = orders
    .filter(o => o.created_at?.slice(0, 10) === today && o.status !== 'cancelled')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  document.getElementById('stat-orders').textContent  = orders.length;
  document.getElementById('stat-items').textContent   = (menuRes.data || []).length;
  document.getElementById('stat-revenue').textContent = '₹' + todayRevenue.toFixed(0);
  document.getElementById('stat-msgs').textContent    = (msgRes.data || []).length;
}

// ── MENU MANAGEMENT ──────────────────────────
async function loadAdminMenu() {
  const [menuRes, catsRes] = await Promise.all([
    api('php/menu.php', { query: { action: 'admin_get_all' } }),
    api('php/menu.php', { query: { action: 'get_categories' } })
  ]);

  adminCategories = catsRes.data || [];

  // Populate category dropdowns
  const catSel = document.getElementById('item-category');
  if (catSel) {
    catSel.innerHTML = '<option value="">Select category...</option>' +
      adminCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  }

  const tbody = document.getElementById('admin-menu-table');
  const items = menuRes.data || [];

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No items found. Add some!</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td>
        <img src="${getAdminItemImage(item)}"
             style="width:50px;height:50px;border-radius:8px;object-fit:cover"
             onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
      </td>
      <td><strong>${item.name}</strong><br><small style="color:var(--text-muted)">${item.description || ''}</small></td>
      <td>${item.category_name || '—'}</td>
      <td style="color:var(--accent);font-weight:600">₹${parseFloat(item.price).toFixed(2)}</td>
      <td>${item.prep_time} min</td>
      <td>
        <span class="status-badge ${item.is_available ? 'status-ready' : 'status-cancelled'}">
          ${item.is_available ? 'Available' : 'Unavailable'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-outline btn-sm" onclick="editItem(${item.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id}, '${item.name}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showAddItemForm() {
  editingItemId = null;
  document.getElementById('item-form-title').textContent  = 'Add New Item';
  document.getElementById('item-submit-btn').textContent  = 'Add Item';
  document.getElementById('item-form').reset();
  document.getElementById('avail-group').style.display    = 'none';
  document.getElementById('item-form-wrap').style.display = '';
  document.getElementById('item-form-wrap').scrollIntoView({ behavior: 'smooth' });
}

function hideItemForm() {
  document.getElementById('item-form-wrap').style.display = 'none';
  editingItemId = null;
}

async function editItem(id) {
  const res = await api('php/menu.php', { query: { action: 'admin_get_all' } });
  const item = (res.data || []).find(i => i.id == id);
  if (!item) return;

  editingItemId = id;
  document.getElementById('item-form-title').textContent  = 'Edit Item';
  document.getElementById('item-submit-btn').textContent  = 'Save Changes';
  document.getElementById('item-id').value       = item.id;
  document.getElementById('item-name').value     = item.name;
  document.getElementById('item-price').value    = item.price;
  document.getElementById('item-desc').value     = item.description || '';
  document.getElementById('item-img').value      = item.image_url || '';
  document.getElementById('item-prep').value     = item.prep_time || 10;
  document.getElementById('item-category').value = item.category_id;
  document.getElementById('item-avail').value    = item.is_available;
  document.getElementById('avail-group').style.display    = '';
  document.getElementById('item-form-wrap').style.display = '';
  document.getElementById('item-form-wrap').scrollIntoView({ behavior: 'smooth' });
}

async function handleItemSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    id:           parseInt(form.querySelector('[name=id]').value) || undefined,
    name:         form.querySelector('[name=name]').value,
    description:  form.querySelector('[name=description]').value,
    price:        form.querySelector('[name=price]').value,
    category_id:  form.querySelector('[name=category_id]').value,
    image_url:    form.querySelector('[name=image_url]').value,
    prep_time:    form.querySelector('[name=prep_time]').value,
    is_available: form.querySelector('[name=is_available]')?.value ?? 1
  };

  const action = editingItemId ? 'update' : 'add';
  const res = await api(`php/menu.php?action=${action}`, {
    method: 'POST',
    body: data
  });

  if (res.success) {
    toast(res.message, 'success');
    hideItemForm();
    loadAdminMenu();
  } else {
    toast(res.message, 'error');
  }
}

async function deleteItem(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  const res = await api('php/menu.php', { query: { action: 'delete', id } });
  if (res.success) {
    toast('Item deleted', 'success');
    loadAdminMenu();
  } else {
    toast(res.message, 'error');
  }
}

// ── ORDERS ───────────────────────────────────
async function loadAdminOrders() {
  const res = await api('php/orders.php', { query: { action: 'all_orders' } });
  const tbody = document.getElementById('admin-orders-table');
  const orders = res.data || [];

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet</td></tr>';
    return;
  }

  const statusOptions = ['pending','preparing','ready','completed','cancelled'];

  tbody.innerHTML = orders.map(o => {
    const date = new Date(o.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    return `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${o.user_name || '—'}<br><small style="color:var(--text-muted)">${o.user_email || ''}</small></td>
        <td style="max-width:200px;font-size:0.82rem">${o.items_summary || '—'}</td>
        <td style="color:var(--accent);font-weight:600">₹${parseFloat(o.total_amount).toFixed(2)}</td>
        <td>
          <select class="form-input" style="padding:6px 10px;font-size:0.8rem;width:auto"
            onchange="updateOrderStatus(${o.id}, this.value)">
            ${statusOptions.map(s => `<option value="${s}" ${s===o.status?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
          </select>
        </td>
        <td style="font-size:0.8rem;color:var(--text-secondary)">${date}</td>
        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      </tr>
    `;
  }).join('');
}

async function updateOrderStatus(id, status) {
  const res = await api('php/orders.php?action=update_status', {
    method: 'POST',
    body: { id, status }
  });
  if (res.success) {
    toast('Order status updated', 'success');
  } else {
    toast(res.message, 'error');
  }
}

// ── FEEDBACK ─────────────────────────────────
async function loadAdminFeedback() {
  const res = await api('php/feedback.php', { query: { action: 'get_all' } });
  const container = document.getElementById('admin-feedback-list');
  const feedbacks = res.data || [];

  if (!feedbacks.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon">⭐</div><h3>No feedback yet</h3></div>';
    return;
  }

  container.innerHTML = feedbacks.map(f => `
    <div class="card" style="padding:20px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <strong>${f.user_name || 'Anonymous'}</strong>
          <span style="color:var(--text-muted);font-size:0.8rem;margin-left:8px">Order #${f.order_id}</span>
        </div>
        <div style="color:#ffc846;font-size:1.2rem">${'⭐'.repeat(f.rating)}</div>
      </div>
      ${f.review ? `<p style="color:var(--text-secondary);font-size:0.9rem">"${f.review}"</p>` : ''}
      <div style="color:var(--text-muted);font-size:0.78rem;margin-top:8px">
        ${new Date(f.created_at).toLocaleDateString()}
      </div>
    </div>
  `).join('');
}

// ── CONTACTS ─────────────────────────────────
async function loadAdminContacts() {
  const res = await api('php/contact.php', { query: { action: 'get_all' } });
  const tbody = document.getElementById('admin-contacts-table');
  const msgs = res.data || [];

  if (!msgs.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">No messages yet</td></tr>';
    return;
  }

  tbody.innerHTML = msgs.map(m => `
    <tr>
      <td><strong>${m.name}</strong></td>
      <td style="color:var(--accent)">${m.email}</td>
      <td style="max-width:300px;font-size:0.88rem">${m.message}</td>
      <td style="font-size:0.8rem;color:var(--text-secondary)">${new Date(m.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

// ── INIT ADMIN IF ON PAGE ────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auto-load dashboard when admin page becomes active
  const observer = new MutationObserver(() => {
    const adminPage = document.getElementById('page-admin');
    if (adminPage?.classList.contains('active')) {
      loadAdminDashboard();
      loadAdminMenu();
    }
  });

  const adminPage = document.getElementById('page-admin');
  if (adminPage) {
    observer.observe(adminPage, { attributes: true, attributeFilter: ['class'] });
  }
});
