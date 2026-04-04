require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'johnchihule',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'wabiz_db',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    release();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ============= REGISTRATION =============
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role',
      [email, hashedPassword, name]
    );
    
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= LOGIN =============
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= GET CURRENT USER =============
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= PAYMENTS =============
app.get('/api/payments/my-payments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/payments/recent', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/payments/revenue', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = $1 AND status = 'completed'", [req.user.userId]);
    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    res.json({ total: 0 });
  }
});

app.post('/api/payments/create-intent', authenticateToken, (req, res) => {
  res.json({ clientSecret: `mock_secret_${Date.now()}` });
});

app.post('/api/payments/confirm', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const result = await pool.query(
      `INSERT INTO payments (user_id, amount, status, payment_method, transaction_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, amount, 'completed', paymentMethod, `txn_${Date.now()}`]
    );
    res.json({ success: true, payment: result.rows[0] });
  } catch (error) {
    res.json({ success: true, payment: { id: Date.now(), amount, status: 'completed' } });
  }
});

// ============= SUBSCRIPTIONS =============
app.get('/api/subscriptions/my-subscriptions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/subscriptions/active', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 AND status = 'active' AND end_date > NOW() 
       ORDER BY end_date ASC LIMIT 1`,
      [req.user.userId]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.json(null);
  }
});

app.post('/api/subscriptions/create', authenticateToken, async (req, res) => {
  try {
    const { planName, durationMonths } = req.body;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);
    
    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, plan_name, status, start_date, end_date, auto_renew) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.userId, planName, 'active', startDate, endDate, true]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscriptions/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE subscriptions SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      ['cancelled', req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json({ message: 'Subscription cancelled', subscription: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= WHATSAPP =============
const whatsappHistory = [];

app.post('/api/whatsapp/send', authenticateToken, (req, res) => {
  const { to, message } = req.body;
  const messageId = `mock_${Date.now()}`;
  whatsappHistory.unshift({
    id: messageId,
    to,
    message,
    status: 'sent',
    userId: req.user.userId,
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, messageId, mode: 'mock' });
});

app.get('/api/whatsapp/history', authenticateToken, (req, res) => {
  const userMessages = whatsappHistory.filter(m => m.userId === req.user.userId);
  res.json(userMessages);
});

app.get('/api/whatsapp/templates', authenticateToken, (req, res) => {
  res.json([
    { id: 1, name: 'Payment Reminder', category: 'billing', message: 'Reminder: Your payment of ${{amount}} is due on {{date}}.' },
    { id: 2, name: 'Welcome Message', category: 'onboarding', message: 'Welcome {{name}}! Thank you for joining.' },
    { id: 3, name: 'Subscription Renewal', category: 'billing', message: 'Your subscription will renew on {{date}}.' }
  ]);
});

// ============= USER STATS =============
app.get('/api/users/stats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM users');
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    res.json({ total: 1 });
  }
});

app.get('/api/subscriptions/stats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) as active FROM subscriptions WHERE status = 'active' AND end_date > NOW()");
    res.json({ active: parseInt(result.rows[0].active) });
  } catch (error) {
    res.json({ active: 0 });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 WaBiz Pro Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔑 Test: test@example.com / password123\n`);
});