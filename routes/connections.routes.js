const express = require('express')

const { getUserPendingRequests } = require('../controllers/connections.controllers')

const router = express.Router()

router.get('/pending', getUserPendingRequests)

module.exports = router