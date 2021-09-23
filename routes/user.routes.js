const express = require('express')

const controllers = require('../controllers/user.controllers')

const router = express.Router()

router.get('/profile', controllers.getUserProfile)
// router.post('/upload-avatar')

module.exports = router