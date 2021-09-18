const express = require('express');
const { show, findById, create, update, deleteUser} = require('../controllers/user.controller');

const router = express.Router();

router.get('/show', show);

router.get('/:id', findById);

router.post('/create', create);

router.put('/update/:id', update);

router.delete('/delete/:id', deleteUser)

module.exports = router;