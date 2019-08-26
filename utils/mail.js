const nodemailer = require('nodemailer');

var email = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kl.pricewatcher@gmail.com',
    pass: 'wmfwbrdosbrbgzbn'
  }
});

const mailOptions = {
  from: 'Price Watcher', // sender address
  to: 'vietson1610@gmail.com', // list of receivers
  subject: 'Subject of your email', // Subject line
  html: '<p>Your html here</p>'// plain text body
};

email.mailToUser = async function mailToUser(address, subject, content) {
  if (address) {
    mailOptions.to = address;
  }
  if (subject) {
    mailOptions.subject = subject;
  }
  if (content) {
    mailOptions.html = content;
  }
  transporter.sendMail(mailOptions);
}

module.exports = email;
