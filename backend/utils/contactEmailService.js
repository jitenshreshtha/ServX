// utils/contactEmailService.js
const sgMail = require('@sendgrid/mail');

// Use your existing SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send contact form email to admin
const sendContactEmail = async (contactData) => {
  const { name, email, message, subject = 'New Contact Form Submission' } = contactData;
  
  const msg = {
    to: process.env.ADMIN_EMAIL,
    from: {
      email: process.env.ADMIN_EMAIL, // Must be verified sender in SendGrid
      name: 'ServX Contact Form'
    },
    replyTo: {
      email: email,
      name: name
    },
    subject: `ServX Contact: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form Submission</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px 20px;
          }
          .field {
            margin-bottom: 20px;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 15px;
          }
          .field:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .label {
            font-weight: 600;
            color: #495057;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            display: block;
          }
          .value {
            background: #f8f9fa;
            padding: 12px 16px;
            border-radius: 6px;
            border-left: 4px solid #0d6efd;
            font-size: 15px;
            word-wrap: break-word;
          }
          .message-value {
            white-space: pre-wrap;
            line-height: 1.5;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 0;
            color: #6c757d;
            font-size: 13px;
          }
          .badge {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          .logo {
            width: 40px;
            height: 40px;
            background-color: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            font-size: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📧</div>
            <h1>New Contact Form Submission</h1>
            <p>ServX Platform</p>
          </div>
          
          <div class="content">
            <div class="field">
              <span class="label">From</span>
              <div class="value">${name}</div>
            </div>
            
            <div class="field">
              <span class="label">Email Address</span>
              <div class="value">${email}</div>
            </div>
            
            <div class="field">
              <span class="label">Subject</span>
              <div class="value">${subject}</div>
            </div>
            
            <div class="field">
              <span class="label">Message</span>
              <div class="value message-value">${message}</div>
            </div>
            
            <div class="field">
              <span class="label">Received At</span>
              <div class="value">
                ${new Date().toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>ServX Contact Form</strong></p>
            <p>You can reply directly to this email to respond to ${name}.</p>
            <p>This message was automatically generated from the ServX contact form.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
New Contact Form Submission - ServX Platform

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

Received: ${new Date().toLocaleString()}

---
You can reply directly to this email to respond to ${name}.
This message was sent from the ServX contact form.
    `
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Contact email sent successfully via SendGrid');
    console.log('📧 Message ID:', response[0].headers['x-message-id']);
    return {
      success: true,
      messageId: response[0].headers['x-message-id']
    };
  } catch (error) {
    console.error('❌ SendGrid contact email error:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    
    throw new Error(`Failed to send contact email: ${error.message}`);
  }
};

// Send auto-reply confirmation to user
const sendContactAutoReply = async (userEmail, userName, subject = 'General Inquiry') => {
  const msg = {
    to: userEmail,
    from: {
      email: process.env.ADMIN_EMAIL, // Must be verified sender
      name: 'ServX Support Team'
    },
    subject: 'Thank you for contacting ServX',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px 20px;
          }
          .content h2 {
            color: #0d6efd;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .content p {
            margin-bottom: 16px;
            font-size: 15px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            background-color: #0d6efd;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 8px 4px;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .quick-links {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .quick-links h3 {
            margin-top: 0;
            color: #495057;
            font-size: 16px;
          }
          .quick-links ul {
            margin: 0;
            padding-left: 20px;
          }
          .quick-links li {
            margin-bottom: 8px;
          }
          .quick-links a {
            color: #0d6efd;
            text-decoration: none;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 0;
            color: #6c757d;
            font-size: 13px;
          }
          .logo {
            width: 50px;
            height: 50px;
            background-color: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            font-size: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✅</div>
            <h1>Thank You for Contacting ServX!</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${userName},</h2>
            
            <p>Thank you for reaching out to us regarding "<strong>${subject}</strong>". We've received your message and our team will review it carefully.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>We typically respond to inquiries within <strong>24-48 hours</strong></li>
              <li>Our support team will review your message and provide a helpful response</li>
              <li>You'll receive a reply directly to this email address</li>
            </ul>

            <div class="quick-links">
              <h3>While you wait, explore ServX:</h3>
              <ul>
                <li><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Browse skill exchange opportunities</a></li>
                <li><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/about">Learn more about our platform</a></li>
                <li><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup">Create your free account</a></li>
              </ul>
            </div>

            <p>If your inquiry is urgent, please don't hesitate to send us another message with additional details.</p>
            
            <p>Best regards,<br><strong>The ServX Support Team</strong></p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Visit ServX Platform</a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>ServX - Skill Exchange Platform</strong></p>
            <p>This is an automated response confirming we received your message.</p>
            <p>Please do not reply to this email - we'll contact you directly soon!</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${userName},

Thank you for contacting ServX regarding "${subject}".

We've received your message and will respond within 24-48 hours.

While you wait, feel free to:
- Browse skill exchange opportunities at ${process.env.FRONTEND_URL || 'http://localhost:5173'}
- Learn more about our platform
- Create your free account

Best regards,
The ServX Support Team

---
This is an automated response. We'll contact you directly soon!
    `
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Auto-reply sent successfully to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ SendGrid auto-reply error:', error);
    // Don't throw error for auto-reply failures - just log it
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendContactEmail,
  sendContactAutoReply
};