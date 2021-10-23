const { default:axios } = require('axios')

const getGoogleTokens = async (code, redirect_uri) => {
    const tokensUrl = 'https://oauth2.googleapis.com/token'
    const data = new URLSearchParams()
    data.append('client_id', process.env.google_client_id)
    data.append('client_secret', process.env.google_client_secret)
    data.append('code', code)
    data.append('grant_type', 'authorization_code')
    data.append('redirect_uri', redirect_uri)
    data.append('access_type', 'offline')

    const response = await axios.post(tokensUrl, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })

    return response.data
}

const getGoogleAccountInfo = async (token) => {
    const data = {}
    const fields = ['birthdays', 'emailAddresses', 'genders', 'names', 'photos', 'urls']
    const infoUrl = new URL('https://people.googleapis.com/v1/people/me')
    infoUrl.searchParams.append('personFields', fields.join(','))
    infoUrl.searchParams.append('access_token', token)

    const response = await axios.get(infoUrl.href)

    data.name = response.data?.names[0]?.displayName
    data.email = response.data?.emailAddresses[0]?.value
    data.picture = response.data?.photos[0]?.url
    data.gender = (response.data?.genders||[])[0]?.value || 'unknow'

    const birthdays = response.data?.birthdays || []

    for (let birthday of birthdays) {
        const bYear = birthday?.date?.year
        const bMonth = birthday?.date?.month
        const bDay = birthday?.date?.day

        if (bYear && bMonth && bDay) {
            data.birthday =`${bYear}-${bMonth < 10 ? '0' + bMonth : bMonth}-${bDay < 10 ? '0' + bDay : bDay}`
        }
    }

    return data
}

const refreshGoogleAccessToken = async (refresh_token) => {
    const refreshUrl = 'https://oauth2.googleapis.com/token'
    const data = new URLSearchParams()
    data.append('client_id', process.env.google_client_id)
    data.append('client_secret', process.env.google_client_secret)
    data.append('grant_type', 'refresh_token')
    data.append('refresh_token', refresh_token)

    const response = await axios.post(refreshUrl, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })

    return response.data
}

const revokeGoogleToken = async (token) => {
    const url = `https://oauth2.googleapis.com/revoke?token=${token}`
    const response = await axios.post(url, null, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    return response.data
}

module.exports = {
    getGoogleTokens,
    getGoogleAccountInfo,
    refreshGoogleAccessToken,
    revokeGoogleToken
}
