const nodemailer = require('nodemailer');
const config = require('./config');
const db = require('./models');

module.exports = {
    sendEmployeePassword: (email, otp) => {
        return new Promise((resolve, reject) => {
            try {
                db.customer.findOne({ where: { email: email } })
                    .then((user) => {
                        if (user) {
                            var smtpTransport = nodemailer.createTransport({
                                host: process.env.MAIL_HOST,
                                port: process.env.MAIL_PORT,
                                auth: {
                                    user: process.env.MAIL_USERNAME,
                                    pass: process.env.MAIL_PASSWORD
                                },
                                tls: { rejectUnauthorized: false },
                            });
                            smtpTransport.sendMail({
                                from: process.env.MAIL_FROM,
                                to: email,
                                subject: 'Grocery blogging website',
                                html: "Dear user,<br><br> Thank you for registering with Janakpur.<br> <br> <b>" + otp + "</b><br> <br> This link will expire in 30sec. <br> This is a system generated mail. Please do not reply to this email ID.<br>Warm Regards,<br> Customer Care<br> Grocerry",
                            }, function (error, info) {
                                if (error) {
                                    return reject({
                                        name: "GrocerryException",
                                        msg: 'Email Sending Failed'
                                    })
                                }
                                return resolve(true)
                            });
                        } else throw {
                            name: "GrocerrryException",
                            msg: 'Email Body not available'
                        }
                    })
            } catch (err) {
                reject(err);
            }
        });
    }
    ,
    sendPasswordResetOtp: (email, otp) => {
        return new Promise((resolve, reject) => {
            try {
                var smtpTransport = nodemailer.createTransport({
                    host: process.env.MAIL_HOST,
                    port: process.env.MAIL_PORT,
                    auth: {
                        user: process.env.MAIL_USERNAME,
                        pass: process.env.MAIL_PASSWORD
                    },
                    tls: { rejectUnauthorized: false },
                });
                smtpTransport.sendMail({
                    from: process.env.MAIL_FROM,
                    to: email,
                    subject: 'Password reset OTP',
                    html: `Dear user,<br><br>Your password reset OTP is: <b>${otp}</b><br><br>This OTP will expire soon. If you did not request a password reset, you can ignore this email.<br><br>Warm regards,<br>Support team`,
                }, function (error, info) {
                    if (error) {
                        return reject({
                            name: "MailerException",
                            msg: 'Email Sending Failed'
                        })
                    }
                    return resolve(true)
                });
            } catch (err) {
                reject(err);
            }
        });
    }
};
