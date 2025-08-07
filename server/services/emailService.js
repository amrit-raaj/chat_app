const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendVerificationEmail(email, username, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Chat App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address - Chat App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1976d2, #42a5f5);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #1976d2;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Chat App!</h1>
            <p>Please verify your email address</p>
          </div>
          
          <div class="content">
            <h2>Hello ${username}!</h2>
            
            <p>Thank you for registering with Chat App. To complete your registration and start chatting, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            
            <div class="warning">
              <strong>Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to register again.
            </div>
            
            <p>If you didn't create an account with Chat App, please ignore this email.</p>
            
            <p>Best regards,<br>The Chat App Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2025 Chat App. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, username) {
    const mailOptions = {
      from: `"Chat App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Chat App!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Chat App</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4caf50, #81c784);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .feature {
              background: white;
              padding: 15px;
              margin: 10px 0;
              border-radius: 5px;
              border-left: 4px solid #1976d2;
            }
            .button {
              display: inline-block;
              background: #1976d2;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Chat App!</h1>
            <p>Your email has been verified successfully</p>
          </div>
          
          <div class="content">
            <h2>Hello ${username}!</h2>
            
            <p>Congratulations! Your email has been verified and your Chat App account is now active. You can start connecting with friends and colleagues right away.</p>
            
            <h3>What you can do now:</h3>
            
            <div class="feature">
              <strong>💬 Start Chatting:</strong> Send real-time messages to other users
            </div>
            
            <div class="feature">
              <strong>🔍 Find Friends:</strong> Search for users by username or email
            </div>
            
            <div class="feature">
              <strong>🌙 Dark Mode:</strong> Toggle between light and dark themes
            </div>
            
            <div class="feature">
              <strong>📱 Real-time Updates:</strong> See when users are online and typing
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="button">Start Chatting Now</a>
            </div>
            
            <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
            
            <p>Happy chatting!<br>The Chat App Team</p>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
