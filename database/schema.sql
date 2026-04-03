-- Create database
CREATE DATABASE wabiz_db;

-- Connect to database
\c wabiz_db;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'inactive',
  start_date DATE,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Insert sample data
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@wabiz.com', '$2a$10$YourHashedPasswordHere', 'Admin User', 'admin'),
('user@wabiz.com', '$2a$10$YourHashedPasswordHere', 'Test User', 'user');

-- Insert sample payments
INSERT INTO payments (user_id, amount, status, payment_method, transaction_id) VALUES 
(1, 99.99, 'completed', 'stripe', 'txn_123456'),
(1, 49.99, 'pending', 'paypal', 'txn_789012');

-- Insert sample subscriptions
INSERT INTO subscriptions (user_id, plan_name, status, start_date, end_date, auto_renew) VALUES 
(1, 'Pro Plan', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true);