const path = require('path')
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const transporter = require('../config/mail');
const { renderTemplate } = require('../utils/templates');
const { randomStr } = require('../utils/generic');

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000
const MONTH = 30 * DAY

const signup = async (request, response) => {
    const { body } = request
    const error = []

    if (!body.name) {
        error.push('The name field is required')
    }

    if (!body.email) {
        error.push('The email field is required')
    }
    
    if (!body.password) {
        error.push('The password field is required')
    }

    if (error.length > 0) {
        return response.status(400).json({
            ok: false,
            error: error.join(', '),
        })
    }

    const account = await prisma.account.findUnique({
		where: { email: body.email }
	})

    if (account) {
        return response.status(400).json({
            ok: false,
            error: 'Email Already has been used!',
        })
    }

    const hashPass = bcrypt.hashSync(body.password, 10)
    const tokenVerify = jwt.sign(
        { email: body.email, action: 'verify_email' },
        process.env.secretOrKey,
        { expiresIn: 7200 }
    )
   
	await prisma.account.create({
        data: {
            name: body.name,
            email: body.email,
            password: hashPass
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
    
    response.json({ ok: true, message: 'Signup successfully!' })
    
	await transporter.sendMail(mailOptions)
}

const login = async (request, response) => {
	const { body } = request
	const errors = []

	if (!body.email) errors.push('Email field is required')
	if (!body.password) errors.push('Password field is required')

	if (errors.length > 0) {
		return response.json({ ok : false, errors: errors})
	}

	const account = await prisma.account.findUnique({
		where : { email : body.email }
	})

	if (!account || !bcrypt.compareSync(body.password, account.password)) {
		return response.json({ ok: false, error: 'Email or password is incorrect'})
	}

	const refreshToken = await prisma.refreshToken.create({
		data: {
			token: randomStr(50),
			user_id: account.id,
			expires: new Date(Date.now() + MONTH * 6)
		}
	})

	const accessToken = jwt.sign({ id: account.email, action: 'auth' }, process.env.secretOrKey, {
		expiresIn: 15 * 60
	})

	response.json({
		accessToken,
		refreshToken: refreshToken.token,
		expiresIn: 15 * 60
	})
}

const tokenRefresh = async (request, response) => {
	const { body } = request

	if (!body.refreshToken) {
		return response.json({ ok: false, error: 'RefreshToken Field is required'})
	}

	const refreshToken = await prisma.refreshToken.findUnique({
		where: { token: body.refreshToken },
		select: { token: true, expires: true, user: true }
	})

	if (!refreshToken || refreshToken.expires.getTime() <= Date.now()) {
		return response.json({ ok: false, error: 'Invalid refresh token'})
	}

	const accessToken = jwt.sign({ id: refreshToken.user.email, action: 'auth' }, process.env.secretOrKey, {
		expiresIn: 15 * 60
	})

	response.json({
		accessToken,
		expiresIn: 15 * 60
	})
}

const resetPass = async (req, res) => {
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

module.exports = {
	signup,
	login,
	resetPass,
	tokenRefresh
}