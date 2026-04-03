const { pool } = require('../config/database');

class Subscription {
  static async create({ userId, planName, status, startDate, endDate, autoRenew = false }) {
    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, plan_name, status, start_date, end_date, auto_renew) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, planName, status, startDate, endDate, autoRenew]
    );
    return result.rows[0];
  }

  static async findByUser(userId) {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async findActive(userId) {
    const result = await pool.query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 AND status = 'active' AND end_date > NOW() 
       ORDER BY end_date ASC`,
      [userId]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE subscriptions SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async renew(id, newEndDate) {
    const result = await pool.query(
      'UPDATE subscriptions SET status = $1, end_date = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      ['active', newEndDate, id]
    );
    return result.rows[0];
  }

  static async getExpiringSoon(days = 7) {
    const result = await pool.query(
      `SELECT s.*, u.email, u.name FROM subscriptions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.status = 'active' AND s.end_date BETWEEN NOW() AND NOW() + INTERVAL '${days} days'`,
      []
    );
    return result.rows;
  }
}

module.exports = Subscription;