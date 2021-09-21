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

module.exports = {
    getChannelInfoOfToken,
    getVideosOfPlaylist,
    getVideosData
}