const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getStats } = require('../controllers/statsController');

const router = express.Router();

router.get('/', authMiddleware(['ADMIN']), getStats);

module.exports = router;
