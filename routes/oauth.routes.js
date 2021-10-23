const express = require('express')

const { authentication, authenticatedOnly } = require('../middlewares/auth.middleware')
const { verrifyGoogleTokens, googleOauthRequired } = require('../middlewares/google-oauth.middleware')
const googleOauthControllers = require('../controllers/googleOauth.controllers')
const discordOauthControllers = require('../controllers/discordOauth.controllers')
const disconnectOauthControllers = require('../controllers/disconnectOauth.controllers')

const router = express.Router()

router.get('/google', googleOauthControllers.googleOauth)
router.get('/google/connect-callback', googleOauthControllers.googleOauthConnect)
router.get('/google/callback', googleOauthControllers.googleOauthCallback)
router.delete('/google/disconnect', authenticatedOnly, verrifyGoogleTokens, googleOauthRequired, disconnectOauthControllers.disconnectGoogleOauth)

router.get('/discord', discordOauthControllers.discordOauth)
router.get('/discord/connect-callback', discordOauthControllers.discordOauthConnect)
router.get('/discord/callback', discordOauthControllers.discordOauthCallback)
router.delete('/discord/disconnect', authenticatedOnly, disconnectOauthControllers.disconnectDiscordOauth)

module.exports = router