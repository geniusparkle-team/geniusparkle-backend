const { PrismaClient } = require('@prisma/client')

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

const disconnectDiscordOauth = (request, response) => {
    response.json({ ok: false })
}

module.exports = {
    disconnectDiscordOauth,
    disconnectGoogleOauth
}