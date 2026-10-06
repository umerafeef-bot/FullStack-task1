/**
 * AlphaStore - Main Frontend Application Logic
 * CodeAlpha Task 1: Simple E-commerce Store
 */

const STATE = {
  products: [],
  categories: ['All'],
  activeCategory: 'All',
  searchQuery: '',
  sortBy: 'featured',
  cart: JSON.parse(localStorage.getItem('alphastore_cart') || '[]'),
  coupon: localStorage.getItem('alphastore_coupon') || null,
  user: JSON.parse(localStorage.getItem('alphastore_user') || 'null'),
  token: localStorage.getItem('alphastore_token') || null,
  theme: localStorage.getItem('alphastore_theme') || 'dark'
};

// ==================== DOM ELEMENTS ====================
const elements = {
  productGrid: document.getElementById('product-grid'),
  categoriesBar: document.getElementById('categories-bar'),
  resultsCount: document.getElementById('results-count'),
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  mobileSearchToggleBtn: document.getElementById('mobile-search-toggle-btn'),
  mobileSearchDrawer: document.getElementById('mobile-search-drawer'),
  mobileSearchInput: document.getElementById('mobile-search-input'),
  clearMobileSearchBtn: document.getElementById('clear-mobile-search-btn'),
  sortSelect: document.getElementById('sort-select'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  
  // Cross-task Link
  navCrossBtn: document.querySelector('.nav-cross-btn'),
  
  // Cart Drawer
  cartToggleBtn: document.getElementById('cart-toggle-btn'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartOverlay: document.getElementById('cart-drawer-overlay'),
  closeCartBtn: document.getElementById('close-cart-btn'),
  cartBadge: document.getElementById('cart-badge'),
  cartCountTitle: document.getElementById('cart-count-title'),
  cartItemsContainer: document.getElementById('cart-items-container'),
  shippingProgressBar: document.getElementById('shipping-progress-bar'),
  shippingProgressText: document.getElementById('shipping-progress-text'),
  couponInput: document.getElementById('coupon-input'),
  applyCouponBtn: document.getElementById('apply-coupon-btn'),
  couponMessage: document.getElementById('coupon-message'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  discountRow: document.getElementById('discount-row'),
  cartDiscount: document.getElementById('cart-discount'),
  cartTax: document.getElementById('cart-tax'),
  cartShipping: document.getElementById('cart-shipping'),
  cartTotal: document.getElementById('cart-total'),
  checkoutBtn: document.getElementById('checkout-btn'),

  // Product Details Modal
  productModalBackdrop: document.getElementById('product-modal-backdrop'),
  productModalContent: document.getElementById('product-modal-content'),
  closeProductModalBtn: document.getElementById('close-product-modal-btn'),

  // Checkout Modal
  checkoutModalBackdrop: document.getElementById('checkout-modal-backdrop'),
  closeCheckoutModalBtn: document.getElementById('close-checkout-modal-btn'),
  checkoutForm: document.getElementById('checkout-form'),
  cancelCheckoutBtn: document.getElementById('cancel-checkout-btn'),
  coSubtotal: document.getElementById('co-subtotal'),
  coDiscountLine: document.getElementById('co-discount-line'),
  coDiscount: document.getElementById('co-discount'),
  coTaxShipping: document.getElementById('co-tax-shipping'),
  coTotal: document.getElementById('co-total'),
  placeOrderSubmitBtn: document.getElementById('place-order-submit-btn'),
  placeOrderSpinner: document.getElementById('place-order-spinner'),

  // Order Success Modal
  orderSuccessModalBackdrop: document.getElementById('order-success-modal-backdrop'),
  orderReceiptCard: document.getElementById('order-receipt-card'),
  continueShoppingBtn: document.getElementById('continue-shopping-btn'),
  viewOrderHistoryBtn: document.getElementById('view-order-history-btn'),

  // Auth Modal & User Menu
  authWrapper: document.getElementById('auth-wrapper'),
  authBtn: document.getElementById('auth-btn'),
  authModalBackdrop: document.getElementById('auth-modal-backdrop'),
  closeAuthModalBtn: document.getElementById('close-auth-modal-btn'),
  tabLogin: document.getElementById('tab-login'),
  tabRegister: document.getElementById('tab-register'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  userMenu: document.getElementById('user-menu'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  userEmail: document.getElementById('user-email'),
  navOrdersBtn: document.getElementById('nav-orders-btn'),
  navLogoutBtn: document.getElementById('nav-logout-btn'),
  heroQuickDemoBtn: document.getElementById('hero-quick-demo-btn'),

  // Orders History Modal
  ordersModalBackdrop: document.getElementById('orders-modal-backdrop'),
  closeOrdersModalBtn: document.getElementById('close-orders-modal-btn'),
  ordersListContainer: document.getElementById('orders-list-container'),

  // Toast
  toastContainer: document.getElementById('toast-container'),
  copyCouponBtn: document.getElementById('copy-coupon-btn')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  // Listeners are wired first so a failure in any later step cannot leave the
  // page without click handlers.
  setupEventListeners();
  initAuthUI();
  await restoreSession();
  fetchProducts();
  updateCartUI();
  if (window.lucide) lucide.createIcons();
});

// ==================== HTML ESCAPING HELPERS ====================
// User-supplied text (reviews, names, addresses) is rendered through innerHTML,
// so it must be escaped to avoid stored XSS.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Only allow http(s) URLs to be rendered as src/href attributes.
function safeUrl(value) {
  const url = String(value ?? '').trim();
  if (/^https?:\/\//i.test(url)) return escapeHtml(url);
  return '';
}

// ==================== TOAST NOTIFICATION SYSTEM ====================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  elements.toastContainer.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==================== THEME CONTROLLER ====================
function initTheme() {
  document.body.setAttribute('data-theme', STATE.theme);
}

function toggleTheme() {
  STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', STATE.theme);
  localStorage.setItem('alphastore_theme', STATE.theme);
  if (window.lucide) lucide.createIcons();
}

// ==================== PRODUCT CATALOG & FILTERING ====================
async function fetchProducts() {
  try {
    elements.resultsCount.innerText = 'Loading catalog...';
    const params = new URLSearchParams();
    if (STATE.activeCategory && STATE.activeCategory !== 'All') {
      params.append('category', STATE.activeCategory);
    }
    if (STATE.searchQuery.trim() !== '') {
      params.append('search', STATE.searchQuery.trim());
    }
    if (STATE.sortBy !== 'featured') {
      params.append('sort', STATE.sortBy);
    }

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    STATE.products = Array.isArray(data.products) ? data.products : [];
    STATE.products.forEach(p => PRODUCT_CACHE.set(p.id, p));

    if (data.categories && data.categories.length > 0) {
      STATE.categories = data.categories;
      renderCategoryPills();
    }

    renderProducts(STATE.products);
    reconcileCart();
  } catch (err) {
    console.error('Error fetching products:', err);
    elements.resultsCount.innerText = 'Could not load catalog';
    elements.productGrid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="wifi-off"></i>
        <h4>Can't reach the store</h4>
        <p>Check that the server is running, then try again.</p>
        <button id="retry-products-btn" class="btn btn-outline btn-sm">Try Again</button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    const retryBtn = document.getElementById('retry-products-btn');
    if (retryBtn) retryBtn.addEventListener('click', fetchProducts);
    showToast('Failed to connect to backend API.', 'error');
  }
}

function renderCategoryPills() {
  elements.categoriesBar.innerHTML = '';
  STATE.categories.forEach(cat => {
    const pill = document.createElement('button');
    pill.className = `category-pill ${STATE.activeCategory === cat ? 'active' : ''}`;
    pill.dataset.category = cat;
    pill.innerText = cat === 'All' ? 'All Items' : cat;
    pill.addEventListener('click', () => {
      STATE.activeCategory = cat;
      document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      fetchProducts();
    });
    elements.categoriesBar.appendChild(pill);
  });
}

function renderProducts(products) {
  elements.resultsCount.innerText = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;

  if (products.length === 0) {
    const hasFilters = STATE.activeCategory !== 'All' || STATE.searchQuery.trim() !== '';
    elements.productGrid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="package-search"></i>
        <h4>${hasFilters ? 'No products match your filters' : 'No products available'}</h4>
        <p>${hasFilters ? 'Try a different search term or category.' : 'Please check back soon.'}</p>
        ${hasFilters ? '<button id="reset-filter-btn" class="btn btn-outline btn-sm">View All Items</button>' : ''}
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        STATE.activeCategory = 'All';
        STATE.searchQuery = '';
        elements.searchInput.value = '';
        if (elements.mobileSearchInput) elements.mobileSearchInput.value = '';
        if (elements.clearSearchBtn) elements.clearSearchBtn.style.display = 'none';
        if (elements.clearMobileSearchBtn) elements.clearMobileSearchBtn.style.display = 'none';
        renderCategoryPills();
        fetchProducts();
      });
    }
    return;
  }

  elements.productGrid.innerHTML = products.map(product => `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-box">
        <img src="${safeUrl(product.image_url)}" alt="${escapeHtml(product.name)}" loading="lazy">
        ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}
        <button class="quick-view-overlay-btn" onclick="openProductModal(${product.id})">
          <i data-lucide="eye"></i> Quick View
        </button>
      </div>

      <div class="product-card-body">
        <div class="product-category-row">
          <span class="product-category">${escapeHtml(product.category)}</span>
          <span class="product-rating">
            <i data-lucide="star" style="fill: var(--accent-amber); stroke: none; width: 14px; height: 14px;"></i>
            ${Number(product.rating)} <span style="color: var(--text-dim); font-weight: 400;">(${product.reviews_count})</span>
          </span>
        </div>

        <h3 class="product-title" onclick="openProductModal(${product.id})">${escapeHtml(product.name)}</h3>
        <p class="product-desc-snippet">${escapeHtml(product.description)}</p>

        <div class="product-card-footer">
          <div class="price-box">
            <span class="current-price">$${Number(product.price).toFixed(2)}</span>
            ${product.original_price ? `<span class="original-price">$${Number(product.original_price).toFixed(2)}</span>` : ''}
          </div>
          <button class="add-cart-btn" onclick="addToCart(${product.id}, 1)" ${product.stock > 0 ? '' : 'disabled'}>
            <i data-lucide="shopping-bag" style="width: 16px; height: 16px;"></i>
            <span>${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </article>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// ==================== PRODUCT DETAILS MODAL ====================
async function openProductModal(productId) {
  try {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) throw new Error('Product not found');
    const { product, reviews } = await res.json();
    PRODUCT_CACHE.set(product.id, product);

    const featuresHtml = (product.features || []).map(f => `
      <li><i data-lucide="check-circle-2"></i> ${escapeHtml(f)}</li>
    `).join('');

    const reviewsHtml = (reviews || []).map(r => `
      <div class="review-item">
        <div class="review-header">
          <strong>${escapeHtml(r.user_name)}</strong>
          <span style="color: var(--accent-amber);">★ ${Number(r.rating)}/5</span>
        </div>
        <p class="review-comment">${escapeHtml(r.comment)}</p>
      </div>
    `).join('') || '<p style="color: var(--text-dim); font-size: 0.85rem;">No reviews yet. Be the first to review this product!</p>';

    elements.productModalContent.innerHTML = `
      <div class="modal-img-col">
        <img src="${safeUrl(product.image_url)}" alt="${escapeHtml(product.name)}" class="modal-main-img">
      </div>
      <div class="modal-info-col">
        <span class="modal-category-badge">${escapeHtml(product.category)}</span>
        <h2 class="modal-title">${escapeHtml(product.name)}</h2>

        <div class="modal-meta-row">
          <span class="product-rating">
            <i data-lucide="star" style="fill: var(--accent-amber); stroke: none; width: 16px; height: 16px;"></i>
            <strong>${Number(product.rating)}</strong> (${product.reviews_count} reviews)
          </span>
          <span class="stock-tag">${product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}</span>
        </div>

        <div class="modal-price-box">
          <span class="modal-price gradient-text">$${Number(product.price).toFixed(2)}</span>
          ${product.original_price ? `<span class="modal-orig-price">$${Number(product.original_price).toFixed(2)}</span>` : ''}
        </div>

        <p class="modal-desc">${escapeHtml(product.description)}</p>

        ${featuresHtml ? `
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px;">Key Specifications</h4>
          <ul class="modal-features-list">${featuresHtml}</ul>
        ` : ''}

        <div class="modal-actions-row">
          <div class="qty-stepper" style="padding: 4px;">
            <button class="qty-btn" id="modal-qty-minus"><i data-lucide="minus"></i></button>
            <span class="qty-value" id="modal-qty-val">1</span>
            <button class="qty-btn" id="modal-qty-plus"><i data-lucide="plus"></i></button>
          </div>
          <button class="btn btn-primary btn-lg" id="modal-add-cart-btn" style="flex: 1;">
            <i data-lucide="shopping-bag"></i>
            <span>Add to Cart</span>
          </button>
        </div>

        <!-- Reviews Section -->
        <div class="modal-reviews-section">
          <h4>Customer Reviews (${reviews ? reviews.length : 0})</h4>
          <div class="reviews-list">${reviewsHtml}</div>
          
          <!-- Add Review Form -->
          <form id="add-review-form" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
            <div style="display: flex; gap: 8px;">
              <select id="review-rating" style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 8px; border-radius: var(--radius-sm); color: var(--text-main);">
                <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                <option value="3">⭐⭐⭐ (3/5)</option>
                <option value="2">⭐⭐ (2/5)</option>
                <option value="1">⭐ (1/5)</option>
              </select>
              <input type="text" id="review-comment" placeholder="Write your honest review..." required style="flex:1; background: var(--bg-input); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: var(--radius-sm); color: var(--text-main);">
              <button type="submit" class="btn btn-outline btn-sm">Post</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Modal Qty Logic
    let currentQty = 1;
    const qtyVal = document.getElementById('modal-qty-val');
    document.getElementById('modal-qty-minus').addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        qtyVal.innerText = currentQty;
      }
    });
    document.getElementById('modal-qty-plus').addEventListener('click', () => {
      if (currentQty < product.stock) {
        currentQty++;
        qtyVal.innerText = currentQty;
      }
    });

    document.getElementById('modal-add-cart-btn').addEventListener('click', () => {
      addToCart(product, currentQty);
      closeProductModal();
    });

    // Review submit
    document.getElementById('add-review-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = document.getElementById('review-rating').value;
      const commentInput = document.getElementById('review-comment');
      const comment = commentInput.value.trim();
      const submitBtn = e.target.querySelector('button[type="submit"]');

      if (!comment) {
        showToast('Please write a short review before posting.', 'error');
        commentInput.focus();
        return;
      }

      submitBtn.disabled = true;
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (STATE.token) headers['Authorization'] = `Bearer ${STATE.token}`;

        const postRes = await fetch(`/api/products/${product.id}/reviews`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ rating, comment })
        });
        const data = await postRes.json().catch(() => ({}));
        if (!postRes.ok) throw new Error(data.error || 'Could not submit your review.');

        commentInput.value = '';
        showToast('Review submitted successfully!', 'success');
        openProductModal(product.id); // reload modal reviews
      } catch (err) {
        showToast(err.message || 'Failed to post review.', 'error');
        submitBtn.disabled = false;
      }
    });

    elements.productModalBackdrop.classList.add('open');
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    showToast('Failed to open product details.', 'error');
  }
}

