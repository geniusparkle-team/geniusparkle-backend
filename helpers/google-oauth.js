const { default:axios } = require('axios')

const getGoogleTokens = async (code, redirect_uri) => {
    const tokensUrl = 'https://oauth2.googleapis.com/token'
    const data = new URLSearchParams()
    data.append('client_id', process.env.google_client_id)
    data.append('client_secret', process.env.google_client_secret)
    data.append('code', code)
    data.append('grant_type', 'authorization_code')
    data.append('redirect_uri', redirect_uri)

    const response = await axios.post(tokensUrl, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })

    return response.data
}

const getGoogleAccountInfo = async (token) => {
    const infoUrl = new URL('https://www.googleapis.com/oauth2/v1/userinfo')
    infoUrl.searchParams.append('alt', 'json')
    infoUrl.searchParams.append('access_token', token)

    const response = await axios.get(infoUrl.href)
    return response.data
}

module.exports = {
    getGoogleTokens,
    getGoogleAccountInfo,
}
