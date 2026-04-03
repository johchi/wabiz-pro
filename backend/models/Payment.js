const { pool } = require('../config/database');

class Payment {
  static async create({ userId, amount, status, paymentMethod, transactionId, description }) {
    const result = await pool.query(
      `INSERT INTO payments (user_id, amount, status, payment_method, transaction_id, description) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, amount, status, paymentMethod, transactionId, description]
    );
    return result.rows[0];
  }

  static async findByUser(userId) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT p.*, u.name, u.email FROM payments p JOIN users u ON p.user_id = u.id WHERE p.id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, transactionId = null) {
    const result = await pool.query(
      `UPDATE payments SET status = $1, transaction_id = COALESCE($2, transaction_id) 
       WHERE id = $3 RETURNING *`,
      [status, transactionId, id]
    );
    return result.rows[0];
  }

  static async getTotalRevenue() {
    const result = await pool.query(
      "SELECT SUM(amount) as total FROM payments WHERE status = 'completed'"
    );
    return result.rows[0].total || 0;
  }
}

module.exports = Payment;