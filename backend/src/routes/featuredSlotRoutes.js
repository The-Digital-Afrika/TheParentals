const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getFeaturedSlots, assignFeaturedSlot, removeFeaturedSlot, rotateFeaturedSlot } = require('../controllers/featuredSlotController');

const router = express.Router();

router.get('/', authMiddleware(['ADMIN']), getFeaturedSlots);
router.post('/assign', authMiddleware(['ADMIN']), assignFeaturedSlot);
router.post('/:slotId/remove', authMiddleware(['ADMIN']), removeFeaturedSlot);
router.post('/:slotId/rotate', authMiddleware(['ADMIN']), rotateFeaturedSlot);

module.exports = router;
