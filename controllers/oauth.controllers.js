const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const { getGoogleAccountInfo, getGoogleTokens } = require('../helpers/google-oauth')
const { getChannelInfoOfToken } = require('../helpers/youtube-api')
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
        'https://www.googleapis.com/auth/user.birthday.read',
        'https://www.googleapis.com/auth/user.gender.read'
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
        redirectUrl.pathname = '/oauth/google/connect-callback'
    } else {
        redirectUrl.pathname = '/oauth/google/callback'
    }
    
    oauthUrl.searchParams.append('state', strToBase64(JSON.stringify(state)))
    oauthUrl.searchParams.append('redirect_uri', redirectUrl.href)

    response.redirect(oauthUrl.href)
}

// Connect a existing account with a oauth google account
const googleOauthConnect = async (request, response) => {
    const { state, code } = request.query
    let parsedState, token, payload

    try {
        parsedState = JSON.parse(base64ToStr(state))
    } catch {}

    if (!code || !parsedState || !parsedState.token || !parsedState.finished) {
        return response.status(400).end('Invalid Response Received from Google')
    }

    token = parsedState?.token

    try {
        payload = jwt.verify(token, process.env.secretOrKey)
    } catch {
        return response.status(400).end('Invalid Response Received from Google')
    }
    
    if (!payload.id) {
        return response.status(400).end('Invalid Response Received from Google')
    }

    // Get account based on token
    const account = await prisma.account.findUnique({
        where: {
            email: payload.id
        }
    })

    if (!account) {
        return response.status(400).end('Invalid Response Received from Google')
    }

    // Redirect uri is required for each google oauth request
    const redirectUrl = new URL(`${request.protocol}://${request.get('host')}/`)
    redirectUrl.pathname = '/oauth/google/connect-callback'

    const [data, error] = await promiseWrapper(getGoogleTokens(code, redirectUrl.href))

    if (!data || !data.access_token || !data.refresh_token) {
        return response.status(400).end('Invalid Response Received from Google')
    }

    const [profileData, profileDataError] = await promiseWrapper(
        getGoogleAccountInfo(data.access_token)
    )

    const [channelInfo, channelError] = await promiseWrapper(getChannelInfoOfToken(data.access_token))
    
    if (!profileData || !profileData.email || !profileData.name || !channelInfo || channelInfo?.items?.length <= 0) {
        return response.status(400).end('Invalid Response Received from Google')
    }

    const playlistId = channelInfo.items[0].contentDetails?.relatedPlaylists?.uploads
    const channelId = channelInfo.items[0]?.id 

    // Check if the connected email is used before in another account
    // Or the youtube channel is connected to somehow to another account
    const otherAccounts = await prisma.account.findMany({
        where: {
            OR: [{
                AND: [
                    { youtubeChannelId: channelId },
                    { NOT: {
                            id: account.id
                        }
                    }
                ]
            },
            {
                AND: [
                    { email: profileData.email },
                    { NOT: {
                            id: account.id
                        }
                    }
                ]
            }]
        }
    })

    if (otherAccounts.length > 0) {
        try {
            const finishedUrl = new URL(parsedState.finished) // This throw an exception if the url is invalid
            finishedUrl.searchParams.append('error', 'This Google account or youtube channel is already connected with another account')
            return response.redirect(finishedUrl.href)
        } catch {
            return response.status(400).end('This Google account or youtube channel is already connected with another account')
        }
    }

    await prisma.account.update({
        where: {
            email: payload.id
        },
        data: {
            youtubeChannelId: channelId,
            youtubePlaylistId: playlistId,
            googleTokens: {
                refresh_token: data.refresh_token,
                access_token: data.access_token,
                access_token_expires: new Date(
                    Date.now() + data.expires_in * 1000
                ),
            },
        }
    })

    response.redirect(parsedState.finished)    
}

// Login/Sign-up using oauth
const googleOauthCallback = async (request, response) => {
    const { code, state } = request.query
    let parsedState = null, finishedUrl = null

    try {
        parsedState = JSON.parse(base64ToStr(state))
    } catch {
        // Do Something if couldn't parse data
    }

    if (!code || code == '') {
        return response.status(400).end('Invalid Response Received from Google')
    }

    if (parsedState && parsedState.finished) {
        finishedUrl = new URL(parsedState.finished)
    }

    // Redirect uri is required for each google oauth request
    const redirectUrl = new URL(`${request.protocol}://${request.get('host')}/`)
    redirectUrl.pathname = '/oauth/google/callback'

    const [data, error] = await promiseWrapper(getGoogleTokens(code, redirectUrl.href))

    if (!data || !data.access_token) {
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

    // Sign-up but before signing-up we check if channel is already used
    if (!account && !data.refresh_token) {
        return response.status(400).end('Invalid Response Received from Google')
    } else if (!account) {
        const [channelInfo, channelError] = await promiseWrapper(getChannelInfoOfToken(data.access_token))
        const channelId = channelInfo.items[0]?.id 
        const playlistId = channelInfo.items[0].contentDetails?.relatedPlaylists?.uploads

        account = await prisma.account.findUnique({
            where: {
                youtubeChannelId: channelId
            }
        })

        // If There is already an accoumt with same channel id then redirect to front-end with error message
        if (account && finishedUrl) {
            finishedUrl.searchParams.set('error', 'Youtube Channel has already been connected to a account')
            return response.redirect(finishedUrl.href)
        } else if (account) {
            return response.end('Youtube Channel has already been connected to a account')
        }

        account = await prisma.account.create({
            data: {
                name: profileData.name,
                email: profileData.email,
                verify: true,
                password: bcrypt.hashSync('<Dont have password>', 10),
                youtubeChannelId: channelId,
                youtubePlaylistId: playlistId,
                avatar: profileData.picture,
                gender: profileData.gender,
                birthday: new Date(profileData.birthday),

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

    const newGoogleTokens = {
        refresh_token: data.refresh_token || account.googleTokens.refresh_token,
        access_token: data.access_token,
        access_token_expires: new Date(
            Date.now() + data.expires_in * 1000
        ),
    }

    prisma.account.update({
        where: {
            id: account.id,
        },
        data : {
            googleTokens: newGoogleTokens,
        }
    })
    
    const token = jwt.sign({ id: profileData.email }, process.env.secretOrKey, {
        expiresIn: 86400,
    })

    if (finishedUrl) {
        finishedUrl.searchParams.set('token', token)
        return response.redirect(finishedUrl.href)
    }
    
    response.end('Login has been done from Google')
}

module.exports = {
    googleOauthCallback,
    googleOauth,
    googleOauthConnect,
}
