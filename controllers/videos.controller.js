const { PrismaClient } = require('@prisma/client')

const { getChannelInfoOfToken, getVideosOfPlaylist } = require('../helpers/youtube-api')
const { promiseWrapper } = require('../utils/generic')

const prisma = new PrismaClient()

const getAllVideos = async (request, response) => {
    const { pageToken, count} = request.query
    const { access_token } = request.user?.googleTokens
    let playlistId = request?.user?.youtubePlaylistId

    if (!playlistId) {
        const [channelInfo, channelError] = await promiseWrapper(getChannelInfoOfToken(access_token))
        
        if (!channelInfo && channelInfo?.items?.length >= 0) {
            return response.status(500).json({
                ok: false,
                error: 'Something went wrong!',
            })
        }
        
        const channelId = channelInfo.items[0].id 
        playlistId = channelInfo.items[0].contentDetails?.relatedPlaylists?.uploads

        await prisma.account.update({
            where: {
                email: request.user.email
            },
            data: {
                youtubePlaylistId: playlistId,
                youtubeChannelId: channelId
            }
        })

        console.log('Got playlist')
    }


    const [playlistItems, playlistError] = await promiseWrapper(
        getVideosOfPlaylist(playlistId, access_token, count || 5, pageToken)
    )

    if (!playlistItems) {
        return response.status(500).json({
            ok: false,
            error: 'Something went wrong!',
        })
    }

    const responseData = {
        total: playlistItems.pageInfo.totalResults,
        itemsPerPage: playlistItems.pageInfo.resultsPerPage,
        nextPageToken: playlistItems.nextPageToken,
        ok: true
    }

    responseData.items = playlistItems.items.map(video => {
        const data = {}
        data.videoId = video.contentDetails.videoId
        data.videoPublishedAt = video.contentDetails.videoPublishedAt
        data.isPublic = video.status.privacyStatus === 'public'
        data.title = video.snippet.title
        data.description = video.snippet.description
        data.thumbnail = video.snippet.thumbnails.standard.url

        return data
    }).filter(video => video.isPublic)
    
    response.end(JSON.stringify(responseData, null, 4))
}

module.exports = {
    getAllVideos
}