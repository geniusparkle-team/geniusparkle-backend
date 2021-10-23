const express = require('express');

const { login, signup, resetPass, tokenRefresh } = require('../controllers/auth.controller');
const { authenticatedOnly } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/refresh', tokenRefresh)


router.post('/resetPass', authenticatedOnly, resetPass);

module.exports = router;
