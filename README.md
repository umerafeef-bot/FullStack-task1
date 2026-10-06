# CodeAlpha Task 1: Simple E-Commerce Store (AlphaStore)

A production-ready, full-stack modern E-Commerce web application built for the **CodeAlpha Full Stack Development Internship**.

---

## 🌟 Features Implemented

1. **User Registration & Login (Authentication)**
   - Secure account registration and login using PBKDF2/scrypt password hashing.
   - Bearer token / JWT session management stored client-side in `localStorage`.
   - User profile dropdown with avatar, order history, and logout.
   - Pre-seeded Demo Account: `demo@codealpha.com` / `password123`.

2. **Product Catalog & Details Page**
   - High-performance catalog browsing with category filtering (`All`, `Audio`, `Accessories`, `Wearables`, `Tech`, `Furniture`, `Apparel`).
   - Real-time debounced search bar querying both title and description.
   - Sorting by Featured, Price (Low to High / High to Low), and Highest Rating.
   - Rich product cards with high-resolution imagery, promotional badges, stock indicators, and rating counts.
   - Interactive **Product Details Modal** with specs breakdown, stock count, quantity selector, and live customer reviews submission.

3. **Interactive Shopping Cart**
   - Slide-out Cart Drawer with animated trigger badge count.
   - Dynamic item quantity increment/decrement and removal.
   - Live price calculations: Subtotal, 8% Sales Tax, and Dynamic Shipping.
   - **Free Shipping Progress Tracker** (Unlocks free shipping on orders above $100).
   - Promo coupon code system (use code `ALPHA10` for 10% discount).
   - Persistent cart state in browser `localStorage`.

4. **Order Processing & Database Storage**
   - Multi-step checkout modal collecting shipping address and simulated payment selection (Credit Card or Cash on Delivery).
   - Real-time stock validation and transactional database insertion.
   - Dedicated **Order Confirmation screen** displaying the unique generated Order Number (e.g. `ORD-XXXX-XXXX`), itemized breakdown, and total paid.
   - **Order History View**: Logged-in users can view all past orders with status badges and date timestamps.

5. **Design Aesthetics & Visual Excellence**
   - Modern Glassmorphism aesthetic with subtle gradients and blur filters.
   - Dark Mode / Light Mode toggle with local persistence.
   - Modern typography (`Plus Jakarta Sans` and `Space Grotesk`).
   - Lucide icons and interactive micro-animations (badge pop, toast notifications, smooth drawer slide).

---

## 🛠️ Tech Stack

- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Design System, Glassmorphic UI), Modern JavaScript (ES6+).
- **Backend**: Node.js & Express.js REST API.
- **Database**: Native SQLite (`node:sqlite`) with WAL mode for zero external binary overhead.
- **Icons**: Lucide Icons CDN.

---

## 🚀 How to Run Locally

### 1. Navigate to the task1 folder:
```bash
cd task1
```

### 2. Install dependencies:
```bash
npm install
```

### 3. (Optional) Re-seed sample products & users:
```bash
npm run seed
```

### 4. Start the server:
```bash
npm start
```

### 5. Open the app in your browser:
Visit **[http://localhost:5000](http://localhost:5000)**

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port the server listens on. |
| `JWT_SECRET` | **Yes in production** | insecure dev fallback | HMAC secret used to sign session tokens. A warning is printed at startup if unset. Set it so tokens survive restarts and cannot be forged. |

```bash
# PowerShell
$env:JWT_SECRET = "a-long-random-string"; npm start
# bash
JWT_SECRET="a-long-random-string" npm start
```

---

## 🧪 Testing

Both servers must be running (`task1` on 5000 and `task2` on 5001) because the
suites exercise both applications end to end.

```bash
npm test              # functional end-to-end suite
npm run test:edge     # edge cases & security validation
npm run test:regression  # regression tests for previously fixed defects
npm run test:dom      # verifies every getElementById resolves in the markup
```

`npm run reset` deletes the SQLite database so it is rebuilt and re-seeded on the
next start. Useful after a run that consumed stock.

---

## 🔑 Demo Credentials

- **Email**: `demo@codealpha.com`
- **Password**: `password123`
- **Coupon Code**: `ALPHA10` (10% off entire order)

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login user & return bearer token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/products` | Retrieve products (supports `?category=`, `?search=`, `?sort=`) |
| `GET` | `/api/products/:id` | Retrieve product details with customer reviews |
| `POST` | `/api/products/:id/reviews` | Submit a customer rating & review |
| `POST` | `/api/orders` | Process and store a new checkout order |
| `GET` | `/api/orders` | Retrieve authenticated user's order history |
| `GET` | `/api/orders/:orderNumber` | Retrieve single order receipt details *(requires auth; owner only)* |

---

## 🔒 Security Notes

- Passwords are hashed with `scrypt` and a per-user random salt, and compared
  with `crypto.timingSafeEqual`.
- Session tokens are HMAC-SHA256 signed and expire after 7 days. Set
  `JWT_SECRET` in production; signature comparison is constant-time.
- Every SQL statement uses bound parameters. Search terms are passed as
  parameters, so user input is never concatenated into SQL.
- All user-supplied text is HTML-escaped before being rendered, and only
  `http(s)` URLs are accepted for image and link fields.
- Order placement runs inside a database transaction, so a failure part-way
  through cannot deduct stock without recording the order.
- `GET /api/orders/:orderNumber` requires authentication and only returns the
  order to its owner, because order numbers are otherwise guessable.
