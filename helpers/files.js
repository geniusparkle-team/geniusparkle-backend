const FileType = require('file-type')

const getMimeType = async (path) => {
    const { ext, mime } = await FileType.fromFile(path)
    return { ext, mimeType }
}

module.exports = {
    getMimeType
}