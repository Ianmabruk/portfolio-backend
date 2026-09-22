const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../middleware/auth');

router.post('/login', login);
router.get('/profile', require('../middleware/auth').authMiddleware, getProfile);

module.exports = router;
