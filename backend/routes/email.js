const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { authenticateToken } = require('../auth/middleware');

// Configure email transporter
let transporter = null;
let isEmailConfigured = false;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    isEmailConfigured = true;
    console.log('✅ Email notifications configured');
  } else {
    console.log('⚠️ Email not configured - using mock mode');
  }
} catch (error) {
  console.log('⚠️ Email configuration error - using mock mode');
}

// Send payment confirmation email
router.post('/send-payment-confirmation', authenticateToken, async (req, res) => {
  try {
    const { email, amount, transactionId, description } = req.body;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
          <h1 style="color: white;">Payment Confirmation</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <p>Dear Customer,</p>
          <p>Thank you for your payment. Your transaction has been completed successfully.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Amount:</strong> $${amount}</p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Description:</strong> ${description || 'Payment'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>View your transaction history in your dashboard.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://yourdomain.com/dashboard" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </div>
          
          <hr style="margin: 20px 0;" />
          
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    
    let result;
    if (isEmailConfigured && transporter) {
      result = await transporter.sendMail({
        from: `"WaBiz Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Payment Confirmation - WaBiz Pro',
        html: emailHtml
      });
    } else {
      console.log(`[Email Mock] Would send to ${email}: Payment confirmation for $${amount}`);
      result = { messageId: `mock_${Date.now()}` };
    }
    
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send subscription reminder
router.post('/send-subscription-reminder', authenticateToken, async (req, res) => {
  try {
    const { email, planName, endDate, daysRemaining } = req.body;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #F59E0B; padding: 20px; text-align: center;">
          <h1 style="color: white;">Subscription Reminder</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <p>Dear Customer,</p>
          <p>This is a reminder that your <strong>${planName}</strong> subscription will expire in <strong>${daysRemaining} days</strong>.</p>
          
          <div style="background-color: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Expiration Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
            <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
          </div>
          
          <p>To avoid service interruption, please renew your subscription.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://yourdomain.com/subscriptions" style="background-color: #F59E0B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Renew Now
            </a>
          </div>
          
          <hr style="margin: 20px 0;" />
          
          <p style="color: #6b7280; font-size: 12px;">
            If you've already renewed, please ignore this message.
          </p>
        </div>
      </div>
    `;
    
    if (isEmailConfigured && transporter) {
      await transporter.sendMail({
        from: `"WaBiz Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Subscription Renewal Reminder - WaBiz Pro',
        html: emailHtml
      });
    } else {
      console.log(`[Email Mock] Would send subscription reminder to ${email}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send welcome email
router.post('/send-welcome', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10B981; padding: 20px; text-align: center;">
          <h1 style="color: white;">Welcome to WaBiz Pro!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <p>Dear ${name || 'Customer'},</p>
          <p>Thank you for joining WaBiz Pro! We're excited to have you on board.</p>
          
          <div style="margin: 20px 0;">
            <h3>Getting Started:</h3>
            <ul>
              <li>Complete your profile</li>
              <li>Set up your payment method</li>
              <li>Explore the dashboard</li>
              <li>Connect WhatsApp for customer support</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://yourdomain.com/dashboard" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Go to Dashboard
            </a>
          </div>
          
          <p>Need help? Contact our support team anytime.</p>
        </div>
      </div>
    `;
    
    if (isEmailConfigured && transporter) {
      await transporter.sendMail({
        from: `"WaBiz Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to WaBiz Pro!',
        html: emailHtml
      });
    } else {
      console.log(`[Email Mock] Would send welcome email to ${email}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;