// server.js
const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ---------- Validate required environment variables ----------
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missing = requiredEnv.filter(env => !process.env[env]);
if (missing.length) {
  console.error(`❌ Missing required env variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ---------- Database setup ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Railway PostgreSQL
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(1);
});

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- Health check endpoint (no DB required) ----------
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------- Optional: Detailed health with DB check ----------
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db_connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: err.message });
  }
});

// ---------- Example protected route (demonstrates JWT_SECRET usage) ----------
app.get('/api/protected', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: 'Access granted', user: decoded });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

// ---------- Example login route (generates JWT) ----------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  // Replace with real user validation from database
  if (username === 'admin' && password === 'secret') {
    const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});