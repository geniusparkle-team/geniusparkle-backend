const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const { getGoogleAccountInfo, getGoogleTokens } = require('../helpers/google-oauth')
const { base64ToStr, promiseWrapper, strToBase64 } = require('../utils/generic')

const prisma = new PrismaClient()

// Generate google oauth url and redirect user to it
const googleOauth = async (request, response) => {
    const { finished, action } = request.query
    const scope = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl',
    ]

    if (!finished) {
        return response.status(400).end('Invalid Request')
    }

    if (action === 'connect' && (!request.user || !request.token)) {
        return response.status(401).end('UnAuthenticated')
    }
    
    const state = { finished }
    const host = `${request.protocol}://${request.get('host')}/`
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    const redirectUrl = new URL(host)

    oauthUrl.searchParams.append('client_id', process.env.google_client_id)
    oauthUrl.searchParams.append('response_type', 'code')
    oauthUrl.searchParams.append('scope', scope.join(' '))
    oauthUrl.searchParams.append('access_type', 'offline')
    
    if (action === 'connect') {
        state.token = request.token
        oauthUrl.searchParams.append('redirect_uri', 'offline')
    } else {
        redirectUrl.pathname = '/oauth/google/callback'
    }
    
    oauthUrl.searchParams.append('state', strToBase64(JSON.stringify(state)))
    oauthUrl.searchParams.append('redirect_uri', redirectUrl.href)

    response.redirect(oauthUrl.href)
}

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
    googleOauth
}
