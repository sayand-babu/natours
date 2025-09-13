const nodemailer = require('nodemailer');

const sendemail = async (options) => {
  // create a transporter for the email service
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // define the email options
  const mailoptions = {
    from: 'natours <natoursofficial.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // actually send the email
  await transporter.sendMail(mailoptions);
};

module.exports = sendemail;
