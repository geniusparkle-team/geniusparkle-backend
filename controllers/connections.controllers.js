const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Get connections requests sent by current user
const getUserPendingRequests = async (request, response) => {
    const { user } = request

    const requests = await prisma.connectionRequest.findMany({
        where: {
            fromId: user.id,
        },
        select: {
            id: true,
            to: true,
            from: false,
            fromId: false,
            toId: false,
        }
    })

    const items = requests.map(connectionRequest => {
        const { id, to } = connectionRequest
        const data = {}
        data.to = {}
        data.id = id
        data.to.id = to.id
        data.to.name = to.name
        data.to.avatar = to.avatar
        data.to .gender = to.gender

        return data
    })

    response.json({
        items, 
        ok: true,
    })
}

// Get connections requests sent to the current user
const getUserConnectionsRequests = async (request, response) => {
    const { user } = request

    const requests = await prisma.connectionRequest.findMany({
        where: {
            toId: user.id,
        },
        select: {
            id: true,
            from: true,
            to: false,
            fromId: false,
            toId: false,
        }
    })

    const items = requests.map(connectionRequest => {
        const { id, from } = connectionRequest
        const data = {}
        data.from = {}
        data.id = id
        data.from.id = from.id
        data.from.name = from.name
        data.from.avatar = from.avatar
        data.from.gender = from.gender

        return data
    })

    response.json({
        items, 
        ok: true,
    })
}

const getUserConnections = (request, response) => {}

const sendConnectionRequest = (request, response) => {}

const deleteConnections = (request, response) => {}

// Accept or reject a connection request
const respondToRequest = (request, response) => {}

module.exports = {
    getUserPendingRequests,
    getUserConnectionsRequests,
    getUserConnections,
    sendConnectionRequest,
    deleteConnections,
    respondToRequest,
}