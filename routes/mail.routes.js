const express = require('express');
const { emailVerify, emailResetPass } = require('../controllers/mail.controller');

const router = express.Router();

router.get('/verify', emailVerify);

router.post('/resetPass', emailResetPass);

module.exports = router;