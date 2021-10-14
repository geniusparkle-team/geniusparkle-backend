const express = require('express')

const {
    getUserPendingRequests,
    getUserConnectionsRequests,
    getUserConnections,
    deleteConnections,
    respondToRequest,
    sendConnectionRequest,
    deleteConnectionRequest,
} = require('../controllers/connections.controllers')

const router = express.Router()

router.get('/', getUserConnections)
router.delete('/:id', deleteConnections)
router.get('/pending', getUserPendingRequests)
router.get('/requests', getUserConnectionsRequests)
router.post('/requests', sendConnectionRequest)
router.post('/requests/:id', respondToRequest)
router.delete('/requests/:id', deleteConnectionRequest)

module.exports = router