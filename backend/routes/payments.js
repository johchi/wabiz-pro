const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware');

// In-memory storage for mock mode
const payments = [];

// Check if Stripe is configured
let stripe = null;
let isStripeConfigured = false;

try {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    isStripeConfigured = true;
    console.log('✅ Stripe configured for payments');
  } else {
    console.log('⚠️ Stripe not configured - using mock payment mode');
  }
} catch (error) {
  console.log('⚠️ Stripe configuration error - using mock payment mode');
}

// Create payment intent (for Stripe)
router.post('/create-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (isStripeConfigured && stripe) {
      // Real Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: {
          userId: req.user.userId,
          userEmail: req.user.email
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        mode: 'live'
      });
    } else {
      // Mock payment intent for testing
      res.json({ 
        clientSecret: `mock_secret_${Date.now()}_${req.user.userId}`,
        mode: 'mock'
      });
    }
  } catch (error) {
    console.error('Create intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment (for mock mode)
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod, description } = req.body;
    
    // Create payment record
    const payment = {
      id: payments.length + 1,
      user_id: req.user.userId,
      amount: amount,
      status: 'completed',
      payment_method: paymentMethod || 'card',
      transaction_id: `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: description || 'Payment via mock mode',
      created_at: new Date().toISOString()
    };
    
    payments.push(payment);
    
    res.json({ 
      success: true, 
      payment,
      mode: 'mock'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook for Stripe (real payments)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isStripeConfigured) {
    return res.json({ received: true, mode: 'mock' });
  }
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const payment = {
      id: payments.length + 1,
      user_id: parseInt(paymentIntent.metadata.userId),
      amount: paymentIntent.amount / 100,
      status: 'completed',
      payment_method: 'stripe',
      transaction_id: paymentIntent.id,
      description: 'Payment via Stripe',
      created_at: new Date().toISOString()
    };
    payments.push(payment);
    console.log('✅ Payment recorded:', payment);
  }

  res.json({ received: true });
});

// Get user payments
router.get('/my-payments', authenticateToken, async (req, res) => {
  try {
    const userPayments = payments.filter(p => p.user_id === req.user.userId);
    res.json(userPayments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent payments (for dashboard)
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const userPayments = payments
      .filter(p => p.user_id === req.user.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
    res.json(userPayments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total revenue
router.get('/revenue', authenticateToken, async (req, res) => {
  try {
    const total = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a test payment (for demo)
router.post('/test-payment', authenticateToken, async (req, res) => {
  try {
    const { amount = 99.99 } = req.body;
    
    const payment = {
      id: payments.length + 1,
      user_id: req.user.userId,
      amount: amount,
      status: 'completed',
      payment_method: 'test_card',
      transaction_id: `test_txn_${Date.now()}`,
      description: 'Test payment - demo mode',
      created_at: new Date().toISOString()
    };
    
    payments.push(payment);
    
    res.json({ 
      success: true, 
      payment,
      message: 'Test payment successful!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;