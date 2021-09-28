const FileType = require('file-type')

const getMimeType = async (path) => {
    const { ext, mime:mimeType } = await FileType.fromFile(path)
    return { ext, mimeType }
}

module.exports = {
    getMimeType
}