// ============================================
//  CANTIFY — main.js  (Sizzle redesign)
// ============================================

const state = { user: null, cart: [], page: 'home' };
const menuImageMap = {
  'bread pakoda': 'assets/images/breadpakoda.jpeg',
  'poha': 'assets/images/poha.jpeg',
  'choco waffle': 'assets/images/chocowaffle.jpeg',
  'fruit waffle': 'assets/images/fruitwaffle.jpeg',
  'fresh lime soda': 'assets/images/freshlimesoda.jpeg',
  'veg puff': 'assets/images/vegfuff.jpeg',
  'mango shake': 'assets/images/mangoshake.jpeg'
};

/* ── API ──────────────────────────────────── */
async function api(endpoint, opts = {}) {
  try {
    const url = new URL(endpoint, location.href);
    if (opts.query) Object.entries(opts.query).forEach(([k,v]) => url.searchParams.set(k,v));
    const fetchOpts = { method: opts.method || 'GET' };
    if (opts.body) {
      if (opts.body instanceof FormData) { fetchOpts.body = opts.body; }
      else { fetchOpts.headers = {'Content-Type':'application/json'}; fetchOpts.body = JSON.stringify(opts.body); }
      fetchOpts.method = opts.method || 'POST';
    }
    const res = await fetch(url, fetchOpts);
    return await res.json();
  } catch(e) { return { success:false, message:'Network error' }; }
}

/* ── TOAST ────────────────────────────────── */
function toast(msg, type = 'success') {
  const icons = {success:'✓', error:'✕', info:'ℹ'};
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.animation='toast-in .3s ease reverse forwards'; setTimeout(()=>el.remove(),300); }, 3000);
}

