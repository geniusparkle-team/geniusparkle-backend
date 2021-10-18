const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const getTeacherFollowers = async (request, response) => {
    const { user } = request
    const { page:pg } = request.params
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

const getFollowings = (request, response) => {}

const followTeacher = (request, response) => {}

const unfollowTeacher = (request, response) => {}

module.exports = {
    getTeacherFollowers,
    getFollowings,
    followTeacher,
    unfollowTeacher
}