const express = require('express')

const { googleOauthRequired } = require('../middlewares/google-oauth.middleware');
const videosControllers = require('../controllers/videos.controller')
const commentsControllers = require('../controllers/comments.controllers')

const router = express.Router()

router.post('/', googleOauthRequired, videosControllers.importRemoveVideos)
router.get('/all', googleOauthRequired, videosControllers.getAllVideos)
router.get('/:id', videosControllers.getVideoDetails)

router.get('/:id/comments', commentsControllers.getVideoComments)
router.post('/:id/comments', googleOauthRequired, commentsControllers.addVideoComment)
router.get('/comments/:id/replies', commentsControllers.getCommentReplays)
router.post('/comments/:id/replies', googleOauthRequired, commentsControllers.addCommentReplay)
router.delete('/comments/:id', googleOauthRequired, commentsControllers.deleteComment)
router.put('/comments/:id', googleOauthRequired, commentsControllers.editComment)

module.exports = router