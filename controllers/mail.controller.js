const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
var bcrypt = require("bcryptjs");

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
            verify: true
          }
        });
        return res.json({ ok: true, message: "Verify successfully!" });
        //redirect home page
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