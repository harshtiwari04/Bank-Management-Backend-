require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Masters" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Backend Masters!';
  const text = `Hello ${name},\n\nThank you for registering with us! We're excited to have you on board.\n\nBest regards,\nThe Backend Masters Team`;
  const html = `<p>Hello ${name},</p><p>Thank you for registering with us! We're excited to have you on board.</p><p>Best regards,<br>The Backend Masters Team</p>`; 

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Successful';
  const text = `Hello ${name},\n\nA transaction of $${amount} has been made to account ${toAccount}.\n\nBest regards,\nThe Backend Masters Team`;
  const html = `Your transaction of <strong>$${amount}</strong> has been successfully made to account <strong>${toAccount}</strong>.`;

  await sendEmail(userEmail, subject, text, html);}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Failed';
  const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed.\n\nPlease try again or contact support for assistance.\n\nBest regards,\nThe Backend Masters Team`;
  const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of <strong>$${amount}</strong> to account <strong>${toAccount}</strong> has failed.</p><p>Please try again or contact support for assistance.</p><p>Best regards,<br>The Backend Masters Team</p>`;
await sendEmail(userEmail, subject, text, html); }  

module.exports ={ 
     sendRegistrationEmail ,
     sendTransactionEmail,
     sendTransactionFailureEmail
    };