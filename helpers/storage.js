const fs = require('fs')
const { default: axios } = require("axios")

const uploadFile = async (filename, filePath) => {
    const fileStream = fs.createReadStream(filePath)

    const data = {
        "path": filename,
        "mode": "add",
        "autorename": true,
        "mute": false,
        "strict_conflict": false
    }

    const uploadResponse = await axios.post('https://content.dropboxapi.com/2/files/upload', fileStream,
        {
            headers: {
                Authorization: `Bearer ${process.env.dropbox_access_token}`,
                'Dropbox-API-Arg': JSON.stringify(data),
                'Content-Type': 'application/octet-stream',
            },
        }
    )

    const { path_lower } = uploadResponse.data
    const getMetadataPayload = JSON.stringify({
        path: path_lower,
        settings: {
            audience: 'public',
            access: 'viewer',
            requested_visibility: 'public',
            allow_download: true,
        },
    })

    const metaDataResponse = await axios.post('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', getMetadataPayload , {
        headers: {
            Authorization: `Bearer ${process.env.dropbox_access_token}`,
            'Content-Type': 'application/json'
        }
    })

    const link = new URL(metaDataResponse.data.url)
    link.searchParams.set('raw', 1)

    return link.href
}

const deleteFile = async (link) => {
}

module.exports = {
    uploadFile,
    deleteFile
}