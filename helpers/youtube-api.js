const { default:axios } = require('axios')

const getChannelInfoOfToken = async (access_token) => {
    const parts = ['id', 'contentDetails', 'snippet']
    const channelInfoUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
    channelInfoUrl.searchParams.append('part', parts.join(','))
    channelInfoUrl.searchParams.append('mine', true)
    channelInfoUrl.searchParams.append('access_token', access_token)

    const response = await axios.get(channelInfoUrl.href)
    return response.data
}

const getVideosOfPlaylist = async (id, access_token, maxResults=5, pageToken) => {
    const parts = ['snippet', 'contentDetails', 'status']
    const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    playlistUrl.searchParams.append('playlistId', id)
    playlistUrl.searchParams.append('part', parts.join(','))
    playlistUrl.searchParams.append('maxResults', maxResults)
    playlistUrl.searchParams.append('access_token', access_token)

    if (pageToken) playlistUrl.searchParams.append('pageToken', pageToken)

    const response = await axios.get(playlistUrl.href)
    return response.data
}

const getVideosData = async (ids, access_token) => {
    const parts = ['contentDetails', 'player', 'snippet', 'recordingDetails']
    const dataUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    dataUrl.searchParams.append('part', parts.join(','))
    dataUrl.searchParams.append('id', ids.join(','))
    dataUrl.searchParams.append('key', process.env.youtube_api_key)
    dataUrl.searchParams.append('maxResults', 50)

    const response = await axios.get(dataUrl.href, {
        headers: {
            Authentication: `Bearer ${access_token}`
        }
    })
    return response.data
}

// Get comments of a video by passing id field
// Or replies of a comment by passing parentId
const getComments = async ({id, parentId}, maxResults = 20, pageToken) => {
    const commentsUrl = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
    commentsUrl.searchParams.append('key', process.env.youtube_api_key)
    commentsUrl.searchParams.append('textFormat', 'plainText')
    commentsUrl.searchParams.append('maxResults', maxResults || 20)
    
    if (id) {
        const parts = ['id', 'snippet']
        commentsUrl.searchParams.append('videoId', id)
        commentsUrl.searchParams.append('part', parts.join(','))
    } else if (parentId) {
        commentsUrl.searchParams.append('id', parentId)
        commentsUrl.searchParams.append('part', 'replies')
    }
    
    if (pageToken) {
        commentsUrl.searchParams.append('pageToken', pageToken)
    }

    const response = await axios.get(commentsUrl.href)

    return response.data
}

const addComment = async (videoId, channelId, content, access_token) => {
    const commentUrl = new URL('https://youtube.googleapis.com/youtube/v3/commentThreads')
    const data = {
        snippet: {
            videoId,
            channelId,
            topLevelComment: {
                snippet: {
                    textOriginal: content,
                },
            },
        },
    }

    commentUrl.searchParams.append('part', ['id', 'snippet'].join(','))
    commentUrl.searchParams.append('key', process.env.youtube_api_key)
    commentUrl.searchParams.append('access_token', access_token)

    const response = await axios.post(commentUrl.href, JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
        }
    })

    
    return response.data
}

const postReply = async (parentId, content, access_token) => {
    const commentUrl = new URL('https://www.googleapis.com/youtube/v3/comments')
    const data = {
        snippet: {
            parentId,
            textOriginal: content,
        },
    }

    commentUrl.searchParams.append('part', ['id', 'snippet'].join(','))
    commentUrl.searchParams.append('key', process.env.youtube_api_key)
    commentUrl.searchParams.append('access_token', access_token)

    const response = await axios.post(commentUrl.href, JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
        }
    })

    return response.data
}

const updateYoutubeComment = async (id, content, access_token) => {
    const commentUrl = new URL('https://youtube.googleapis.com/youtube/v3/comments')
    const data = {
        id,
        snippet: {
            textOriginal: content,
        },
    }

    if (id.length > 26 && /^.+\..+$/.test(id)) {
        data.snippet.parentId = id.split('.')[0]
    }

    commentUrl.searchParams.append('part', 'snippet')
    commentUrl.searchParams.append('key', process.env.youtube_api_key)
    commentUrl.searchParams.append('access_token', access_token)

    const response = await axios.put(commentUrl.href, JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            Authentication: `Bearer ${access_token}`
        }
    })

    return response.data
}

const deleteYoutubeComment = async (id, access_token) => {
    const commentUrl = new URL('https://www.googleapis.com/youtube/v3/comments')

    commentUrl.searchParams.append('id', id)
    commentUrl.searchParams.append('key', process.env.youtube_api_key)
    commentUrl.searchParams.append('access_token', access_token)

    const response = await axios.delete(commentUrl.href)
    return response.data
}

module.exports = {
    getChannelInfoOfToken,
    getVideosOfPlaylist,
    getVideosData,
    getComments,
    addComment,
    postReply,
    updateYoutubeComment,
    deleteYoutubeComment
}