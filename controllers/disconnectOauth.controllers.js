const { PrismaClient } = require('@prisma/client')
const { revokeDiscordToken } = require('../helpers/discord-oauth')

const { revokeGoogleToken } = require('../helpers/google-oauth')
const { promiseWrapper } = require('../utils/generic')

const prisma = new PrismaClient()

const disconnectGoogleOauth = async (request, response) => {
    const { user } = request
    const { access_token } = user.googleTokens

    await promiseWrapper(
        revokeGoogleToken(access_token)
    )

    await prisma.account.update({
        where: { id : user.id },
        data: {
            googleTokens: {},
            youtubeChannelId: null,
            youtubePlaylistId: null
        }
    })

    response.json({ ok: true })
}

const disconnectDiscordOauth = async (request, response) => {
    const { user } = request

    const { access_token } = user?.discordTokens || {}

    if (!access_token) {
        return response.json({ ok: false, error: 'Discord is not connected'})
    }

    await promiseWrapper(
        revokeDiscordToken(access_token)
    )

    await prisma.account.update({
        where: { id : user.id },
        data: {
            discordTokens: {}
        }
    })

    response.json({ ok: true })
}

module.exports = {
    disconnectDiscordOauth,
    disconnectGoogleOauth
}