function closeProductModal() {
  elements.productModalBackdrop.classList.remove('open');
}

// Global product cache for instant lookups even when filtered
const PRODUCT_CACHE = new Map();

// The cart is persisted in localStorage, so its price/stock snapshot can go
// stale against the database. On catalog load, re-sync against live data so the
// cart never disagrees with the server-side total it will be charged.
function reconcileCart() {
  if (STATE.cart.length === 0) return;

  let changed = false;
  const removed = [];

  STATE.cart = STATE.cart.filter(item => {
    const live = PRODUCT_CACHE.get(item.id);
    if (!live) return true; // not in the current page of results; leave alone

    if (live.stock <= 0) {
      removed.push(item.name);
      changed = true;
      return false;
    }
    if (Number(live.price) !== Number(item.price) || Number(live.stock) !== Number(item.stock)) {
      item.price = live.price;
      item.stock = live.stock;
      changed = true;
    }
    if (item.quantity > live.stock) {
      item.quantity = live.stock;
      changed = true;
    }
    return true;
  });

  if (changed) saveCart();
  if (removed.length) {
    showToast(`${removed.join(', ')} removed from cart (out of stock).`, 'info');
  }
}

// ==================== SHOPPING CART STATE & LOGIC ====================
function addToCart(productOrId, qty = 1) {
  let product = null;
  if (typeof productOrId === 'object' && productOrId !== null) {
    product = productOrId;
    PRODUCT_CACHE.set(product.id, product);
  } else {
    product = PRODUCT_CACHE.get(Number(productOrId)) || STATE.products.find(p => p.id === Number(productOrId));
  }
  if (!product) return;

  const existingItem = STATE.cart.find(item => item.id === product.id);
  const currentQty = existingItem ? existingItem.quantity : 0;

  if (product.stock !== undefined && (currentQty + qty) > product.stock) {
    showToast(`Sorry, only ${product.stock} units available in stock.`, 'error');
    return;
  }

  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    STATE.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url,
      quantity: qty
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added ${product.name} to cart!`, 'success');

  // Badge bump animation
  elements.cartBadge.classList.add('bump');
  setTimeout(() => elements.cartBadge.classList.remove('bump'), 400);
}

function changeCartQty(productId, delta) {
  const item = STATE.cart.find(i => i.id === productId);
  if (!item) return;

  const product = PRODUCT_CACHE.get(productId) || STATE.products.find(p => p.id === productId);
  if (delta > 0 && product && product.stock !== undefined && (item.quantity + delta) > product.stock) {
    showToast(`Maximum stock reached (${product.stock} units available).`, 'error');
    return;
  }

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  STATE.cart = STATE.cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
  showToast('Item removed from cart.', 'info');
}

function saveCart() {
  localStorage.setItem('alphastore_cart', JSON.stringify(STATE.cart));
}

function calculateCartTotals() {
  const subtotal = STATE.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discount = 0;
  if (STATE.coupon === 'ALPHA10') {
    discount = Math.round(subtotal * 0.10 * 100) / 100;
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.08 * 100) / 100;
  const shipping = subtotal > 100 || subtotal === 0 ? 0.00 : 9.99;
  const total = Math.round((taxableAmount + tax + shipping) * 100) / 100;

  return { subtotal, discount, tax, shipping, total };
}

function updateCartUI() {
  const totalItems = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
  elements.cartBadge.innerText = totalItems;
  elements.cartCountTitle.innerText = totalItems;

  const { subtotal, discount, tax, shipping, total } = calculateCartTotals();

  // Free shipping progress bar (Goal: $100)
  const freeThreshold = 100;
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  elements.shippingProgressBar.style.width = `${progressPercent}%`;

  if (subtotal >= freeThreshold) {
    elements.shippingProgressText.innerHTML = `🎉 <strong>Congratulations!</strong> You get FREE standard shipping!`;
  } else {
    const diff = (freeThreshold - subtotal).toFixed(2);
    elements.shippingProgressText.innerText = `Add $${diff} more for FREE Shipping!`;
  }

  // Cart Items Render
  if (STATE.cart.length === 0) {
    elements.cartItemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <i data-lucide="shopping-cart"></i>
        <h4>Your cart is empty</h4>
        <p>Explore our catalog to find premium gear and accessories.</p>
      </div>
    `;
    elements.checkoutBtn.disabled = true;
  } else {
    elements.cartItemsContainer.innerHTML = STATE.cart.map(item => `
      <div class="cart-item-card">
        <img src="${safeUrl(item.image_url)}" alt="${escapeHtml(item.name)}" class="cart-item-img">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
          <span class="cart-item-price">$${Number(item.price).toFixed(2)}</span>
          
          <div class="cart-item-actions">
            <div class="qty-stepper">
              <button class="qty-btn" onclick="changeCartQty(${item.id}, -1)">
                <i data-lucide="minus" style="width: 12px; height: 12px;"></i>
              </button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" onclick="changeCartQty(${item.id}, 1)">
                <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
              </button>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})" title="Remove item">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
    elements.checkoutBtn.disabled = false;
  }

  // Cost Breakdown Render
  elements.cartSubtotal.innerText = `$${subtotal.toFixed(2)}`;
  if (discount > 0) {
    elements.discountRow.style.display = 'flex';
    elements.cartDiscount.innerText = `-$${discount.toFixed(2)}`;
  } else {
    elements.discountRow.style.display = 'none';
  }
  elements.cartTax.innerText = `$${tax.toFixed(2)}`;
  elements.cartShipping.innerText = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
  elements.cartTotal.innerText = `$${total.toFixed(2)}`;

  if (window.lucide) lucide.createIcons();
}

function applyCouponCode() {
  const code = elements.couponInput.value.trim().toUpperCase();
  if (code === 'ALPHA10') {
    STATE.coupon = 'ALPHA10';
    localStorage.setItem('alphastore_coupon', 'ALPHA10');
    elements.couponMessage.className = 'coupon-message text-success';
    elements.couponMessage.innerText = '✔ Coupon ALPHA10 applied (10% discount)';
    showToast('Promo code applied: 10% OFF!', 'success');
  } else {
    elements.couponMessage.className = 'coupon-message text-danger';
    elements.couponMessage.innerText = '✖ Invalid coupon code. Try ALPHA10';
  }
  updateCartUI();
}

// ==================== CHECKOUT & ORDER PROCESSING ====================
function openCheckoutModal() {
  if (STATE.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }
  closeCart();

  // Prefill details if user logged in
  if (STATE.user) {
    document.getElementById('checkout-name').value = STATE.user.name || '';
    document.getElementById('checkout-email').value = STATE.user.email || '';
  }

  // Update summary box in modal
  const { subtotal, discount, tax, shipping, total } = calculateCartTotals();
  elements.coSubtotal.innerText = `$${subtotal.toFixed(2)}`;
  if (discount > 0) {
    elements.coDiscountLine.style.display = 'flex';
    elements.coDiscount.innerText = `-$${discount.toFixed(2)}`;
  } else {
    elements.coDiscountLine.style.display = 'none';
  }
  elements.coTaxShipping.innerText = `$${(tax + shipping).toFixed(2)}`;
  elements.coTotal.innerText = `$${total.toFixed(2)}`;

  elements.checkoutModalBackdrop.classList.add('open');
}

function closeCheckoutModal() {
  elements.checkoutModalBackdrop.classList.remove('open');
}

async function handleOrderSubmission(e) {
  e.preventDefault();
  
  const customerName = document.getElementById('checkout-name').value.trim();
  const customerEmail = document.getElementById('checkout-email').value.trim();
  const shippingAddress = document.getElementById('checkout-address').value.trim();
  const city = document.getElementById('checkout-city').value.trim();
  const postalCode = document.getElementById('checkout-zip').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Credit Card';

  // Credit Card Validation
  if (paymentMethod === 'Credit Card') {
    const cardNum = (document.getElementById('card-number')?.value || '').replace(/\s/g, '');
    const expiry = (document.getElementById('card-expiry')?.value || '').trim();
    const cvv = (document.getElementById('card-cvv')?.value || '').trim();

    if (!cardNum || cardNum.length < 15) {
      showToast('Please enter a valid 16-digit card number.', 'error');
      return;
    }
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      showToast('Please enter a valid expiry date (MM/YY).', 'error');
      return;
    }
    if (!cvv || cvv.length < 3) {
      showToast('Please enter a valid 3-4 digit CVV security code.', 'error');
      return;
    }
  }

  elements.placeOrderSubmitBtn.disabled = true;
  elements.placeOrderSpinner.style.display = 'inline-block';

  try {
    const payload = {
      customerName,
      customerEmail,
      shippingAddress,
      city,
      postalCode,
      paymentMethod,
      couponCode: STATE.coupon,
      items: STATE.cart.map(item => ({ id: item.id, quantity: item.quantity }))
    };

    const headers = { 'Content-Type': 'application/json' };
    if (STATE.token) headers['Authorization'] = `Bearer ${STATE.token}`;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order processing failed');

    // Success! Clear cart & coupon
    STATE.cart = [];
    STATE.coupon = null;
    saveCart();
    localStorage.removeItem('alphastore_coupon');
    updateCartUI();

    closeCheckoutModal();
    showOrderSuccessModal(data.order);
    showToast('Order confirmed! Receipt generated.', 'success');
  } catch (err) {
    console.error('Order error:', err);
    showToast(err.message || 'Error processing your order.', 'error');
  } finally {
    elements.placeOrderSubmitBtn.disabled = false;
    elements.placeOrderSpinner.style.display = 'none';
  }
}

function showOrderSuccessModal(order) {
  const itemsHtml = order.items.map(item => `
    <div class="receipt-item-row">
      <span>${escapeHtml(item.product_name || item.name)} × ${Number(item.quantity)}</span>
      <span>$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
    </div>
  `).join('');

  elements.orderReceiptCard.innerHTML = `
    <div class="receipt-header-row">
      <span>Order ID: <code style="color: var(--accent-cyan); font-family: monospace;">${escapeHtml(order.order_number)}</code></span>
      <span class="order-badge-status">${escapeHtml(order.status)}</span>
    </div>
    <div style="font-size: 0.85rem; margin-bottom: 12px;">
      <div><strong>Customer:</strong> ${escapeHtml(order.customer_name)} (${escapeHtml(order.customer_email)})</div>
      <div><strong>Ship To:</strong> ${escapeHtml(order.shipping_address)}, ${escapeHtml(order.city)}</div>
    </div>
    <div class="receipt-items-list">${itemsHtml}</div>
    <div style="border-top: 1px dashed var(--border-color); padding-top: 10px; display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem;">
      <div style="display:flex; justify-content:space-between;">
        <span>Subtotal:</span><span>$${Number(order.subtotal).toFixed(2)}</span>
      </div>
      ${order.discount > 0 ? `
        <div style="display:flex; justify-content:space-between; color: var(--accent-emerald);">
          <span>Discount:</span><span>-$${Number(order.discount).toFixed(2)}</span>
        </div>
      ` : ''}
      <div style="display:flex; justify-content:space-between;">
        <span>Tax & Shipping:</span><span>$${(Number(order.tax) + Number(order.shipping)).toFixed(2)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-weight: 800; font-size: 1.05rem; margin-top: 4px;">
        <span>Total Paid:</span><span class="gradient-text">$${Number(order.total).toFixed(2)}</span>
      </div>
    </div>
  `;

  elements.orderSuccessModalBackdrop.classList.add('open');
  if (window.lucide) lucide.createIcons();
}

// ==================== AUTHENTICATION & ORDERS HISTORY ====================

// Validates the stored token against the server on boot. Without this, an
// expired or revoked token leaves the UI showing a signed-in user whose
// requests all fail with 401.
async function restoreSession() {
  if (!STATE.token) {
    initAuthUI();
    return;
  }
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    if (!res.ok) throw new Error('Session no longer valid');
    const data = await res.json();
    if (data.user) {
      STATE.user = data.user;
      localStorage.setItem('alphastore_user', JSON.stringify(data.user));
    }
  } catch (err) {
    STATE.user = null;
    STATE.token = null;
    localStorage.removeItem('alphastore_user');
    localStorage.removeItem('alphastore_token');
  }
  initAuthUI();
}

function initAuthUI() {
  // Idempotent: this runs again after login/logout/restore, so clear any
  // previously injected trigger before rebuilding.
  const existingTrigger = document.getElementById('user-profile-trigger');
  if (existingTrigger) existingTrigger.remove();

  if (STATE.user && STATE.token) {
    const avatarUrl = safeUrl(STATE.user.avatar) ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(STATE.user.name || 'user')}`;

    elements.authBtn.style.display = 'none';
    elements.userAvatar.src = avatarUrl;
    elements.userAvatar.alt = `${STATE.user.name} avatar`;
    elements.userName.innerText = STATE.user.name;
    elements.userEmail.innerText = STATE.user.email;

    const trigger = document.createElement('button');
    trigger.id = 'user-profile-trigger';
    trigger.className = 'icon-btn';
    trigger.style.padding = '2px';
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-label', 'Open account menu');
    trigger.innerHTML = `<img src="${avatarUrl}" alt="" class="avatar-sm" style="width: 32px; height: 32px;">`;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = elements.userMenu.style.display === 'none';
      elements.userMenu.style.display = isHidden ? 'block' : 'none';
      trigger.setAttribute('aria-expanded', String(isHidden));
    });
    elements.authWrapper.prepend(trigger);
  } else {
    elements.authBtn.style.display = '';
    elements.userMenu.style.display = 'none';
  }
}

