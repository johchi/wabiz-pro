const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../auth/middleware');

// Get user invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate invoice for payment
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const result = await pool.query(
      `INSERT INTO invoices (user_id, invoice_number, amount, status, due_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, invoiceNumber, amount, 'paid', new Date()]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;