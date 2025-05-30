const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTPEmail = async (to, otp) => {
  const msg = {
    to,
    from: process.env.ADMIN_EMAIL, 
    subject: 'Your Admin OTP Code',
    text: `Your OTP code is: ${otp}`,
    html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>This code is valid for 5 minutes.</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log(` OTP email sent to ${to} with OTP: ${otp}`);
  } catch (error) {
    console.error(`Failed to send OTP to ${to}:`, error.response?.body || error.message);
  }
};

module.exports = sendOTPEmail;
