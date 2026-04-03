const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const generateDemoData = async () => {
  console.log('📊 Generating demo data...');
  
  try {
    // Create demo users
    const demoUsers = [
      { email: 'admin@wabiz.com', password: 'admin123', name: 'Admin User', role: 'admin' },
      { email: 'john@example.com', password: 'password123', name: 'John Doe', role: 'user' },
      { email: 'jane@example.com', password: 'password123', name: 'Jane Smith', role: 'user' }
    ];
    
    for (const user of demoUsers) {
      const existing = await pool.query('SELECT * FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query(
          'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
          [user.email, hashedPassword, user.name, user.role]
        );
        console.log(`✅ Created user: ${user.email}`);
      }
    }
    
    // Generate sample payments
    const payments = [
      { user_id: 2, amount: 99.99, status: 'completed', payment_method: 'credit_card' },
      { user_id: 2, amount: 49.99, status: 'completed', payment_method: 'paypal' },
      { user_id: 3, amount: 199.99, status: 'pending', payment_method: 'bank_transfer' },
      { user_id: 3, amount: 29.99, status: 'completed', payment_method: 'credit_card' }
    ];
    
    for (const payment of payments) {
      await pool.query(
        `INSERT INTO payments (user_id, amount, status, payment_method, transaction_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [payment.user_id, payment.amount, payment.status, payment.payment_method, `demo_${Date.now()}`]
      );
    }
    
    console.log('✅ Demo data generated successfully!');
  } catch (error) {
    console.error('Failed to generate demo data:', error);
  }
};

module.exports = { generateDemoData };