const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const { getMimeType } = require('../helpers/files')
const { uploadFile, deleteFile } = require('../helpers/storage')
const { promiseWrapper, randomStr } = require('../utils/generic')

const prisma = new PrismaClient()

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

const uploadProfileImage = async (request, response) => {
    const { files, user } = request
    const imageSizeLimit = 1 * 1024 * 1024 // 1Mb

    if (!files.avatar || files.avatar.size <= 0) {
        return response.status(400).json({
            ok: false,
            error: 'Avatar field is required'
        })
    }

    if (files.avatar.size >= imageSizeLimit) {
        return response.status(400).json({
            ok: false,
            error: `Uploaded image size limit is ${imageSizeLimit / 1024 / 1024}Mb`
        })
    }

    // check if the file is a image
    const { mimeType, ext } = await getMimeType(files.avatar.path)

    if (!mimeType.startsWith('image')) {
        return response.status(400).json({
            ok: false,
            error: 'Uploaded file is not an image'
        })
    }

    // upload file to cloud storage
    const [uploadedUrl, error] = await promiseWrapper(
        uploadFile(`${randomStr(20)}.${ext}`, mimeType, files.avatar.path)
    )

    if (!uploadedUrl) {
        const err = error?.response?.data || error
        console.log('ERROR =>', JSON.stringify(err, null, 4))
        return response.status(400).json({
            ok: false,
            error: 'Something Went wrong'
        })
    }

    // save image in the backend delete old image if there is any
    const oldAvatar = user.avatar

    await prisma.account.update({
        where: {
            id: user.id
        },
        data: {
            avatar: uploadedUrl
        }
    })

    await promiseWrapper(deleteFile(oldAvatar))

    // delete file from file system
    fs.unlinkSync(files.avatar.path)

    response.json({ ok : true })
}

module.exports = {
    getUserProfile,
    uploadProfileImage
}