const sgMail = require('@sendgrid/mail');
const User = require('../models/User');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMessageEmailNotification({ recipientId, senderName, message }) {
  try {
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.email) return;

    const emailContent = {
      to: recipient.email,
      from: process.env.SENDGRID_SENDER_EMAIL, 
      subject: `New message from ${senderName} on ServX`,
      html: `
        <p>Hello ${recipient.name},</p>
        <p>You received a new message from <strong>${senderName}</strong>:</p>
        <blockquote style="color:#333; padding-left:12px; border-left:3px solid #ccc;">
          ${message}
        </blockquote>
        <p><a href="${process.env.FRONTEND_URL}/inbox" style="color:blue;">Click here</a> to view and reply to the message.</p>
        <p>— ServX Team</p>
      `,
    };

    await sgMail.send(emailContent);
    console.log(`📧 Email notification sent to ${recipient.email}`);
  } catch (error) {
    console.error('❌ Email notification error:', error.response?.body || error.message);
  }
}

module.exports = sendMessageEmailNotification;
