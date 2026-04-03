const { pool } = require('../config/database');

const logActivity = async (userId, action, details = {}, ipAddress = null, userAgent = null) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = { logActivity };