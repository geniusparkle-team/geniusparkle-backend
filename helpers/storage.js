const fs = require('fs')
const { default: axios } = require("axios")

const { refreshGoogleAccessToken } = require('./google-oauth')
const { isExpired, promiseWrapper } = require('../utils/generic')

const googleDriveTokens = {
    refresh_token: process.env.google_drive_refresh_token
}

// Bug To Fix Later : Creates file but it doesnt upload its content
const uploadFile = async (filename, mimeType, filePath) => {
    const { refresh_token, access_token, expires } = googleDriveTokens
    
    if (!access_token || (expires && isExpired(expires))) {
        const [tokens, tokensErrors] = await promiseWrapper(
            refreshGoogleAccessToken(refresh_token)
        )

        if (!tokens && tokensErrors) {
            throw tokensErrors
        } else if (!tokens) {
            throw new Error('Could\'t refresh tokens')
        }
        
        googleDriveTokens.access_token = tokens.access_token
        googleDriveTokens.expires = Date.now() + tokens.expires_in
    }
    
    const readStream = fs.createReadStream(filePath)
    const createFileUrl = new URL('https://www.googleapis.com/upload/drive/v3/files?uploadType=media')
    createFileUrl.searchParams.append('access_token', googleDriveTokens.access_token)
    const metaData = {
        mimeType: mimeType,
        name: filename,
        description: 'Stuff about the file',
    }
    
    const fileResourse = await axios.post(createFileUrl.href, readStream, {
        headers: {
            'Content-Type': mimeType
        }
    })
    
    // console.log(JSON.stringify(fileResourse.data, null, 4))
    // const { id } = fileResourse
    // const uploadeFileUrl = new URL(`https://www.googleapis.com/drive/v3/files/${id}`)
    // uploadeFileUrl.searchParams.append('uploadType', 'media')
    // uploadeFileUrl.searchParams.append('access_token', googleDriveTokens.access_token)

    
    // const response = await axios.patch(uploadeFileUrl.href, JSON.stringify(metaData), {
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // })

    // console.log('Upload id =>', id)
    // // console.log(fileResourse.request)
    // console.log(JSON.stringify(response.data, null, 4))

    return null
}

const deleteFile = async (filePath, filename) => {

}

module.exports = {
    uploadFile,
    deleteFile
}