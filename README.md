# 🍽️ CANTIFY — Smart Canteen Management System
### "No more wait, just order straight."

---

## 📁 FILE STRUCTURE

```
cantify/
│
├── index.html                ← Main website (all pages in one file)
├── database.sql              ← Run this to set up the database
├── README.md                 ← This file
│
├── assets/
│   ├── css/
│   │   └── style.css         ← All CSS styles
│   └── js/
│       ├── main.js           ← Main frontend logic (cart, auth, menu, orders)
│       └── admin.js          ← Admin panel logic
│
└── php/
    ├── config.php            ← Database connection (EDIT THIS FIRST)
    ├── auth.php              ← Login, Signup, Logout, Session check
    ├── menu.php              ← Get/Add/Edit/Delete menu items
    ├── orders.php            ← Place/Get orders, Update status
    ├── feedback.php          ← Submit/Get feedback
    └── contact.php           ← Submit/Get contact messages
```

---

## 🚀 HOW TO RUN — STEP BY STEP

### REQUIREMENTS:
- XAMPP (recommended) or WAMP or MAMP
- A web browser (Chrome, Firefox, Edge)

---

### STEP 1 — Install XAMPP

1. Download XAMPP from: https://www.apachefriends.org
2. Install it (default settings are fine)
3. Open **XAMPP Control Panel**
4. Click **Start** next to **Apache**
5. Click **Start** next to **MySQL**
6. Both should show green ✅

---

### STEP 2 — Copy Project Files

1. Go to: `C:\xampp\htdocs\` (on Windows) or `/Applications/XAMPP/htdocs/` (on Mac)
2. Create a folder called **cantify**
3. Copy ALL project files into that folder
4. Structure should be: `C:\xampp\htdocs\cantify\index.html`

---

### STEP 3 — Set Up Database

1. Open your browser and go to: http://localhost/phpmyadmin
2. Click **New** in the left sidebar
3. OR just go to http://localhost/phpmyadmin and click the **SQL** tab
4. Copy the ENTIRE contents of `database.sql`
5. Paste it into the SQL text box
6. Click **Go** button
7. You should see "15 queries executed successfully" ✅

---

### STEP 4 — Configure Database Connection

Open the file: `php/config.php`

Change these values to match your setup:
```php
define('DB_HOST', 'localhost');  // Usually 'localhost' — don't change
define('DB_USER', 'root');       // Your MySQL username (default: root)
define('DB_PASS', '');           // Your MySQL password (default: empty '')
define('DB_NAME', 'cantify_db'); // Don't change this
```

**For most XAMPP setups, the default values work fine without any changes.**

---

### STEP 5 — Open the Website

Go to: **http://localhost/cantify/**

The CANTIFY website should load! 🎉

---

## 🔐 LOGIN CREDENTIALS

### Admin Account (pre-created):
- **Email:** admin@gmail.com
- **Password:** password

### Create Student Account:
- Sign up with an email ending in:
  - `@charusat.edu.in` → Student access
  - `@charusat.ac.in`  → Student access
  - Any other email   → Admin access

---

## 📄 WHAT EACH FILE DOES

### `index.html`
The entire website in one file. Contains all pages:
- Auth (Login/Signup)
- Home
- Menu
- Cart
- My Orders
- About Us
- Contact Us
- Admin Panel

### `assets/css/style.css`
All visual styling — colors, layouts, animations, responsive design.

### `assets/js/main.js`
All user-facing JavaScript:
- Authentication (login/signup/logout)
- Menu loading and filtering
- Cart management (add/remove/update)
- Order placement and bill generation
- Feedback modal
- Contact form
- Toast notifications
- Page navigation

### `assets/js/admin.js`
Admin panel JavaScript:
- Dashboard statistics
- Menu item CRUD (Create, Read, Update, Delete)
- Order management and status updates
- View feedback
- View contact messages

### `php/config.php`
Database connection settings. **Edit this file with your MySQL credentials.**

### `php/auth.php`
Handles:
- `action=register` — Create new account
- `action=login`    — Login
- `action=logout`   — Logout
- `action=check`    — Check if session exists

### `php/menu.php`
Handles:
- `action=get_all`        — Get all available menu items
- `action=get_categories` — Get categories list
- `action=add`            — Admin: Add item
- `action=update`         — Admin: Edit item
- `action=delete`         — Admin: Remove item
- `action=admin_get_all`  — Admin: Get all items including unavailable

### `php/orders.php`
Handles:
- `action=place`          — Place a new order
- `action=my_orders`      — Get current user's orders
- `action=all_orders`     — Admin: Get all orders
- `action=update_status`  — Admin: Change order status

### `php/feedback.php`
Handles:
- `action=submit`   — Submit feedback after order
- `action=get_all`  — Admin: View all feedback

### `php/contact.php`
Handles:
- `action=submit`   — Submit contact form
- `action=get_all`  — Admin: View all messages

### `database.sql`
Creates the full database with:
- `users` table
- `categories` table
- `menu_items` table
- `orders` table
- `order_items` table
- `feedback` table
- `contacts` table
- Pre-seeded categories and 15 menu items
- Default admin account

---

## 🔧 TROUBLESHOOTING

### "Cannot connect to database"
→ Make sure MySQL is running in XAMPP
→ Check credentials in `php/config.php`
→ Make sure you ran `database.sql` in phpMyAdmin

### "Page not found" (404)
→ Make sure Apache is running in XAMPP
→ Make sure files are in `C:\xampp\htdocs\cantify\`
→ URL should be `http://localhost/cantify/`

### "Login not working"
→ Make sure you ran the database.sql first
→ Try the default admin: admin@gmail.com / password

### Images not loading
→ The system uses Unsplash URLs which require internet
→ Make sure you have an internet connection

### "Bill doesn't download"
→ Allow pop-ups for localhost in your browser settings
→ The bill opens in a new tab and triggers browser print/save dialog

---

## 🌟 FEATURES SUMMARY

| Feature | Description |
|---------|-------------|
| Smart Auth | Email-based role detection (student vs admin) |
| Dark Theme | Professional dark UI with pastel accents |
| Full Menu | 4 categories, 15+ items, filterable |
| Cart System | Add/remove items, real-time updates |
| Sticky Cart Bar | Swiggy-style bottom cart preview |
| Order Placement | Places order and generates bill |
| Bill/Invoice | Opens printable PDF-style invoice |
| Feedback | Star rating + review after every order |
| My Orders | Current orders + full history |
| Admin Panel | Full CRUD for menu, view all orders |
| Order Status | Admin can update status in real-time |
| Responsive | Works on mobile + desktop |
| Animations | Smooth page transitions and hover effects |

---

Built with ❤️ using HTML, CSS, JavaScript, PHP & MySQL
CHARUSAT University — Smart Campus Initiative
