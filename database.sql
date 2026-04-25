-- ============================================
--  CANTIFY - Smart Canteen Management System
--  Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS cantify_db;
USE cantify_db;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    is_available TINYINT(1) DEFAULT 1,
    prep_time INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','preparing','ready','completed','cancelled') DEFAULT 'pending',
    pickup_time VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
--  SEED DATA
-- ============================================

-- Default Admin
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- password: password

-- Categories
INSERT INTO categories (name, icon) VALUES
('Snacks', '🍟'),
('Drinks', '🥤'),
('Waffles', '🧇'),
('Fast Food', '🍕');

-- Menu Items
INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time) VALUES
(1, 'Samosa', 'Crispy golden samosa with green chutney', 15.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 5),
(1, 'Bread Pakoda', 'Spicy bread pakoda with mint chutney', 20.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', 7),
(1, 'Veg Puff', 'Flaky pastry with spiced vegetable filling', 18.00, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 6),
(1, 'Poha', 'Flattened rice with peas and spices', 25.00, 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400', 8),
(2, 'Masala Chai', 'Hot spiced Indian tea', 12.00, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', 3),
(2, 'Cold Coffee', 'Chilled coffee with milk and ice cream', 45.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', 5),
(2, 'Fresh Lime Soda', 'Refreshing lime soda sweet or salty', 30.00, 'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=400', 3),
(2, 'Mango Shake', 'Thick creamy mango milkshake', 50.00, 'https://images.unsplash.com/photo-1553530666-ba11a90bb517?w=400', 5),
(3, 'Classic Waffle', 'Belgian waffle with maple syrup and butter', 60.00, 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400', 10),
(3, 'Choco Waffle', 'Waffle topped with chocolate sauce and sprinkles', 75.00, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', 12),
(3, 'Fruit Waffle', 'Fresh fruit waffle with cream', 80.00, 'https://images.unsplash.com/photo-1484723091739-30990ceaed1b?w=400', 12),
(4, 'Veg Burger', 'Crispy patty with fresh veggies and sauce', 70.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 12),
(4, 'Margherita Pizza', 'Classic tomato and mozzarella pizza', 120.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 15),
(4, 'French Fries', 'Crispy golden fries with ketchup', 55.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', 8),
(4, 'Paneer Wrap', 'Grilled paneer with veggies in tortilla', 85.00, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', 10);
