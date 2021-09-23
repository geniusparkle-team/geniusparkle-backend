const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
var bcrypt = require("bcryptjs");

const transporter = require('../config/mail')

module.exports.emailVerify = async (req, res) => {
  try {
    var error = [];

    if (!req.query.token) {
      error.push("Token not found.");
    };

    if (!(error.length === 0)) {
      return res.status(400).json({
        ok: false,
        error: error
      });
    };

    try {
      var token = req.query.token;
      const data = jwt.verify(token, process.env.secretOrKey);

      const accountVerify = await prisma.account.findUnique({
        where: { email: data.email }
      });
      if (accountVerify.verify) {
        return res.status(400).json({
          ok: false,
          error: "Account was verified."
        });
      }

      var isRightToken = bcrypt.compareSync(data.email, accountVerify.tokenVerify);
      if (isRightToken) {
        const updateAccount = await prisma.account.update({
          where: {
            email: data.email
          },
          data: {
            verify: true,
            tokenVerify: null
          }
        });
        return res.json({ ok: true, message: "Verify successfully!" });
        //redirect login page
      } else {
        return res.status(400).json({ ok: false, message: "Verify failed!" });
        //redirect error page
      }
    } catch (error) {
      res.status(403).json({ error: "UnAuthorized" })
    };
  }
  catch (error) {
    res.status(500).json({
      ok: false,
      error: "Something went wrong!"
    });
  }
  finally {
    async () =>
      await prisma.$disconnect()
  }
}

module.exports.emailResetPass = async (req, res) => {
  try {
    var error = [];
    if (!req.body.email) {
      error.push("email");
    };
    if (!(error.length === 0)) {
      return res.status(400).json({
        ok: false,
        error: "Please input: " + error
      });
    };

    //check mail exist
    const email = await prisma.account.findUnique({
      where: { email: req.body.email }
    });
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Wrong email!"
      });
    }

    //check verify
    if (!email.verify) {
      return res.status(400).json({
        ok: false,
        error: "Please verify your email before reset pass!"
      });
    }

    const tokenVerify = jwt.sign({ email: req.body.email }, process.env.secretOrKey, {
      expiresIn: 300,
    });

    var urlResetpass = "/?token=" + tokenVerify;

    var content = '';
    content += '<p style="font-size: 14px; line-height: 170%;">' +
      '<span style="font-size: 16px; line-height: 27.2px;">Hi ' + email.name + `,  </span></p>
      <p style="font-size: 14px; line-height: 170%;">
      <span style="font-size: 16px; line-height: 27.2px;">Welcome to GeniuSparkle! Click on the button below to reset your password:
      </span></p>
      <a href="`+ urlResetpass + `" target="_blank" style="box-sizing: border-box;display: inline-block;font-family:arial,helvetica,sans-serif;
      text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #094c54; border-radius: 4px;
      -webkit-border-radius: 4px;
      -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;">
      <span style="display:block;padding:13px 30px;line-height:120%;"><span style="font-size: 16px; line-height: 19.2px;">Reset password</span></span>
      </a>`;

    var mainOptions = {
      from: "GeniuSparkle " + "<" + process.env.EMAIL_USERNAME + ">",
      to: req.body.email,
      subject: 'Reset Password',
      text: '',
      html: content
    };
    const sendMail = await transporter.sendMail(mainOptions);

    return res.json({ ok: true, message: "Send email successfully!" });
  }
  catch (error) {
  res.status(500).json({
    ok: false,
    error: "Something went wrong!"
  });

}
finally {
  async () =>
    await prisma.$disconnect()
}
}