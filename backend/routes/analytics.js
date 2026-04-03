const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../auth/middleware');

// Get dashboard stats
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const payments = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = $1 AND status = 'completed'",
      [req.user.userId]
    );
    
    const activeSub = await pool.query(
      "SELECT COUNT(*) as count FROM subscriptions WHERE user_id = $1 AND status = 'active' AND end_date > NOW()",
      [req.user.userId]
    );
    
    const recentPayments = await pool.query(
      "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5",
      [req.user.userId]
    );
    
    res.json({
      totalRevenue: parseFloat(payments.rows[0].total),
      activeSubscriptions: parseInt(activeSub.rows[0].count),
      recentPayments: recentPayments.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin analytics (admin only)
router.get('/admin', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalRevenue = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'");
    const activeSubscriptions = await pool.query("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND end_date > NOW()");
    const monthlyRevenue = await pool.query(`
      SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as total
      FROM payments WHERE status = 'completed'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC LIMIT 12
    `);
    
    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
      activeSubscriptions: parseInt(activeSubscriptions.rows[0].count),
      monthlyRevenue: monthlyRevenue.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;