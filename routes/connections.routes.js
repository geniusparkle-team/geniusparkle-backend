const express = require('express')

const { getUserPendingRequests, getUserConnectionsRequests } = require('../controllers/connections.controllers')

const router = express.Router()

router.get('/pending', getUserPendingRequests)
router.get('/requests', getUserConnectionsRequests)

module.exports = router