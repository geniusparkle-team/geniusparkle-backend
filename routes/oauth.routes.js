const express = require('express')

const googleOauthControllers = require('../controllers/googleOauth.controllers')
const discordOauthControllers = require('../controllers/discordOauth.controllers')

const router = express.Router()

router.get('/google', googleOauthControllers.googleOauth)
router.get('/google/connect-callback', googleOauthControllers.googleOauthConnect)
router.get('/google/callback', googleOauthControllers.googleOauthCallback)

router.get('/discord', discordOauthControllers.discordOauth)
router.get('/discord/callback', discordOauthControllers.discordOauthCallback)

module.exports = router