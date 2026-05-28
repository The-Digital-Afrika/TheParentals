const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getReviews, moderateReview } = require('../controllers/reviewController');

const router = express.Router();

router.get('/', authMiddleware(['ADMIN']), getReviews);
router.post('/:id/moderate', authMiddleware(['ADMIN']), moderateReview);

module.exports = router;
