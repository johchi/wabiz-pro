const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { authenticateToken } = require('../auth/middleware');

// Initialize Twilio client if credentials exist
let client = null;
let isTwilioConfigured = false;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    isTwilioConfigured = true;
    console.log('✅ Twilio WhatsApp configured');
  } else {
    console.log('⚠️ Twilio not configured - using mock mode');
  }
} catch (error) {
  console.log('⚠️ Twilio configuration error - using mock mode');
}

// In-memory message store for demo (replace with database in production)
const messageHistory = [];

// Send WhatsApp message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { to, message, template } = req.body;
    
    // Validate phone number format
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(to)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Use country code + number (e.g., +1234567890)' 
      });
    }
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    let result;
    let messageId;
    
    if (isTwilioConfigured && client) {
      // Real WhatsApp sending via Twilio
      result = await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`
      });
      messageId = result.sid;
    } else {
      // Mock mode for development
      messageId = `mock_${Date.now()}`;
      console.log(`[WhatsApp Mock] Sending to ${to}: ${message}`);
    }
    
    // Store message in history
    const messageRecord = {
      id: messageId,
      to,
      message,
      template: template || 'custom',
      status: 'sent',
      userId: req.user.userId,
      timestamp: new Date().toISOString()
    };
    messageHistory.unshift(messageRecord);
    
    // Keep only last 100 messages
    if (messageHistory.length > 100) messageHistory.pop();
    
    res.json({ 
      success: true, 
      messageId,
      mode: isTwilioConfigured ? 'live' : 'mock'
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({ 
      error: isTwilioConfigured ? error.message : 'Mock mode: Message would be sent here' 
    });
  }
});

// Get message history for user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userMessages = messageHistory.filter(m => m.userId === req.user.userId);
    res.json(userMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook for incoming WhatsApp messages (Twilio will call this)
router.post('/webhook', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const incomingMsg = req.body.Body;
    const sender = req.body.From;
    const senderNumber = sender.replace('whatsapp:', '');
    
    console.log(`📱 Incoming WhatsApp from ${senderNumber}: ${incomingMsg}`);
    
    // Auto-reply logic
    let reply = "Thank you for your message! Our team will respond shortly.\n\nFor payments: reply with PAYMENT\nFor subscriptions: reply with SUBSCRIPTION\nFor support: reply with SUPPORT";
    
    const lowerMsg = incomingMsg.toLowerCase();
    
    if (lowerMsg.includes('payment') || lowerMsg === 'payment') {
      reply = "💳 To make a payment:\n1. Visit our website\n2. Go to Payments section\n3. Enter amount and card details\n\nNeed help? Reply with HELP";
    } else if (lowerMsg.includes('subscription') || lowerMsg === 'subscription') {
      reply = "📋 Subscription Plans:\n• Basic - $9.99/month\n• Pro - $29.99/month\n• Enterprise - $99.99/month\n\nReply with PLAN NAME to subscribe";
    } else if (lowerMsg.includes('support') || lowerMsg === 'support') {
      reply = "🆘 Support Team:\n• Email: support@wabiz.com\n• Hours: 9AM-6PM Mon-Fri\n• Response time: < 2 hours\n\nWhat issue are you experiencing?";
    } else if (lowerMsg.includes('help')) {
      reply = "Available commands:\n• PAYMENT - Payment info\n• SUBSCRIPTION - Plan details\n• SUPPORT - Contact support\n• STATUS - Account status\n• CANCEL - Cancel subscription";
    } else if (lowerMsg.includes('status')) {
      reply = "✅ Your account is active and in good standing. Next payment due: April 30, 2026";
    }
    
    // Send auto-reply if Twilio is configured
    if (isTwilioConfigured && client) {
      await client.messages.create({
        body: reply,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${senderNumber}`
      });
    }
    
    // Store incoming message
    messageHistory.unshift({
      id: `inbound_${Date.now()}`,
      from: senderNumber,
      message: incomingMsg,
      reply,
      timestamp: new Date().toISOString(),
      type: 'incoming'
    });
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Get templates
router.get('/templates', authenticateToken, (req, res) => {
  const templates = [
    { 
      id: 1, 
      name: 'Payment Reminder', 
      category: 'billing',
      message: 'Dear customer, this is a reminder that your payment of ${{amount}} is due on {{date}}. Please make your payment to avoid service interruption.\n\nPay here: {{payment_link}}'
    },
    { 
      id: 2, 
      name: 'Subscription Renewal', 
      category: 'billing',
      message: 'Your {{plan}} subscription will renew on {{date}}. Amount: ${{amount}}. Thank you for being a valued customer!'
    },
    { 
      id: 3, 
      name: 'Welcome Message', 
      category: 'onboarding',
      message: 'Welcome to WaBiz Pro, {{name}}! We\'re excited to have you on board. Your account is now active. Need help? Reply with HELP'
    },
    { 
      id: 4, 
      name: 'Invoice', 
      category: 'billing',
      message: 'Your invoice #{{invoice_number}} for ${{amount}} is now available. Due date: {{due_date}}. Please log in to your dashboard to view and pay.'
    },
    { 
      id: 5, 
      name: 'Payment Confirmation', 
      category: 'billing',
      message: '✅ Payment received! Thank you for your payment of ${{amount}}. Transaction ID: {{transaction_id}}'
    },
    { 
      id: 6, 
      name: 'Account Alert', 
      category: 'security',
      message: '🔐 Security Alert: New login detected from {{location}} at {{time}}. If this wasn\'t you, please reply with SECURITY'
    }
  ];
  res.json(templates);
});

// Broadcast message to multiple users (admin only)
router.post('/broadcast', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { numbers, message } = req.body;
    
    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({ error: 'Provide array of phone numbers' });
    }
    
    const results = [];
    
    for (const number of numbers) {
      try {
        let result;
        if (isTwilioConfigured && client) {
          result = await client.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${number}`
          });
        } else {
          result = { sid: `mock_${Date.now()}_${number}` };
        }
        
        results.push({ number, success: true, messageId: result.sid });
      } catch (error) {
        results.push({ number, success: false, error: error.message });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;