/* ── PAGE NAVIGATION ────────────────────────── */
function showPage(id) {
  if (id === 'admin' && state.user?.role !== 'admin') {
    toast('Admin access required', 'error');
    id = 'home';
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) { pg.classList.add('active'); state.page = id; window.scrollTo({top:0,behavior:'smooth'}); }
  document.querySelectorAll('[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === id));
  applyRoleLayout(id);
  if (id === 'menu')   loadMenu();
  if (id === 'orders') loadOrders();
  if (id === 'cart')   renderCart();
  if (id === 'admin')  { setTimeout(()=>loadAdminDashboard(),100); }
  document.dispatchEvent(new Event('page-changed'));
}

/* ── AUTH ───────────────────────────────────── */
async function checkAuth() {
  const res = await api('php/auth.php', { query: { action:'check' } });
  if (res.success) { state.user = res.data; bootUI(); }
  else { showPage('auth'); }
}

function bootUI() {
  document.getElementById('navbar').style.display = '';
  document.getElementById('site-footer').style.display = '';
  const name = state.user.name || state.user.email;
  document.getElementById('nav-name').textContent = name.split(' ')[0];
  document.getElementById('nav-avatar').textContent = name[0].toUpperCase();
  loadCartFromStorage();
  const defaultPage = state.user.role === 'admin' ? 'admin' : 'home';
  showPage(defaultPage);
}

function applyRoleLayout(pageId = state.page) {
  const isAdmin = state.user?.role === 'admin';
  const navbar = document.getElementById('navbar');
  const footer = document.getElementById('site-footer');
  const cartBtn = document.querySelector('.nav-cart');
  const snackCart = document.getElementById('snack-cart');
  const navLinks = document.querySelectorAll('.nav-links [data-page]');

  if (navbar) navbar.style.display = pageId === 'auth' ? 'none' : '';
  if (footer) footer.style.display = pageId === 'auth' ? 'none' : '';

  // Keep header visible for admin, but hide cart controls.
  if (cartBtn) cartBtn.style.display = isAdmin ? 'none' : '';
  if (snackCart && isAdmin) snackCart.classList.remove('show');

  const hiddenForAdmin = new Set(['home', 'menu', 'orders', 'about', 'contact', 'admin']);
  navLinks.forEach((link) => {
    const page = link.dataset.page;
    const li = link.closest('li');
    if (!li) return;
    li.style.display = isAdmin && hiddenForAdmin.has(page) ? 'none' : '';
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('login-err');
  errEl.classList.remove('show');
  const fd = new FormData(); fd.append('action','login');
  fd.append('email', e.target.querySelector('[name=email]').value);
  fd.append('password', e.target.querySelector('[name=password]').value);
  const res = await api('php/auth.php', { body: fd });
  if (res.success) { state.user = res.data; toast(`Welcome, ${res.data.name}! 🎉`); bootUI(); }
  else { errEl.textContent = res.message; errEl.classList.add('show'); }
}

async function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('reg-err');
  errEl.classList.remove('show');
  const fd = new FormData(); fd.append('action','register');
  ['name','email','password'].forEach(k => fd.append(k, e.target.querySelector(`[name=${k}]`).value));
  const res = await api('php/auth.php', { body: fd });
  if (res.success) { state.user = res.data; toast('Account created! Welcome 🎉'); bootUI(); }
  else { errEl.textContent = res.message; errEl.classList.add('show'); }
}

async function logout() {
  await api('php/auth.php', { query: { action:'logout' } });
  state.user = null; state.cart = [];
  localStorage.removeItem('cantify_cart');
  document.getElementById('navbar').style.display = 'none';
  document.getElementById('site-footer').style.display = 'none';
  showPage('auth'); updateCartUI();
}

/* ── CANTEEN STATUS ─────────────────────────── */
function updateCanteenStatus() {
  const now = new Date(), m = now.getHours()*60 + now.getMinutes();
  const open = m >= 480 && m < 1200;
  document.querySelectorAll('.canteen-pill').forEach(el => {
    el.className = `live-status ${open?'open':'closed'} canteen-pill`;
    el.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:currentColor;animation:pulsedot 2s infinite;display:inline-block;flex-shrink:0"></span> ${open?'Canteen Open':'Canteen Closed'}`;
  });
}

/* ── MENU ───────────────────────────────────── */
let allMenuItems = [], activeCategory = 'all';

async function loadMenu() {
  const grid = document.getElementById('menu-grid');
  grid.innerHTML = '<div class="loading-box" style="grid-column:1/-1"><div class="spin"></div><span>Loading menu…</span></div>';
  const [iR, cR] = await Promise.all([
    api('php/menu.php', {query:{action:'get_all'}}),
    api('php/menu.php', {query:{action:'get_categories'}})
  ]);
  if (!iR.success) { grid.innerHTML='<div class="empty-box" style="grid-column:1/-1"><div class="ei">😕</div><h3>Failed to load</h3></div>'; return; }
  allMenuItems = iR.data || [];
  buildCats(cR.data || []);
  filterAndRenderMenu('all');
}

function buildCats(cats) {
  const bar = document.getElementById('cat-bar');
  bar.innerHTML = `<button class="cat-btn active" onclick="filterAndRenderMenu('all',this)">🍽️ All</button>`;
  cats.forEach(c => { bar.innerHTML += `<button class="cat-btn" onclick="filterAndRenderMenu('${c.id}',this)">${c.icon} ${c.name}</button>`; });
}

function filterAndRenderMenu(catId, btn) {
  activeCategory = catId;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const items = catId === 'all' ? allMenuItems : allMenuItems.filter(i => i.category_id == catId);
  renderMenuGrid(items);
}

function renderMenuGrid(items) {
  const grid = document.getElementById('menu-grid');
  if (!items.length) {
    grid.innerHTML = '<div class="empty-box" style="grid-column:1/-1"><div class="ei">🍽️</div><h3>No items found</h3><p>Try another category</p></div>';
    return;
  }
  grid.innerHTML = items.map(item => {
    const imageSrc = getItemImage(item);
    const inCart = state.cart.find(c => c.id == item.id);
    const qty = inCart ? inCart.quantity : 0;
    return `<div class="food-card" id="fc-${item.id}">
      <div class="fc-thumb">
        <img src="${imageSrc}" class="fc-img" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'">
        <span class="fc-cat-tag">${item.category_icon||'🍽️'}</span>
        <span class="fc-time">⏱ ${item.prep_time}m</span>
      </div>
      <div class="fc-body">
        <div class="fc-name">${item.name}</div>
        <div class="fc-desc">${item.description||'Fresh and made to order.'}</div>
        <div class="fc-foot">
          <span class="fc-price">₹${parseFloat(item.price).toFixed(2)}</span>
          ${qty > 0
            ? `<div class="qty-row"><button class="qb" onclick="changeQty(${item.id},-1)">−</button><span class="qn" id="qn-${item.id}">${qty}</span><button class="qb" onclick="changeQty(${item.id},1)">+</button></div>`
            : `<button class="add-btn" onclick="addToCart(${item.id})">＋ Add</button>`
          }
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── CART OPERATIONS ───────────────────────── */
function loadCartFromStorage() {
  const s = localStorage.getItem('cantify_cart');
  if (s) state.cart = JSON.parse(s);
  updateCartUI();
}
function saveCart() { localStorage.setItem('cantify_cart', JSON.stringify(state.cart)); updateCartUI(); }

function addToCart(itemId) {
  const item = allMenuItems.find(i => i.id == itemId);
  if (!item) return;
  const ex = state.cart.find(c => c.id == itemId);
  if (ex) ex.quantity++; else state.cart.push({...item, quantity:1});
  saveCart();
  toast(`${item.name} added to cart 🎉`);
  const card = document.getElementById('fc-' + itemId);
  if (card) {
    const foot = card.querySelector('.fc-foot');
    const price = foot.querySelector('.fc-price');
    foot.innerHTML = `${price.outerHTML}<div class="qty-row"><button class="qb" onclick="changeQty(${itemId},-1)">−</button><span class="qn" id="qn-${itemId}">1</span><button class="qb" onclick="changeQty(${itemId},1)">+</button></div>`;
  }
}

function changeQty(itemId, delta) {
  const idx = state.cart.findIndex(c => c.id == itemId);
  if (idx === -1) return;
  state.cart[idx].quantity += delta;
  if (state.cart[idx].quantity <= 0) {
    state.cart.splice(idx, 1);
    const card = document.getElementById('fc-' + itemId);
    if (card) {
      const foot = card.querySelector('.fc-foot');
      const price = foot?.querySelector('.fc-price');
      if (price) foot.innerHTML = `${price.outerHTML}<button class="add-btn" onclick="addToCart(${itemId})">＋ Add</button>`;
    }
  } else {
    const el = document.getElementById('qn-' + itemId);
    if (el) el.textContent = state.cart[idx].quantity;
  }
  saveCart();
  if (state.page === 'cart') renderCart();
}

function updateCartUI() {
  const total = state.cart.reduce((s,i) => s + i.quantity, 0);
  const price = state.cart.reduce((s,i) => s + i.price * i.quantity, 0);
  document.querySelectorAll('.cart-badge').forEach(el => el.textContent = total);
  const bar = document.getElementById('snack-cart');
  if (total > 0) {
    bar.classList.add('show');
    document.getElementById('snack-count').textContent = `${total} item${total>1?'s':''}`;
    document.getElementById('snack-total').textContent = `₹${price.toFixed(2)}`;
  } else {
    bar.classList.remove('show');
  }
}

function renderCart() {
  const listEl = document.getElementById('cart-list');
  const sumEl  = document.getElementById('cart-summary');
  if (!state.cart.length) {
    listEl.innerHTML = `<div class="empty-box"><div class="ei">🛒</div><h3>Cart is empty</h3><p>Add items from the menu to get started</p><br><button class="btn btn-fire" onclick="showPage('menu')">Browse Menu</button></div>`;
    sumEl.innerHTML = ''; return;
  }
  const sub = state.cart.reduce((s,i) => s + i.price * i.quantity, 0);
  const tax = sub * 0.05, grand = sub + tax;
  listEl.innerHTML = state.cart.map(item => `
    <div class="cart-row">
      <img src="${getItemImage(item)}" class="cr-img" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=140'">
      <div class="cr-info"><div class="cr-name">${item.name}</div><div class="cr-price">₹${parseFloat(item.price).toFixed(2)} each</div></div>
      <div class="qty-row"><button class="qb" onclick="changeQty(${item.id},-1)">−</button><span class="qn">${item.quantity}</span><button class="qb" onclick="changeQty(${item.id},1)">+</button></div>
      <div class="cr-sub">₹${(item.price * item.quantity).toFixed(2)}</div>
      <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})" style="flex-shrink:0">✕</button>
    </div>`).join('');
  sumEl.innerHTML = `
    <div class="summary-box">
      <h3 style="font-family:var(--font-h);font-size:1.15rem;font-weight:800;letter-spacing:-.5px;margin-bottom:18px">Order Summary</h3>
      <div class="sum-row"><span>Subtotal</span><span>₹${sub.toFixed(2)}</span></div>
      <div class="sum-row"><span>GST (5%)</span><span>₹${tax.toFixed(2)}</span></div>
      <div class="sum-row"><span>Pickup</span><span style="color:var(--leaf)">FREE</span></div>
      <div class="sum-total"><span>Total</span><span>₹${grand.toFixed(2)}</span></div>
      <button class="btn btn-fire btn-full" onclick="placeOrder()">🛍️ Place Order</button>
      <button class="btn btn-ghost btn-full btn-sm" style="margin-top:8px" onclick="showPage('menu')">← Continue Shopping</button>
    </div>`;
}

function getItemImage(item) {
  const nameKey = (item?.name || '').toLowerCase().trim();
  return menuImageMap[nameKey] || item?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
}

function removeFromCart(itemId) {
  state.cart = state.cart.filter(i => i.id != itemId);
  saveCart(); renderCart();
  const card = document.getElementById('fc-' + itemId);
  if (card) {
    const foot = card.querySelector('.fc-foot');
    const price = foot?.querySelector('.fc-price');
    if (price) foot.innerHTML = `${price.outerHTML}<button class="add-btn" onclick="addToCart(${itemId})">＋ Add</button>`;
  }
}

async function placeOrder() {
  if (!state.cart.length) return;
  const sub = state.cart.reduce((s,i) => s + i.price * i.quantity, 0);
  const grand = (sub * 1.05).toFixed(2);
  const items = state.cart.map(i => ({id:i.id, quantity:i.quantity, price:i.price}));
  const res = await api('php/orders.php', { query:{action:'place'}, method:'POST', body:{items, total:grand} });
  if (res.success) {
    generateBill(res.data, [...state.cart]);
    state.cart = []; saveCart(); renderCart();
    toast('Order placed! Bill is ready. 🎉');
    setTimeout(() => showFeedbackModal(res.data.order_id), 1200);
  } else { toast(res.message || 'Failed to place order', 'error'); }
}

function generateBill(orderData, items) {
  const sub = items.reduce((s,i) => s + i.price * i.quantity, 0);
  const tax = sub * 0.05, grand = sub + tax;
  const rows = items.map(i => `<tr><td>${i.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">₹${(i.price*i.quantity).toFixed(2)}</td></tr>`).join('');
  const w = window.open('','_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>CANTIFY — Order #${orderData.order_id}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:#100d08;color:#fef3e2;max-width:500px;margin:40px auto;padding:30px}
  .logo{font-size:2rem;font-weight:900;color:#f97316;letter-spacing:-2px;margin-bottom:2px}.tag{color:#f59e0b;font-size:.84rem;margin-bottom:22px;font-style:italic}
  hr{border:1px solid rgba(255,255,255,.08);margin:18px 0}.row{display:flex;justify-content:space-between;padding:5px 0;font-size:.87rem;color:#c4a882}.row span:last-child{color:#fef3e2}
  table{width:100%;border-collapse:collapse;margin:18px 0}th{background:#1a1510;padding:9px;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:#c4a882}td{padding:9px;border-bottom:1px solid rgba(255,255,255,.05)}
  .total{display:flex;justify-content:space-between;padding:13px 0;font-size:1.1rem;font-weight:700}.total span:last-child{color:#f97316}
  .pickup{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:#22c55e;padding:9px 14px;border-radius:8px;margin:14px 0;font-size:.84rem}
  .footer{text-align:center;color:rgba(196,168,130,.5);font-size:.77rem;margin-top:22px;line-height:1.7}
  </style></head><body>
  <div class="logo">🍽️ CANTIFY</div>
  <div class="tag">"No more wait, just order straight."</div><hr>
  <div class="row"><span>Order ID</span><span>#${orderData.order_id}</span></div>
  <div class="row"><span>Date</span><span>${new Date().toLocaleString('en-IN')}</span></div>
  <div class="pickup">⏱ ${orderData.pickup_time||'Ready in ~15 minutes — pick up at counter'}</div>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="row"><span>Subtotal</span><span>₹${sub.toFixed(2)}</span></div>
  <div class="row"><span>GST (5%)</span><span>₹${tax.toFixed(2)}</span></div>
  <div class="total"><span>Grand Total</span><span>₹${grand.toFixed(2)}</span></div>
  <div class="footer">Thank you for using CANTIFY!<br>Collect your order at the canteen counter.<br>CHARUSAT University Smart Canteen</div>
  <script>window.onload=()=>window.print();<\/script></body></html>`);
  w.document.close();
}

/* ── FEEDBACK ───────────────────────────────── */
let selectedRating = 0;
function showFeedbackModal(orderId) {
  selectedRating = 0;
  const modal = document.getElementById('fb-modal');
  modal.dataset.orderId = orderId;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('on'));
  document.getElementById('fb-review').value = '';
  modal.classList.add('on');
  document.querySelectorAll('.star').forEach(btn => {
    btn.onclick = () => {
      selectedRating = parseInt(btn.dataset.r);
      document.querySelectorAll('.star').forEach((s,i) => s.classList.toggle('on', i < selectedRating));
    };
  });
  document.getElementById('fb-submit').onclick = async () => {
    if (!selectedRating) { toast('Please select a rating','info'); return; }
    const review = document.getElementById('fb-review').value;
    const res = await api('php/feedback.php', { query:{action:'submit'}, method:'POST', body:{order_id:orderId, rating:selectedRating, review} });
    if (res.success) {
      document.getElementById('fb-modal-box').innerHTML = `<div style="text-align:center;padding:18px"><div style="font-size:3.5rem;margin-bottom:14px">⭐</div><h3 style="font-family:var(--font-h);font-size:1.4rem;margin-bottom:8px">Thank you!</h3><p style="color:var(--fog)">Your feedback helps us serve better every day.</p><br><button class="btn btn-fire" onclick="closeFeedbackModal()">Done ✓</button></div>`;
    } else { toast(res.message, 'error'); }
  };
}
function closeFeedbackModal() { document.getElementById('fb-modal').classList.remove('on'); }

/* ── ORDERS ─────────────────────────────────── */
async function loadOrders() {
  const c = document.getElementById('orders-wrap');
  c.innerHTML = '<div class="loading-box"><div class="spin"></div><span>Loading orders…</span></div>';
  const res = await api('php/orders.php', { query:{action:'my_orders'} });
  if (!res.success || !res.data.length) {
    c.innerHTML = `<div class="empty-box"><div class="ei">📋</div><h3>No orders yet</h3><p>Place your first order from the menu!</p><br><button class="btn btn-fire" onclick="showPage('menu')">Order Now</button></div>`;
    return;
  }
  const active  = res.data.filter(o => ['pending','preparing','ready'].includes(o.status));
  const history = res.data.filter(o => ['completed','cancelled'].includes(o.status));
  const card = o => {
    const d = new Date(o.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    return `<div class="order-card">
      <div class="oc-top"><span class="oc-id">Order #${o.id}</span><span class="badge badge-${o.status}">${o.status}</span></div>
      <div class="oc-items">${o.items_summary||'—'}</div>
      <div class="oc-bot"><span class="oc-amt">₹${parseFloat(o.total_amount).toFixed(2)}</span>${o.pickup_time?`<span class="oc-eta">⏱ ${o.pickup_time}</span>`:''}<span class="oc-dt">${d}</span></div>
    </div>`;
  };
  c.innerHTML = (active.length ? `<h3 style="font-family:var(--font-h);font-size:1.1rem;color:var(--ember);margin-bottom:14px;letter-spacing:-.3px">⏳ Current Orders</h3>${active.map(card).join('')}<br>` : '') +
                (history.length ? `<h3 style="font-family:var(--font-h);font-size:1.1rem;color:var(--fog);margin-bottom:14px;letter-spacing:-.3px">📜 Order History</h3>${history.map(card).join('')}` : '');
}

/* ── CONTACT ────────────────────────────────── */
async function handleContact(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Sending…'; btn.disabled = true;
  const fd = new FormData(e.target); fd.append('action','submit');
  const res = await api('php/contact.php', { body: fd });
  btn.textContent = '📨 Send Message'; btn.disabled = false;
  if (res.success) { toast('Message sent successfully!'); e.target.reset(); }
  else toast(res.message, 'error');
}

/* ── INIT ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateCanteenStatus();
  setInterval(updateCanteenStatus, 60000);
  checkAuth();
});
