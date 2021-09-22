const { PrismaClient } = require('@prisma/client')

const { getComments, addComment } = require("../helpers/youtube-api")
const { promiseWrapper } = require("../utils/generic")

const prisma = new PrismaClient()

const getVideoComments = async (request, response) => {
    const { id:videoId } = request.params
    const { count, pageToken } = request.query
    
    const [commentsData, error] = await promiseWrapper(
        getComments({ id: videoId }, count || 20, pageToken)
    )
    
    if (!commentsData) {
        return response.status(404).json({
            ok: false,
            error: 'Video Doesn\'t exist'
        })
    }

    const responseData = {
        nextPageToken: commentsData.nextPageToken,
        totalPages: commentsData.pageInfo.totalResults,
        resultsPerPage: commentsData.pageInfo.resultsPerPage,
        ok: true
    }

    responseData.items = commentsData.items.map(comment => {
        const commentData = {}
        commentData.id = comment.id
        commentData.videoId = comment.snippet?.videoId
        commentData.totalReplyCount = comment.snippet?.totalReplyCount
        commentData.likeCount = comment.snippet?.topLevelComment?.snippet?.likeCount
        commentData.content = comment.snippet?.topLevelComment?.snippet?.textDisplay
        commentData.authorName = comment.snippet?.topLevelComment?.snippet?.authorDisplayName
        commentData.authorAvatar = comment.snippet?.topLevelComment?.snippet?.authorProfileImageUrl
        commentData.authorChannel = comment.snippet?.topLevelComment?.snippet?.authorChannelUrl
        commentData.publishedAt = comment.snippet?.topLevelComment?.snippet?.publishedAt

        return commentData
    })

    response.json(responseData)
}

const addVideoComment = async (request, response) => {
    const { id:videoId } = request.params
    const { content } = request.body
    const { access_token } = request.user?.googleTokens || {}

    if (!content || content === '') {
        if (!video) {
            return response.status(404).json({
                ok: false,
                error: 'Invalid Request'
            })
        }
    }

    const video = await prisma.video.findUnique({
        where : {
            id: videoId
        },
        select: { account: true }
    })

    if (!video) {
        return response.status(404).json({
            ok: false,
            error: 'Video doen\'t exist or not imported'
        })
    }

    const [data, error] = await promiseWrapper(
        addComment(videoId, video.account.youtubeChannelId, content, access_token)
    )

    if (!data) {
        return response.status(500).json({
            ok: false,
            error: 'Something went wrong'
        })
    }

    const responseData = {}
    responseData.id = data.id
    responseData.videoId = data.snippet.videoId
    responseData.authorDisplayName = data.snippet.topLevelComment.snippet.authorDisplayName
    responseData.authorProfileImageUrl = data.snippet.topLevelComment.snippet.authorProfileImageUrl
    responseData.authorChannelUrl = data.snippet.topLevelComment.snippet.authorChannelUrl
    responseData.textOriginal = data.snippet.topLevelComment.snippet.textOriginal

    response.json(responseData)
}

const getCommentReplays = async (request, response) => {
    const { id } = request.params
    
    const [repliesData, error] = await promiseWrapper(getComments({ parentId: id }))

    if (!repliesData || repliesData?.items.length <= 0) {
        return response.status(404).json({
            ok: false,
            error: 'Comment Doesn\'t exist'
        })
    }

    const responseData = {
        items: repliesData.items[0].replies.comments.map(comment => {
            const commentData = {}
            commentData.id = comment.id
            commentData.videoId = comment.snippet?.videoId
            commentData.likeCount = comment.snippet?.likeCount
            commentData.content = comment.snippet?.textDisplay
            commentData.authorName = comment.snippet?.authorDisplayName
            commentData.authorAvatar = comment.snippet?.authorProfileImageUrl
            commentData.authorChannel = comment.snippet?.authorChannelUrl
            commentData.publishedAt = comment.snippet?.publishedAt
    
            return commentData
        }),
        ok: true
    }
    
    response.json(responseData)
}

const addCommentReplay = (request, response) => {
    response.json({ ok: false , error: 'Not Implemented'})
}

const deleteComment = (request, response) => {
    response.json({ ok: false , error: 'Not Implemented'})
}

const editComment = (request, response) => {
    response.json({ ok: false , error: 'Not Implemented'})
}

module.exports = {
    getVideoComments,
    addVideoComment,
    getCommentReplays,
    addCommentReplay,
    deleteComment,
    editComment
}