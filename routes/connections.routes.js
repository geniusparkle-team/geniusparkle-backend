const express = require('express')

const {
    getUserPendingRequests,
    getUserConnectionsRequests,
    getUserConnections,
    deleteConnections,
} = require('../controllers/connections.controllers')

const router = express.Router()

router.get('/', getUserConnections)
router.delete('/:id', deleteConnections)
router.get('/pending', getUserPendingRequests)
router.get('/requests', getUserConnectionsRequests)

module.exports = router