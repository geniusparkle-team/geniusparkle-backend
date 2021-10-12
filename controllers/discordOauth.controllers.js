const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const { getDiscordTokens, getDiscordUserInfo } = require('../helpers/discord-oauth')
const { strToBase64, base64ToStr, promiseWrapper } = require('../utils/generic')

const prisma = new PrismaClient()

const discordOauth = (request, response) => {
    const { finished, action } = request.query

    const scope = ['email', 'guilds', 'identify']

    if (!finished) {
        return response.status(400).end('Invalid Request')
    }

    if (action === 'connect' && (!request.user || !request.token)) {
        return response.status(401).end('UnAuthenticated')
    }

    const state = { finished }
    const host = `${request.protocol}://${request.get('host')}/`
    const redirectUrl = new URL(host)
    const oauthUrl = new URL('https://discord.com/api/oauth2/authorize')

    oauthUrl.searchParams.append('client_id', process.env.discord_client_id)
    oauthUrl.searchParams.append('response_type', 'code')
    oauthUrl.searchParams.append('scope', scope.join(' '))
    oauthUrl.searchParams.append('access_type', 'offline')
    oauthUrl.searchParams.append('prompt', 'consent')

    if (action === 'connect') {
        state.token = request.token
        redirectUrl.pathname = '/oauth/discord/connect-callback'
    } else {
        redirectUrl.pathname = '/oauth/discord/callback'
    }

    oauthUrl.searchParams.append('state', strToBase64(JSON.stringify(state)))
    oauthUrl.searchParams.append('redirect_uri', redirectUrl.href)

    response.redirect(oauthUrl.href)
}

const discordOauthCallback = async (request, response) => {
    const { code, state } = request.query
    let parsedState = null, finishedUrl = null

    try {
        parsedState = JSON.parse(base64ToStr(state))
    } catch (err) {
        // Do Something if couldn't parse data
    }

    if (!code || code == '') {
        return response.status(400).end('Invalid Response Received from Discord')
    }

    if (parsedState && parsedState.finished) {
        finishedUrl = new URL(parsedState.finished)
    }

    const redirectUrl = new URL(`${request.protocol}://${request.get('host')}/`)
    redirectUrl.pathname = '/oauth/discord/callback'

    const [tokens, tokensError] = await promiseWrapper(getDiscordTokens(code, redirectUrl.href))

    if (!tokens || !tokens.access_token) {
        return response.status(400).end('Invalid Response Received from Discord')
    }
    
    const [userInfo, userInfoError] = await promiseWrapper(getDiscordUserInfo(tokens.access_token))
    
    if (!userInfo || !userInfo.username || !userInfo.email) {
        return response.status(400).end('Invalid Response Received from Discord')
    }

    let accounts = await prisma.account.findMany({
        where: {
            discordTokens: {
                path: ['discordId'],
                equals: userInfo.id,
            },
        }
    })

    let account = accounts.length > 0 ? account[0] : null

    if (!account && !tokens.refresh_token) {
        return response.status(400).end('Invalid Response Received from Discord')
    } else if (!account) {
        account = await prisma.account.create({
            data: {
                name: userInfo.username,
                email: userInfo.email,
                avatar: userInfo.avatar,
                verify: true, // Must Re-verify account if not verified from discord
                password: '<Password goes here>', // password must be auto-generated on oauth and sent on email
                birthday: new Date(0),
            }
        })
    }

    const newDiscordTokens = {
        discordId: userInfo.id,
        refresh_token: tokens.refresh_token || account.discordTokens.refresh_token,
        access_token: tokens.access_token,
        access_token_expires: new Date(
            Date.now() + tokens.expires_in * 1000
        )
    }

    await prisma.account.update({
        where: {
            email: account.email
        },
        data: {
            discordTokens: newDiscordTokens
        }
    })

    const token = jwt.sign({ id: account.email }, process.env.secretOrKey, {
        expiresIn: 86400,
    })

    if (finishedUrl) {
        finishedUrl.searchParams.set('token', token)
        return response.redirect(finishedUrl.href)
    }
    
    response.end('Login has been done from Discord')
}

const discordOauthConnect = async (request, response) => {
    const { state, code } = request.query
    let parsedState, token, payload

    try {
        parsedState = JSON.parse(base64ToStr(state))
    } catch {}

    if (!code || !parsedState || !parsedState.token || !parsedState.finished) {
        return response.status(400).end('Invalid Response Received from Discord')
    }

    token = parsedState?.token

    try {
        payload = jwt.verify(token, process.env.secretOrKey)
    } catch {
        return response.status(400).end('Invalid Response Received from Discord')
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
        return response.status(400).end('Invalid Response Received from Discord')
    }

    // Redirect uri is required for each discord oauth request
    const redirectUrl = new URL(`${request.protocol}://${request.get('host')}/`)
    redirectUrl.pathname = '/oauth/discord/connect-callback'

    const [tokens, error] = await promiseWrapper(getDiscordTokens(code, redirectUrl.href))

    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
        return response.status(400).end('Invalid Response Received from Discord')
    }

    const [userInfo, userInfoError] = await promiseWrapper(getDiscordUserInfo(tokens.access_token))
    
    if (!userInfo || !userInfo.username || !userInfo.email) {
        return response.status(400).end('Invalid Response Received from Discord')
    }

    const otherAccounts = await prisma.account.findMany({
        where: {
            AND: [
                {
                    discordTokens: {
                        path: ['discordId'],
                        equals: userInfo.id,
                    },
                },
                {
                    NOT: {
                        email: account.email,
                    },
                },
            ],
        },
    })

    if (otherAccounts.length > 0) {
        try {
            const finishedUrl = new URL(parsedState.finished) // This throw an exception if the url is invalid
            finishedUrl.searchParams.append('error', 'This Discord account is already connected with another account')
            return response.redirect(finishedUrl.href)
        } catch {
            return response.status(400).end('This Discord account already connected with another account')
        }
    }

    await prisma.account.update({
        where: {
            email: account.email,
        },
        data: {
            discordTokens: {
                discordId: userInfo.id,
                refresh_token: tokens.refresh_token || account.discordTokens.refresh_token,
                access_token: tokens.access_token,
                access_token_expires: new Date(
                    Date.now() + tokens.expires_in * 1000
                ),
            },
        },
    })

    response.redirect(parsedState.finished)
}

module.exports = {
    discordOauth,
    discordOauthCallback,
    discordOauthConnect
}