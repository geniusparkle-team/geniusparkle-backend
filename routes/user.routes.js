const express = require('express');
const { show, findById, create, update, deleteUser} = require('../controllers/user.controller');

const router = express.Router();

router.get('/', show);

router.get('/:id', findById);

router.post('/create', create);

router.put('/:id/update', update);

router.delete('/:id/delete', deleteUser)

module.exports = router;
