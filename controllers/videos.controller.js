const { PrismaClient } = require('@prisma/client')

const { getVideosOfPlaylist, getVideosData } = require('../helpers/youtube-api')
const { promiseWrapper } = require('../utils/generic')

const prisma = new PrismaClient()

const getAllVideos = async (request, response) => {
    const { pageToken, count} = request.query
    const { access_token } = request.user?.googleTokens
    let playlistId = request?.user?.youtubePlaylistId

    const videos = await prisma.video.findMany({
        where: {
            accountId: request.user.id
        },
        select: { id : true }
    })

    const videosIds = videos.map(video => video.id)

    const [playlistItems, playlistError] = await promiseWrapper(
        getVideosOfPlaylist(playlistId, access_token, count || 5, pageToken)
    )

    if (!playlistItems) {
        return response.status(500).end(JSON.stringify({
            ok: false,
            error: playlistError?.response?.data,
            playlistItems,
        }, null, 4))
    }

    const responseData = {
        total: playlistItems.pageInfo.totalResults,
        itemsPerPage: playlistItems.pageInfo.resultsPerPage,
        nextPageToken: playlistItems.nextPageToken,
        ok: true
    }

    responseData.items = playlistItems.items.map(video => {
        const thumbnails = video.snippet.thumbnails
        const thumbnail = thumbnails?.standard || thumbnails?.medium || thumbnails?.high || thumbnails?.default
        const data = {}
        data.videoId = video.contentDetails.videoId
        data.videoPublishedAt = video.contentDetails.videoPublishedAt
        data.isPublic = video.status.privacyStatus === 'public'
        data.title = video.snippet.title
        data.description = video.snippet.description
        data.thumbnail = thumbnail?.url
        data.imported = videosIds.includes(data.videoId)
        data.channelTitle = video.snippet.channelTitle

        return data
    }).filter(video => video.isPublic)

    
    response.json(responseData)
}

// Import or/and remove videos from youtube
const importRemoveVideos = async (request, response) => {
    const { import: toImport, remove } = request.body

    if ((!toImport && !remove) ||
        (toImport && !(toImport instanceof Array)) ||
        (remove && !(remove instanceof Array))
    ) {
        return response.status(400).json({
            ok: false,
            error: 'Invalid Request',
        })
    }

    let itemsToImport = []

    if (toImport && toImport.length > 0) {
        const [videosData, error] = await promiseWrapper(getVideosData(toImport, request.token))

        if (!videosData || videosData?.items?.length <= 0) {
            return response.status(400).json({
                ok: false,
                error: 'Invalid Request',
            })
        }

        itemsToImport = videosData.items
    }

    // Check if all videos are owned by the user; use for loop because it supports break
    for (let i =  0; i < itemsToImport.length ; i++) {
        const videoChannelId = itemsToImport[i]?.snippet?.channelId
        
        if (request.user.youtubeChannelId !== videoChannelId) {
            return response.status(400).json({
                ok: false,
                error: `You cannot import all this videos. some of them are not yours.`
            })
        }
    }

    let actions = []

    if (itemsToImport.length > 0) {
        actions.push(
            prisma.video.createMany({
                data: itemsToImport.map((video) => {
                    const videoData = {}
                    videoData.id = video.id
                    videoData.title = video.snippet.title
                    videoData.description = video.snippet.description
                    videoData.thumbnail = video.snippet.thumbnails.standard.url
                    videoData.player = video.player.embedHtml
                    videoData.accountId = request.user.id

                    return videoData
                }),
            })
        )
    }

    if (remove && remove.length > 0) {
        actions.push(prisma.video.deleteMany({
            where: {
                id: {
                    in: remove
                }
            }
        }))
    }

    try {
        await prisma.$transaction(actions)
    } catch (error) {
        return response.status(500).json({
            ok: false,
            error: 'Something Went Wrong',
        })
    }

    response.json({ ok: true })
}

const getVideoDetails = async (request, response) => {
    const { id } = request.params

    if (!id) {
        return response.status(400).json({
            ok: false,
            error: 'Video id field is required',
        })
    }

    const video = await prisma.video.findUnique({
        where: { id }
    })

    if (!video) {
        return response.status(404).json({
            ok: false,
            error: 'Video doesn\'t exit or never been imported',
        })
    }

    response.json(video)
}

module.exports = {
    getAllVideos,
    importRemoveVideos,
    getVideoDetails
}