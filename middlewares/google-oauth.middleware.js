const { PrismaClient } = require('@prisma/client')

const { isExpired, promiseWrapper } = require('../utils/generic')
const { refreshGoogleAccessToken } = require('../helpers/google-oauth')
const { getChannelInfoOfToken } = require('../helpers/youtube-api')

const prisma = new PrismaClient()

// This middleware is used to verify if google oauth tokens are valide
// and refresh access token if expired
const verrifyGoogleTokens = async (request, response, next) => {
    const { refresh_token, access_token, access_token_expires } = request?.user?.googleTokens || {}
    request.googleOauthVerified = false

    if (!refresh_token) return next()

    // Access_token Should be renewed otherwise delete refresh token from database
    if (!access_token || !access_token_expires || isExpired(access_token_expires)) {
        const [data, error] = await promiseWrapper(refreshGoogleAccessToken(refresh_token))

        if (!data || !data.access_token || !data.expires_in) {
            const updatedAccount = await prisma.account.update({
                where: {
                    email: request.user.email
                },
                data: {
                    googleTokens: {}
                }
            })

            request.user = updatedAccount
            return next()
        }
        
        updatedAccount = await prisma.account.update({
            where: {
                email: request.user.email
            },
            data: {
                googleTokens: {
                    refresh_token,
                    access_token: data.access_token,
                    access_token_expires: new Date(Date.now() + data.expires_in * 1000)
                }
            }
        })

        request.user = updatedAccount
    }

    request.googleOauthVerified = true
    next()
}

const getUserChannelInfo = async (request, response, next) => {
    const { refresh_token, access_token, access_token_expires } = request?.user?.googleTokens || {}

    if (
        !request.googleOauthVerified ||
        !refresh_token || !access_token ||
        (request.user?.youtubeChannelId && !request.user?.youtubePlaylistId)
    ) return next()

    const [channelInfo, channelError] = await promiseWrapper(getChannelInfoOfToken(access_token))
    const channelId = channelInfo?.items?.length > 0 ? channelInfo.items[0]?.id : null
    const playlistId = channelInfo?.items?.length > 0 ? channelInfo?.items[0].contentDetails?.relatedPlaylists?.uploads : null

    if (channelId && playlistId) {
        const updatedAccount = await prisma.account.update({
            data: {
                youtubeChannelId: channelId,
                youtubePlaylistId: playlistId
            },
            where: {
                id: request.user.id
            }
        })

        request.user = updatedAccount
    }

    next()
}

const googleOauthRequired = (request, response, next) => {
    if (!request.googleOauthVerified) {
        return response.status(401).json({ error: 'Google oauth is required' })
    }

    next()
}

const youtubeChannelRequired = (request, response, next) => {
    if (!request.googleOauthVerified ||
        !request.user.youtubeChannelId ||
        !request.user.youtubePlaylistId ) {
        return response.status(401).json({ error: 'Google oauth is required or you don\'t have a youtube account' })
    }

    next()
}

module.exports = {
    verrifyGoogleTokens,
    googleOauthRequired,
    getUserChannelInfo,
    youtubeChannelRequired
}
