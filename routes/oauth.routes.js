const express = require('express')

const controllers = require('../controllers/oauth.controllers')

const router = express.Router()

router.get('/google', controllers.googleOauth)

router.get('/google/callback', controllers.googleOauthCallback)

module.exports = router