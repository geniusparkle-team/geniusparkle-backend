const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')

require('dotenv').config()

// Instead of using on middleware to authenticate user
// Using two middlewares one for authentication and the other
// for authorization helps when you just know if user is connected
// and do different things on that

module.exports.authentication = async (req, res, next) => {
    let token = req.query?.token // ability to pass token into url query

    if (req.headers.authentication && req.headers.authentication.startsWith('Bearer ')) {
        token = req.headers.authentication.split('Bearer ')[1]
    }

    if (!token) return next()

    try {
        const data = jwt.verify(token, process.env.secretOrKey)
        const user = await prisma.account.findUnique({
            where: {
                email: data.email,
            },
        })

        if (user) {
            req.token = token
            req.user = user
        }
    } catch (error) {}

    next()
}

module.exports.authenticatedOnly = async (req, res, next) => {
    if (!request.user) {
        return res.status(401).json({ error: 'UnAuthorized' })
    }

    next()
}