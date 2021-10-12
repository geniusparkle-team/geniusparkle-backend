const sharp = require('sharp')
const path = require('path')
const FileType = require('file-type')
const { randomStr } = require('../utils/generic')

const getMimeType = async (path) => {
    const { ext, mime:mimeType } = await FileType.fromFile(path)
    return { ext, mimeType }
}

const resizeImage = async (input) => {
    const dir = path.dirname(input)
    const ouput = path.resolve(dir, `./${randomStr(10)}`)

    await sharp(input)
    .resize(200)
    .toFile(ouput)

    return ouput
}

module.exports = {
    getMimeType,
    resizeImage
}