const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { authenticateToken } = require('../auth/middleware');

// Get my subscriptions
router.get('/my-subscriptions', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.findByUser(req.user.userId);
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active subscription
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findActive(req.user.userId);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create subscription
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { planName, durationMonths } = req.body;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);
    
    const subscription = await Subscription.create({
      userId: req.user.userId,
      planName,
      status: 'active',
      startDate,
      endDate,
      autoRenew: true
    });
    
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel subscription
router.post('/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.updateStatus(req.params.id, 'cancelled');
    res.json({ message: 'Subscription cancelled', subscription });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;