const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')

require('dotenv').config()

// Instead of using on middleware to authenticate user
// Using two middlewares one for authentication and the other
// for authorization helps when you just know if user is connected
// and do different things on that

module.exports.authentication = async (req, res, next) => {
    let token = req.query?.access_token // ability to pass token into url query

    if (!token && req.headers.authentication && req.headers.authentication.startsWith('Bearer ')) {
        token = req.headers.authentication.split('Bearer ')[1]
    }

    if (!token) return next()

    try {
        const data = jwt.verify(token, process.env.secretOrKey)

        if (data.action !== 'auth') return next()

        const user = await prisma.account.findUnique({
            where: {
                email: data.id,
            },
        })
        
        if (user) {
            req.token = token
            req.user = user
        }   
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.json({ ok: false, error: 'jwt.expired_token' })
        }
    }

    next()
}

module.exports.authenticatedOnly = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'UnAuthorized' })
    }

    next()
}
