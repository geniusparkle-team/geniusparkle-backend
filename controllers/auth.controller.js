const path = require('path')
var bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const transporter = require('../config/mail');
const { renderTemplate } = require('../utils/templates');

const prisma = new PrismaClient();

module.exports.signup = async (request, response) => {
    const { body } = request
    const error = []

    if (!body.name) {
        error.push('The name field is required')
    }
    
    if (!body.email) {
        error.push('The email field is required')
    }
    
    if (!body.password) {
        error.push('Yhe password field is required')
    }

    if (error.length > 0) {
        return response.status(400).json({
            ok: false,
            error: error.join(', '),
        })
    }

    const account = await prisma.account.findUnique({
        where: { email: body.email },
    })

    if (account) {
        return response.status(400).json({
            ok: false,
            error: 'Email Already has been used!',
        })
    }

    const hashPass = bcrypt.hashSync(body.password, 10)
    const hashMail = bcrypt.hashSync(body.email, 10)
    const tokenVerify = jwt.sign({ email: body.email }, process.env.secretOrKey, { expiresIn: 7200 })
    await prisma.account.create({
        data: {
            name: body.name,
            email: body.email,
            password: hashPass,
            tokenVerify: hashMail,
        },
    })

    const host = `${request.protocol}://${request.get('host')}/`
    const emailTemp = path.join(request.app.get('emailsViews'), 'confirm-email.html')
    const urlVerify = new URL(host)
    urlVerify.pathname = '/api/mail/verify'
    urlVerify.searchParams.set('token', tokenVerify)

    const content = renderTemplate(emailTemp, { urlVerify: urlVerify.href })
    const mailOptions = {
        from: 'GeniuSparkle ' + '<' + process.env.EMAIL_USERNAME + '>',
        to: request.body.email,
        subject: 'Account verification',
        text: '',
        html: content,
    }
    
    await transporter.sendMail(mailOptions)

    return response.json({ ok: true, message: 'Signup successfully!' })
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

    if (!req.body.password) {
      error.push("password");
    };
    if (!(error.length === 0)) {
      return res.status(400).json({
        ok: false,
        error: "Please input: " + error.join(', ')
      });
    };

    const account = await prisma.account.findUnique({
      where: {
        email: req.user.email
      }
    });
    if (account) {
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
