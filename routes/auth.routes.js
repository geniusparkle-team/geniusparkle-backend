const express = require('express');
const { login, signup, loginDiscord, resetPass } = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/login', login);

router.post('/signup', signup);

router.post('/loginDiscord', loginDiscord);

router.post('/resetPass', auth, resetPass);


module.exports = router;