function openAuthModal(defaultTab = 'login') {
  if (defaultTab === 'login') {
    elements.tabLogin.classList.add('active');
    elements.tabRegister.classList.remove('active');
    elements.loginForm.style.display = 'block';
    elements.registerForm.style.display = 'none';
  } else {
    elements.tabRegister.classList.add('active');
    elements.tabLogin.classList.remove('active');
    elements.registerForm.style.display = 'block';
    elements.loginForm.style.display = 'none';
  }
  elements.authModalBackdrop.classList.add('open');
}

function closeAuthModal() {
  elements.authModalBackdrop.classList.remove('open');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    STATE.user = data.user;
    STATE.token = data.token;
    localStorage.setItem('alphastore_user', JSON.stringify(data.user));
    localStorage.setItem('alphastore_token', data.token);

    showToast(`Welcome back, ${data.user.name}!`, 'success');
    closeAuthModal();
    initAuthUI();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    STATE.user = data.user;
    STATE.token = data.token;
    localStorage.setItem('alphastore_user', JSON.stringify(data.user));
    localStorage.setItem('alphastore_token', data.token);

    showToast(`Account created! Welcome, ${data.user.name}!`, 'success');
    closeAuthModal();
    initAuthUI();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleLogout() {
  localStorage.removeItem('alphastore_user');
  localStorage.removeItem('alphastore_token');
  STATE.user = null;
  STATE.token = null;
  elements.userMenu.style.display = 'none';
  initAuthUI();
  showToast('Logged out successfully.', 'info');
}

async function openOrdersModal() {
  elements.userMenu.style.display = 'none';
  if (!STATE.token) {
    openAuthModal('login');
    return;
  }

  try {
    elements.ordersListContainer.innerHTML = '<div class="orders-loading"><span class="spinner"></span><p>Loading your past orders...</p></div>';
    elements.ordersModalBackdrop.classList.add('open');

    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.error || 'Failed to load orders.');

    if (!data.orders || data.orders.length === 0) {
      elements.ordersListContainer.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package-x"></i>
          <h4>No orders yet</h4>
          <p>You haven't placed any orders with this account yet.</p>
        </div>
      `;
    } else {
      elements.ordersListContainer.innerHTML = data.orders.map(o => `
        <div class="order-history-card">
          <div class="order-history-header">
            <div>
              <span style="font-family: monospace; font-weight: 700; color: var(--accent-cyan);">${escapeHtml(o.order_number)}</span>
              <div style="font-size: 0.75rem; color: var(--text-dim);">${new Date(o.created_at).toLocaleDateString()}</div>
            </div>
            <span class="order-badge-status">${escapeHtml(o.status)}</span>
          </div>

          <div style="font-size: 0.85rem; margin-bottom: 10px;">
            ${(o.items || []).map(i => `<div>• ${escapeHtml(i.product_name)} × ${Number(i.quantity)} ($${(Number(i.price) * Number(i.quantity)).toFixed(2)})</div>`).join('')}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 0.9rem;">
            <span>Payment: <strong>${escapeHtml(o.payment_method)}</strong></span>
            <span style="font-weight: 800;" class="gradient-text">Total: $${Number(o.total).toFixed(2)}</span>
          </div>
        </div>
      `).join('');
    }

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    // Previously only a toast fired here, leaving the modal stuck on
    // "Loading..." forever. Render a real error state with a retry.
    elements.ordersListContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="wifi-off"></i>
        <h4>Could not load your orders</h4>
        <p>${escapeHtml(err.message || 'Please check your connection and try again.')}</p>
        <button id="retry-orders-btn" class="btn btn-outline btn-sm">Try Again</button>
      </div>
    `;
    const retryBtn = document.getElementById('retry-orders-btn');
    if (retryBtn) retryBtn.addEventListener('click', openOrdersModal);
    if (window.lucide) lucide.createIcons();
    showToast('Failed to load orders.', 'error');
  }
}

// ==================== EVENT LISTENERS ====================
function openCart() {
  elements.cartDrawer.classList.add('open');
  elements.cartOverlay.classList.add('open');
}

function closeCart() {
  elements.cartDrawer.classList.remove('open');
  elements.cartOverlay.classList.remove('open');
}

// Null-safe event binding. A single missing element must never abort
// setupEventListeners(), which would leave the whole page inert.
function on(el, event, handler) {
  if (el && typeof el.addEventListener === 'function') {
    el.addEventListener(event, handler);
  }
  return el;
}

function setupEventListeners() {
  // Theme toggle
  on(elements.themeToggleBtn, 'click', toggleTheme);

  // Cart drawer triggers
  on(elements.cartToggleBtn, 'click', openCart);
  on(elements.closeCartBtn, 'click', closeCart);
  on(elements.cartOverlay, 'click', closeCart);

  // Search input with debounce
  let searchTimeout;
  on(elements.searchInput, 'input', (e) => {
    clearTimeout(searchTimeout);
    const val = e.target.value;
    if (elements.clearSearchBtn) elements.clearSearchBtn.style.display = val ? 'flex' : 'none';
    searchTimeout = setTimeout(() => {
      STATE.searchQuery = val;
      fetchProducts();
    }, 300);
  });

  on(elements.clearSearchBtn, 'click', () => {
    elements.searchInput.value = '';
    if (elements.clearSearchBtn) elements.clearSearchBtn.style.display = 'none';
    STATE.searchQuery = '';
    fetchProducts();
  });

  // Sort selector
  on(elements.sortSelect, 'change', (e) => {
    STATE.sortBy = e.target.value;
    fetchProducts();
  });

  // Coupon
  on(elements.applyCouponBtn, 'click', applyCouponCode);
  on(elements.copyCouponBtn, 'click', () => {
    const code = 'ALPHA10';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    if (elements.couponInput) elements.couponInput.value = code;
    showToast('Copied code ALPHA10 to clipboard!', 'info');
    applyCouponCode();
  });

  // Checkout modal
  on(elements.checkoutBtn, 'click', openCheckoutModal);
  on(elements.closeCheckoutModalBtn, 'click', closeCheckoutModal);
  on(elements.cancelCheckoutBtn, 'click', closeCheckoutModal);
  on(elements.checkoutForm, 'submit', handleOrderSubmission);

  // Payment radio option highlight
  document.querySelectorAll('input[name="paymentMethod"]').forEach(r => {
    r.addEventListener('change', (e) => {
      document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
      e.target.closest('.payment-option')?.classList.add('selected');
      const cardInputs = document.getElementById('card-inputs-group');
      if (cardInputs) {
        cardInputs.style.display = e.target.value === 'Credit Card' ? 'block' : 'none';
      }
    });
  });

  // Product modal
  on(elements.closeProductModalBtn, 'click', closeProductModal);
  on(elements.productModalBackdrop, 'click', (e) => {
    if (e.target === elements.productModalBackdrop) closeProductModal();
  });

  // Order success modal
  on(elements.continueShoppingBtn, 'click', () => {
    elements.orderSuccessModalBackdrop.classList.remove('open');
  });
  on(elements.viewOrderHistoryBtn, 'click', () => {
    elements.orderSuccessModalBackdrop.classList.remove('open');
    openOrdersModal();
  });

  // Auth modal
  on(elements.authBtn, 'click', () => openAuthModal('login'));
  on(elements.closeAuthModalBtn, 'click', closeAuthModal);
  on(elements.tabLogin, 'click', () => openAuthModal('login'));
  on(elements.tabRegister, 'click', () => openAuthModal('register'));
  on(elements.loginForm, 'submit', handleLogin);
  on(elements.registerForm, 'submit', handleRegister);

  // Orders modal
  on(elements.navOrdersBtn, 'click', openOrdersModal);
  on(elements.navLogoutBtn, 'click', handleLogout);
  on(elements.closeOrdersModalBtn, 'click', () => {
    elements.ordersModalBackdrop.classList.remove('open');
  });

  // Hero Quick Demo Button
  on(elements.heroQuickDemoBtn, 'click', () => {
    const emailField = document.getElementById('login-email');
    const passField = document.getElementById('login-password');
    if (emailField) emailField.value = 'demo@codealpha.com';
    if (passField) passField.value = 'password123';
    openAuthModal('login');
    showToast('Prefilled demo credentials! Click Sign In.', 'info');
  });

  // Mobile Search Toggle & Input
  if (elements.mobileSearchToggleBtn && elements.mobileSearchDrawer) {
    on(elements.mobileSearchToggleBtn, 'click', () => {
      const isVisible = elements.mobileSearchDrawer.style.display !== 'none';
      elements.mobileSearchDrawer.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && elements.mobileSearchInput) {
        elements.mobileSearchInput.focus();
      }
    });

    if (elements.mobileSearchInput) {
      let mobileSearchTimeout;
      on(elements.mobileSearchInput, 'input', (e) => {
        clearTimeout(mobileSearchTimeout);
        const val = e.target.value;
        if (elements.clearMobileSearchBtn) {
          elements.clearMobileSearchBtn.style.display = val ? 'flex' : 'none';
        }
        mobileSearchTimeout = setTimeout(() => {
          STATE.searchQuery = val;
          elements.searchInput.value = val;
          fetchProducts();
        }, 300);
      });
    }

    on(elements.clearMobileSearchBtn, 'click', () => {
      if (elements.mobileSearchInput) elements.mobileSearchInput.value = '';
      if (elements.clearMobileSearchBtn) elements.clearMobileSearchBtn.style.display = 'none';
      STATE.searchQuery = '';
      elements.searchInput.value = '';
      fetchProducts();
    });
  }

  // Auto-format card number as groups of 4 digits
  on(document.getElementById('card-number'), 'input', (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    e.target.value = val.match(/.{1,4}/g)?.join(' ') || val;
  });

  // Auto-format expiry as MM/YY
  on(document.getElementById('card-expiry'), 'input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    e.target.value = val;
  });

  // Keyboard accessibility: ESC key closes all open modals and cart drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeProductModal();
      closeCheckoutModal();
      closeAuthModal();
      if (elements.ordersModalBackdrop) elements.ordersModalBackdrop.classList.remove('open');
      if (elements.orderSuccessModalBackdrop) elements.orderSuccessModalBackdrop.classList.remove('open');
    }
  });

  // Close menus on click outside
  document.addEventListener('click', (e) => {
    if (elements.userMenu && elements.authWrapper && !elements.authWrapper.contains(e.target)) {
      elements.userMenu.style.display = 'none';
    }
  });
}
