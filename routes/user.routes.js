<<<<<<< HEAD
const express = require('express')
const expressformidable = require('express-formidable-v2')

const controllers = require('../controllers/user.controllers')

const router = express.Router()

router.get('/profile', controllers.getUserProfile)
router.put('/profile', controllers.updateProfile)
router.post('/upload-avatar', expressformidable(), controllers.uploadProfileImage)

module.exports = router
=======
const express = require('express');
const { show, findById, create, update, deleteUser} = require('../controllers/user.controller');

const router = express.Router();

router.get('/show', show);

router.get('/:id', findById);

router.post('/create', create);

router.put('/update/:id', update);

router.delete('/delete/:id', deleteUser)

module.exports = router;
>>>>>>> 1c5370e (fix bug)
