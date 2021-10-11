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
        email: user.email,
        birthday: user.birthday,
        gender: user.gender,
        avatar: user.avatar,
        accountType: user.type,
        youtubeChannelId: user.youtubeChannelId,
        googleOauthVerified: request.googleOauthVerified,
        discordOauthVerified: isTruthy(user.discordTokens?.discordId),
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

const updateProfile = async (request, response) => {
    const { body, user } = request
    const allowedFields = ['name', 'birthday', 'gender', 'avatar', 'type']
    const dataEntries = Object.entries(body)    
    const dateRegEx = /^\d{2,4}(-|\/)\d{2}(-|\/)\d{2}$/
    const genders = ['male', 'female', 'unknow']
    const types = ['student', 'teacher']
    const errors = []

    if (dataEntries.length <= 0) errors.push('Empty data is not allowed')

    dataEntries.forEach(entry => {
        const [key, value] = entry

        if (!allowedFields.includes(key)) {
            errors.push(`The field ${key} is not allowed`)
        }
    })

    if (errors.length > 0) return response.status(400).json({ errors, ok: false })
    
    let { name, gender, type, birthday } = body
    
    if (name && name.length <= 3) errors.push('The name field should be more than 3 chars')
    if (gender && !genders.includes(gender)) errors.push('invalid gender field')
    if (type && !types.includes(type)) errors.push('invalid type field')
    if (birthday && !dateRegEx.test(birthday)) errors.push('Invalid type field')
    else if (birthday) body.birthday = new Date(birthday)

    // MAYBE
    // if (type === 'teacher' && !user.youtubeChannelId) {
    //     errors.push('Teacher account should be connected to a google account')
    // }

    if (errors.length > 0) return response.status(400).json({ errors, ok: false })

    try {
        await prisma.account.update({
            data: body,
            where: {
                id: user.id
            },
        })

        return response.json({ ok: true })
    } catch (err) {
        console.log('ERROR', err)
        return response.status(500).json({
            error: 'Something went wrong',
            ok: false,
        })
    }
}

module.exports = {
    getUserProfile,
    uploadProfileImage,
    updateProfile
}