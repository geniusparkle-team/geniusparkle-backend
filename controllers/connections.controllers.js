const { PrismaClient } = require('@prisma/client')
const { json } = require('express')

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

    response.json({ items, ok: true })
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

    response.json({ items, ok: true })
}

const getUserConnections = async (request, response) => {
    const { user } = request

    const account = await prisma.account.findUnique({
        where: { id: user.id },
        select: {
            connections: true,
            connectionsRelation: true
        }
    })
    
    const connections = [...account.connections, ...account.connectionsRelation]
    const connectionsFiltered = connections.map(user => {
        const data = {}
        data.id = user.id
        data.name = user.name
        data.gender = user.gender
        data.avatar = user.avatar

        return data
    })

    response.json({ ok: true, connections: connectionsFiltered })
}

const sendConnectionRequest = (request, response) => {}

const deleteConnections = async (request, response) => {
    const { user } = request
    let { id:userId } = request.params

    userId = Number(userId)

    if (isNaN(userId) || userId <= 0) {
        return response.status(400).json({
            ok: false,
            error: 'Invalid params'
        })
    }

    const affected = await prisma.$executeRawUnsafe(
        `DELETE FROM _connections WHERE ("A" = $1 AND "B" = $2) OR ("A" = $2 AND "B" = $1) ;`,
        user.id,
        userId
    )

    if (affected <= 0) response.status(400)

    response.json({ ok: affected > 0 })
}

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