const express = require('express');
const { emailVerify } = require('../controllers/mail.controller');

const router = express.Router();

router.get('/verify', emailVerify);

// router.post('/resetPass', emailVerify);


module.exports = router;