const { getDiscordTokens, getDiscordUserInfo } = require('../helpers/discord-oauth')
const { strToBase64, promiseWrapper } = require('../utils/generic')

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
    } catch {
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

    response.end(JSON.stringify({
        userInfo,
        error: userInfoError?.response?.data
    }, null, 4))
}

module.exports = {
    discordOauth,
    discordOauthCallback
}