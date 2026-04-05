require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

// ==================== DATABASE CONNECTION ====================
let pool;

const createPool = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  
  return new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'wabiz_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
  });
};

pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

const testDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
};
testDB();

// ==================== HEALTH CHECK ====================
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured!');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ==================== REGISTRATION ====================
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
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, 'user']
    );
    
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ==================== LOGIN ====================
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ==================== GET CURRENT USER ====================
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, phone, company, avatar_url, email_verified, last_login FROM users WHERE id = $1', 
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== PAYMENTS ====================
app.get('/api/payments/my-payments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.post('/api/payments/confirm', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const result = await pool.query(
      `INSERT INTO payments (user_id, amount, status, payment_method, transaction_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [req.user.userId, amount, 'completed', paymentMethod, `txn_${Date.now()}`]
    );
    res.json({ success: true, payment: result.rows[0] });
  } catch (error) {
    console.error('Payment confirm error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// ==================== SUBSCRIPTIONS ====================
app.get('/api/subscriptions/my-subscriptions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.post('/api/subscriptions/create', authenticateToken, async (req, res) => {
  try {
    const { planName, durationMonths } = req.body;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));
    
    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, plan_name, status, start_date, end_date, auto_renew, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [req.user.userId, planName, 'active', startDate, endDate, true]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Subscription create error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`\n🚀 WaBiz Pro Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}\n`);
});