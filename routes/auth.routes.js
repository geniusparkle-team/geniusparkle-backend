const express = require('express');
const { login, signup, loginDiscord } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', login);

router.post('/signup', signup);

router.post('/loginDiscord', loginDiscord);

module.exports = router;
