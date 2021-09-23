const getUserProfile = (request, response) => {
    const { user } = request
    const data = {
        id: user.id,
        name: user.name,
        birthday: user.birthday,
        age: user.age,
        gender: user.gender,
        youtubeChannelId: user.youtubeChannelId,
        googleOauthVerified: request.googleOauthVerified
    }

    response.json({ ok : true, data })
}

const uploadProfileImage = (request, response) => {
    response.end('ok')
}

module.exports = {
    getUserProfile,
    uploadProfileImage
}