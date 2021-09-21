const express = require('express')

const controllers = require('../controllers/videos.controller')
const router = express.Router()

router.get('/all', controllers.getAllVideos)
// router.post('/import')
// 

module.exports = router