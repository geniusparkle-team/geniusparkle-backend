const express = require('express')

const controllers = require('../controllers/videos.controller')
const router = express.Router()

router.post('/', controllers.importRemoveVideos)
router.get('/all', controllers.getAllVideos)
// router.get('/:id/comments')
// router.get('/:id/comments')

module.exports = router