import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

/**
 * Email Service
 * Handles sending emails for notifications
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'noreply@cryptowallet.com';
  }

  /**
   * Initialize email transporter
   */
  async initialize() {
    try {
      // For development: Use Gmail or Ethereal (fake SMTP)
      if (process.env.NODE_ENV === 'production') {
        // Production: Use real SMTP (Gmail, SendGrid, etc.)
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // Development: Use Ethereal (fake SMTP for testing)
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        
        logger.info('📧 Email service initialized (Development Mode - Ethereal)');
        logger.info(`📧 Test email credentials: ${testAccount.user}`);
      }

      logger.info('✅ Email service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
      // Don't throw - email is non-critical
    }
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not initialized, skipping email');
        return null;
      }

      const mailOptions = {
        from: `"NLP Crypto Wallet" <${this.from}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('✅ Email sent successfully', {
        to,
        subject,
        messageId: info.messageId
      });

      // For development, log the preview URL
      if (process.env.NODE_ENV !== 'production') {
        logger.info('📧 Preview URL: ' + nodemailer.getTestMessageUrl(info));
      }

      return info;
    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      return null;
    }
  }

  /**
   * Convert HTML to plain text (basic)
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to NLP Crypto Wallet! 🎉';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .wallet-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to NLP Crypto Wallet!</h1>
            <p>Your intelligent crypto companion</p>
          </div>
          
          <div class="content">
            <h2>Hi ${user.name}! 👋</h2>
            
            <p>Welcome aboard! Your crypto wallet has been created successfully.</p>
            
            <div class="wallet-info">
              <strong>📱 Your Wallet Address:</strong><br>
              <code style="font-size: 12px; word-break: break-all;">${user.walletAddress}</code>
            </div>
            
            <h3>🚀 Getting Started:</h3>
            <ul>
              <li>✅ Your wallet is secured with encrypted private keys</li>
              <li>💬 Use AI chat to manage transactions naturally</li>
              <li>👥 Add contacts for easier sending</li>
              <li>🔄 Swap tokens directly in the app</li>
              <li>🎯 Try demo mode to explore features risk-free</li>
            </ul>
            
            <h3>⚠️ Security Tips:</h3>
            <ul>
              <li>Never share your password with anyone</li>
              <li>Enable demo mode for testing</li>
              <li>Always verify transaction details before confirming</li>
              <li>Keep your recovery phrase safe (we'll add this feature soon)</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
              Open Dashboard →
            </a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Questions? Reply to this email or check our documentation.
            </p>
          </div>
          
          <div class="footer">
            <p>NLP Crypto Wallet - Your Intelligent Crypto Companion</p>
            <p style="font-size: 12px;">This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(user, transaction) {
    const isSent = transaction.type === 'sent';
    const subject = isSent 
      ? `Transaction Sent: ${transaction.value} ${transaction.token || 'ETH'}`
      : `Transaction Received: ${transaction.value} ${transaction.token || 'ETH'}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isSent ? '#f97316' : '#10b981'}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .tx-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .tx-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .tx-row:last-child { border-bottom: none; }
          .amount { font-size: 24px; font-weight: bold; color: ${isSent ? '#f97316' : '#10b981'}; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isSent ? '📤' : '📥'} Transaction ${isSent ? 'Sent' : 'Received'}</h1>
          </div>
          
          <div class="content">
            <p class="amount">${isSent ? '-' : '+'} ${transaction.value} ${transaction.token || 'ETH'}</p>
            
            <div class="tx-details">
              <div class="tx-row">
                <span><strong>Status:</strong></span>
                <span style="color: ${transaction.status === 'success' ? '#10b981' : '#f59e0b'};">
                  ${transaction.status === 'success' ? '✅ Confirmed' : '⏳ Pending'}
                </span>
              </div>
              
              <div class="tx-row">
                <span><strong>${isSent ? 'To:' : 'From:'}</strong></span>
                <span style="font-family: monospace; font-size: 12px;">
                  ${isSent ? transaction.to : transaction.from}
                </span>
              </div>
              
              <div class="tx-row">
                <span><strong>Network:</strong></span>
                <span>${transaction.network}</span>
              </div>
              
              <div class="tx-row">
                <span><strong>Transaction Hash:</strong></span>
                <span style="font-family: monospace; font-size: 12px;">
                  ${transaction.hash.slice(0, 10)}...${transaction.hash.slice(-8)}
                </span>
              </div>
              
              <div class="tx-row">
                <span><strong>Gas Used:</strong></span>
                <span>${transaction.gasUsed}</span>
              </div>
              
              <div class="tx-row">
                <span><strong>Date:</strong></span>
                <span>${new Date(transaction.timestamp).toLocaleString()}</span>
              </div>
            </div>
            
            ${transaction.network !== 'demo' ? `
              <a href="https://${transaction.network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/tx/${transaction.hash}" class="button">
                View on Explorer →
              </a>
            ` : ''}
            
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              This notification was sent because you have email notifications enabled.
            </p>
          </div>
          
          <div class="footer">
            <p>NLP Crypto Wallet</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send low balance alert
   */
  async sendLowBalanceAlert(user, balance, threshold = 0.01) {
    const subject = '⚠️ Low Balance Alert';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Balance Alert</h1>
          </div>
          
          <div class="content">
            <p>Hi ${user.name},</p>
            
            <div class="alert-box">
              <strong>Your wallet balance is running low!</strong><br>
              Current balance: <strong>${balance} ETH</strong><br>
              Threshold: ${threshold} ETH
            </div>
            
            <p>You may not have enough balance to complete transactions or pay for gas fees.</p>
            
            <h3>💡 What to do:</h3>
            <ul>
              <li>Add funds to your wallet</li>
              <li>Use testnet faucets for Sepolia ETH (free)</li>
              <li>Enable demo mode for testing without real funds</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
              Check Dashboard →
            </a>
          </div>
          
          <div class="footer">
            <p>NLP Crypto Wallet</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Password Reset Request';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hi ${user.name},</p>
            
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p style="font-size: 14px; color: #6b7280;">
              Or copy this link:<br>
              <code style="word-break: break-all;">${resetUrl}</code>
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link expires in 1 hour. If you didn't request this, please ignore this email.
            </div>
            
            <p style="margin-top: 20px; font-size: 14px;">
              For security reasons, your private key remains encrypted and cannot be reset.
            </p>
          </div>
          
          <div class="footer">
            <p>NLP Crypto Wallet</p>
            <p style="font-size: 12px;">If you didn't request this, please contact support immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummary(user, stats) {
    const subject = '📊 Your Weekly Wallet Summary';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background: white; padding: 20px; border-radius: 5px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .stat-label { font-size: 14px; color: #6b7280; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Summary</h1>
            <p>Your wallet activity this week</p>
          </div>
          
          <div class="content">
            <p>Hi ${user.name},</p>
            
            <p>Here's your wallet activity for the past week:</p>
            
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">${stats.totalTransactions || 0}</div>
                <div class="stat-label">Total Transactions</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">${stats.sent || 0}</div>
                <div class="stat-label">Sent</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">${stats.received || 0}</div>
                <div class="stat-label">Received</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">${stats.swaps || 0}</div>
                <div class="stat-label">Swaps</div>
              </div>
            </div>
            
            <p><strong>Current Balance:</strong> ${stats.currentBalance || '0'} ETH</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Keep up the great work managing your crypto!
            </p>
          </div>
          
          <div class="footer">
            <p>NLP Crypto Wallet</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

const emailService = new EmailService();
export default emailService;
