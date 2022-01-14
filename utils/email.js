const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1. Create a transporter (gmail/yahoo/....)
  //   const transporter = nodemailer.createTransport({
  //     service: "Gmail",
  //     auth: {
  //       user: process.env.GMAIL_USERNAME,
  //       pass: process.env.GMAIL_PASSWORD,
  //     },
  //     // Activate in gmail "less secure app" option to be able to send
  //     // Only 500 mails per day with gmail and can be spotted as spammer :)
  //   });

  // Mailtrap traps the mail so that we can test mail sending
  const transporter = nodemailer.createTransport({
    // mailtrap is not in nodemailer so we have to define service and host
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    secureConnection: false, // TLS requires secureConnection to be false
    auth: {
      user: process.env.MAILTRAP_USERNAME,
      pass: process.env.MAILTRAP_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  // 2. Define email options
  const mailOptions = {
    from: "Calputer <test@example.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3. Send the mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
