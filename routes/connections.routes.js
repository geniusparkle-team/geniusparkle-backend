const express = require('express')

const {
    getUserPendingRequests,
    getUserConnectionsRequests,
    getUserConnections,
    deleteConnections,
    respondToRequest,
} = require('../controllers/connections.controllers')

const router = express.Router()

router.get('/', getUserConnections)
router.delete('/:id', deleteConnections)
router.get('/pending', getUserPendingRequests)
router.get('/requests', getUserConnectionsRequests)
router.post('/requests/:id', respondToRequest)

module.exports = router