const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcryptjs");
const fetchP = import('node-fetch').then(mod => mod.default) // you can use axios it's cleaner
const fetch = (...args) => fetchP.then(fn => fn(...args))

const transporter = require('../config/mail')

const prisma = new PrismaClient();

// Note : No need to disconnect from db it is done inclusively

module.exports.signup = async (req, res) => {
  try {
    var error = [];

    if (!req.body.name) {
      error.push("name");
    };
    if (!req.body.email) {
      error.push("email");
    };
    if (!req.body.password) {
      error.push("password");
    };
    if (!req.body.birthday) {
      error.push("birthday");
    };
    if (!req.body.gender) {
      error.push("gender");
    };
    if (!(error.length === 0)) {
      return res.status(400).json({
        ok: false,
        error: "Please input: " + error.join(', ')
      });
    };
    const email = await prisma.account.findUnique({
      where: { email: req.body.email }
    });
    if (email) {
      res.status(400).json({
        ok: false,
        error: "Email exist!"
      });
    } else {
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(req.body.password, salt);

      const account = await prisma.account.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          password: hashPass,
          gender: req.body.gender,
          birthday: new Date(req.body.birthday),
          tokenVerify: hashMail
        }
      });

      var urlVerify = "https://genius-park-stag.herokuapp.com/api/mail/verify?token=" + tokenVerify;

      var content = '';
      content += '<p style="font-size: 14px; line-height: 170%;">' +
        '<span style="font-size: 16px; line-height: 27.2px;">Hi ' + account.name + `,  </span></p>
      <p style="font-size: 14px; line-height: 170%;">
      <span style="font-size: 16px; line-height: 27.2px;">Welcome to GeniuSparkle! Click on the button below to verify your account:
      </span></p>
      <a href="`+ urlVerify + `" target="_blank" style="box-sizing: border-box;display: inline-block;font-family:arial,helvetica,sans-serif;
      text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #094c54; border-radius: 4px;
      -webkit-border-radius: 4px;
      -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;">
      <span style="display:block;padding:13px 30px;line-height:120%;"><span style="font-size: 16px; line-height: 19.2px;">Verify account</span></span>
      </a>`;

      var mailOptions = {
        from: "GeniuSparkle " + "<" + process.env.EMAIL_USERNAME + ">",
        to: req.body.email,
        subject: 'Account verification',
        text: '',
        html: content
      }
      await transporter.sendMail(mailOptions);

      return res.json({ ok: true, message: "Signup successfully!" });
    }
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

module.exports.loginDiscord = async (req, res) => {
  try {
    var error = [];

    if (!req.body.access_token) {
      error.push("access_token");
    };

    if (!(error.length === 0)) {
      return res.status(400).json({
        ok: false,
        error: "Please input: " + error
      });
    };

    //check token discord
    var tokenDiscord = "Bearer " + req.body.access_token;
    const response2 = await fetch(`http://discordapp.com/api/users/@me`,
      {
        method: 'GET',
        headers: {
          Authorization: tokenDiscord,
        },
      });

    const json = await response2.json();

    if (json.email) {
      // check email exist
      const email = await prisma.account.findUnique({
        where: { email: json.email }
      });
      if (!email) {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(process.env.commomPass, salt);
        const account = await prisma.account.create({
          data: {
            name: json.username,
            email: json.email,
            password: hash,
            otherData: "discordId: " + json.id,
            verify: true
          },
        });
      }
      const token = jwt.sign({ id: json.email }, process.env.secretOrKey, {
        expiresIn: 86400,
      });
      return res.status(200).json({
        ok: "true",
        data: { token: "Bearer " + token }
      });
    } else {
      res.status(400).json({
        ok: false,
        error: "Access_token was wrong"
      });
    }
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

module.exports.login = async (req, res) => {
  try {
    var error = [];

    if (!req.body.email) {
      error.push("email");
    };
    if (!req.body.password) {
      error.push("password");
    };
    if (!(error.length === 0)) {
      res.status(400).json({
        ok: false,
        error: "Please input: " + error.join(', ')
      });
    };
    const account = await prisma.account.findUnique({
      where: {
        email: req.body.email
      }
    });
    if (account) {
      var isRightPass = bcrypt.compareSync(req.body.password, account.password);
      if (isRightPass) {
        // check verify
        if (!account.verify) {
          return res.status(400).json({
            ok: false,
            verify: false,
            message: "The account is not verify yet!"
          });
        };

        // create and assign a token
        const token = jwt.sign({ id: account.email }, process.env.secretOrKey, {
          expiresIn: 86400,
        });
        res.status(200).json({
          ok: "true",
          data: { token: "Bearer " + token }
        });
      } else {
        res.status(400).json({ ok: false, message: "Wrong password!" })
      }
    } else {
      res.status(400).json({ ok: false, message: "Wrong email!" });
    }
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

module.exports.resetPass = async (req, res) => {
  try {
    var error = [];

    if (!req.body.email) {
      error.push("email");
    };
    if (!req.body.password) {
      error.push("password");
    };
    if (!(error.length === 0)) {
      return res.status(400).json({
        ok: false,
        error: "Please input: " + error.join(', ')
      });
    };

    if (!(req.user.email === req.body.email)) {
      return res.status(403).json({
        ok: false,
        error: "Access denied"
      });
    };
    const email = await prisma.account.findUnique({
      where: {
        email: req.body.email
      }
    });
    if (email) {
      var salt = bcrypt.genSaltSync(10);
      var hashPass = bcrypt.hashSync(req.body.password, salt);
      const updateAccount = await prisma.account.update({
        where: {
          email: req.body.email,
        },
        data: {
          password: hashPass,
        }
      });
      return res.json({ ok: true, message: "Update password successfully!" });
    } else {
      return res.status(400).json({ ok: false, message: "Wrong email!" });
    }
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
