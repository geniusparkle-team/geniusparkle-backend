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

const sendConnectionRequest = async (request, response) => {
    const { user, body } = request
    let { userId } = body

    userId = Number(userId)

    if (isNaN(userId) || userId <= 0 || userId === user.id) {
        return response.status(400).json({
            ok: false,
            error: 'Invalid user id'
        })
    }

    if (user.type !== 'student') {
        return response.status(400).json({
            ok: false,
            error: 'Non-students cannot request connection'
        })
    }

    // Check if already connected
    const alreadyConnected = await prisma.$executeRawUnsafe(
        `SELECT * FROM _connections WHERE ("A" = $1 AND "B" = $2) OR ("A" = $2 AND "B" = $1) ;`,
        user.id,
        userId
    )
    
    if (alreadyConnected > 0) {
        return response.status(400).json({
            ok: false,
            error: 'Already connected'
        })
    }

    // check if a request is already created by the receiver
    const prevReqByReceiver = await prisma.connectionRequest.findFirst({
        where: { AND: [ { fromId: userId }, { toId: user.id } ] }
    })

    if (prevReqByReceiver) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO _connections ("A", "B") VALUES ($1, $2);`,
            userId,
            user.id
        )

        return response.json({ ok: true })
    }

    // Check if request is Already sent
    const prevReqBySender = await prisma.connectionRequest.findFirst({
        where: { AND: [ { fromId: user.id }, { toId: userId } ] }
    })

    if (prevReqBySender) {
        return response.status(400).json({ ok: false, error: 'Request is already sent'})
    }

    const receiver = await prisma.account.findUnique({
        where: { id: userId }
    })

    if (receiver.type !== 'student') {
        return response.status(404).json({ ok: false, error: 'You cannot send request to non-students'})
    }

    if (!receiver) {
        return response.status(404).json({ ok: false, error: 'User not found'})
    }

    const connectionRequest = await prisma.connectionRequest.create({
        data: {
            fromId: user.id,
            toId: userId
        }
    })

    response.json({ ok : true, id : connectionRequest.id })
}

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

    const deleted = await prisma.$executeRawUnsafe(
        `DELETE FROM _connections WHERE ("A" = $1 AND "B" = $2) OR ("A" = $2 AND "B" = $1) ;`,
        user.id,
        userId
    )

    if (deleted <= 0) response.status(400)

    response.json({ ok: deleted > 0 })
}

// Accept or reject a connection request
const respondToRequest = async (request, response) => {
    const { user, body, params } = request
    const { id } = params
    const { accept } = body

    if (typeof accept !== 'boolean') {
        return response.json({
            ok: false,
            error: 'Accept field must be a boolean'
        })
    }

    const connectionRequest = await prisma.connectionRequest.findUnique({
        where: { id },
        select: { fromId: true, toId: true }
    })

    if (!connectionRequest || connectionRequest.toId !== user.id) {
        return response.status(404).json({ ok: false })
    }
        
    if (accept) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO _connections ("A", "B") VALUES ($1, $2);`,
            connectionRequest.fromId,
            connectionRequest.toId
        )
    }

    await prisma.connectionRequest.delete({
        where: { id },
    })

    return response.json({ ok: true })
}

const deleteConnectionRequest = async (request, response) => {
    const { user, params } = request
    const { id } = params

    const connectionRequest = await prisma.connectionRequest.findUnique({
        where: { id },
        select: { fromId: true, toId:true }
    })

    if (!connectionRequest || connectionRequest.fromId !== user.id) {
        return response.status(404).json({
            ok: true,
            error: 'Connection request not found'
        })
    }

    await prisma.connectionRequest.delete({ where: { id } })

    return response.json({ ok:true })
}

module.exports = {
    getUserPendingRequests,
    getUserConnectionsRequests,
    getUserConnections,
    sendConnectionRequest,
    deleteConnections,
    respondToRequest,
    deleteConnectionRequest
}