const { getComments } = require("../helpers/youtube-api")
const { promiseWrapper } = require("../utils/generic")

const getVideoComments = async (request, response) => {
    const { id:videoId } = request.params
    const { count, pageToken } = request.query
    
    const [commentsData, error] = await promiseWrapper(
        getComments({ id: videoId }, count || 20, pageToken)
    )

    if (!commentsData || commentsData?.items.length <= 0) {
        return response.status(404).json({
            ok: false,
            error: 'Video Doesn\'t exist'
        })
    }

    const responseData = {
        nextPageToken: commentsData.nextPageToken,
        totalResults: commentsData.pageInfo.totalResults,
        resultsPerPage: commentsData.pageInfo.resultsPerPage,
    }

    responseData.items = commentsData.items.map(comment => {
        const commentData = {}
        commentData.id = comment.id
        commentData.videoId = comment.snippet.videoId
        commentData.totalReplyCount = comment.snippet.totalReplyCount
        commentData.likeCount = comment.snippet.topLevelComment.snippet.likeCount
        commentData.content = comment.snippet.topLevelComment.snippet.textDisplay
        commentData.authorName = comment.snippet.topLevelComment.snippet.authorDisplayName
        commentData.authorAvatar = comment.snippet.topLevelComment.snippet.authorProfileImageUrl
        commentData.authorChannel = comment.snippet.topLevelComment.snippet.authorChannelUrl
        commentData.publishedAt = comment.snippet.topLevelComment.snippet.publishedAt

        return commentData
    })

    // response.end(JSON.stringify(commentsData || error?.response?.data, null, 4))
    response.end(JSON.stringify(responseData || error?.response?.data, null, 4))
}

const addVideoComment = (request, response) => {
    response.json({ ok: false , error: 'Not Implemented'})
}

const getCommentReplays = (request, response) => {
    response.json({ ok: false , error: 'Not Implemented'})
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