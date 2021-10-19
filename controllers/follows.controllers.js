const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const getTeacherFollowers = async (request, response) => {
    const { user } = request
    const { page:pg } = request.query
    const page = Number(pg) > 0 ? Number(pg) : 1
    const itemsPerPage = 50

    if (user.type === 'student') {
        return response.json({
            ok: true,
            followers: null
        })
    }

    const follows = await prisma.follows.findMany({
        where: { followingId: user.id },
        select: { follower: true },
        take: itemsPerPage,
        skip: (page - 1) * itemsPerPage
    })

    const followers = follows.map(follow => {
        const data = {}
        data.id = follow.follower.id
        data.name = follow.follower.name
        data.email = follow.follower.email
        data.gender = follow.follower.gender
        data.type = follow.follower.type
        data.avatar = follow.follower.avatar

        return data
    })

    response.json({
        followers,
        ok: true,
    })
}

const getFollowings = async (request, response) => {
    const { user } = request
    const { page:pg } = request.query
    const page = Number(pg) > 0 ? Number(pg) : 1
    const itemsPerPage = 50

    const follows = await prisma.follows.findMany({
        where: { followerId: user.id },
        select: { following: true },
        take: itemsPerPage,
        skip: (page - 1) * itemsPerPage
    })

    const following = follows.map(follow => {
        const data = {}
        data.id = follow.following.id
        data.name = follow.following.name
        data.email = follow.following.email
        data.gender = follow.following.gender
        data.type = follow.following.type
        data.avatar = follow.following.avatar

        return data
    })

    response.json({
        following,
        ok: true,
    })
}

const followTeacher = (request, response) => {}

const unfollowTeacher = async (request, response) => {
    const { user, params } = request
    const { id:userId } = params

    if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
        return response.json({
            error: 'Invalid user id',
            ok: false
        })
    }

    const { count } = await prisma.follows.deleteMany({
        where: { followerId:user.id, followingId: Number(userId) },
    })

    if (count <= 0)
        return response.status(404).json({ 
            ok: false, 
            error: 'Follow not found' 
        })
    
    response.json({ ok: count === 1 })
}

module.exports = {
    getTeacherFollowers,
    getFollowings,
    followTeacher,
    unfollowTeacher
}