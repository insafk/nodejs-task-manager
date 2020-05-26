const apiKey = process.env.SENDGRID_API_KEY;

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(apiKey);

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        from:'famempm@gmail.com',
        to: email,
        subject:'Welcome to TaskManager app',
        text: `Welcome, ${name}. Thanks for joining, hope that you've the best experience here`
    });
}

const sendCancellationMail = (email, name) => {
    sgMail.send({
        from: 'famempm@gmail.com',
        to: email,
        subject: 'B\'bye dude',
        text: `GoodBye, ${name}. Hope to see you back soon`
    });
}

module.exports = {
    sendWelcomeMail,
    sendCancellationMail
}
