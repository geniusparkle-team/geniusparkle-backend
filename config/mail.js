const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')

require('dotenv').config()

// Config smtp one time and use it as many
// And configuring mail server for each request is very slow
const transporter = nodemailer.createTransport(
    smtpTransport({
        host: process.env.EMAIL_HOST,
        secureConnection: false,
        tls: {
            rejectUnauthorized: false,
        },
        port: 465,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    })
)

module.exports = transporter