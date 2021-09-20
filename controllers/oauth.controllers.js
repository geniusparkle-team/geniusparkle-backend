const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const { getGoogleAccountInfo, getGoogleTokens } = require('../helpers/google-oauth')
const { base64ToStr, promiseWrapper } = require('../utils/generic')

const prisma = new PrismaClient()

const googleOauthCallback = async (request, response) => {
    const { code, state } = request.query
    let parsedState = null

    try {
        parsedState = JSON.parse(base64ToStr(state))
    } catch {
        // Do Something if couldn't parse data
    }

    if (!code || code == '') {
        return response.status(400).end('Invalid Response Received from Google')
    }

    const [data, error] = await promiseWrapper(getGoogleTokens(code))

    if (!data || !data.access_token || !data.refresh_token) {
        return response.status(400).end('Invalid Response Received from Google')
    }

    const [profileData, profileDataError] = await promiseWrapper(
        getGoogleAccountInfo(data.access_token)
    )

    if (!profileData || !profileData.email || !profileData.name) {
        return response.status(400).end('Invalid Response Received from Google')
    }

    let account = await prisma.account.findUnique({
        where: {
            email: profileData.email
        }
    })

    if (!account) {
        account = await prisma.account.create({
            data: {
                name: profileData.name,
                email: profileData.email,
                verify: true,
                password: bcrypt.hashSync('<Dont have password>', 10),

                googleTokens: {
                    refresh_token: data.refresh_token,
                    access_token: data.access_token,
                    access_token_expires: new Date(
                        Date.now() + data.expires_in * 1000
                    ),
                },
            },
        })
    }
    
    const token = jwt.sign({ id: profileData.email }, process.env.secretOrKey, {
        expiresIn: 86400,
    })

    if (parsedState && parsedState.finished) {
        const finishedUrl = new URL(parsedState.finished)
        finishedUrl.searchParams.set('token', token)
        return response.redirect(finishedUrl.href)
    }
    
    response.end('Login has been done from Google')
}

module.exports = {
    googleOauthCallback,
}
