const express = require('express')

const followsControllers = require('../controllers/follows.controllers')

const router = express.Router()

router.get('/followers', followsControllers.getTeacherFollowers)
router.get('/following', followsControllers.getFollowings)
router.post('/following', followsControllers.followTeacher)
router.delete('/following/:id', followsControllers.unfollowTeacher)

module.exports = router