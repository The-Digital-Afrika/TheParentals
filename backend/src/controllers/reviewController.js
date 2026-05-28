const { PrismaClient } = require('@prisma/client');
const { sendError } = require('../utils');

const prisma = new PrismaClient();

const getReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { provider: { select: { fullName: true } } },
    });
    res.json({ success: true, data: reviews });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch reviews');
  }
};

const moderateReview = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;  // 'approve' or 'reject'
  const status = action === 'approve' ? 'approved' : 'rejected';
  try {
    const review = await prisma.review.update({
      where: { id },
      data: { status },
    });
    res.json({ success: true, data: review });
  } catch (err) {
    sendError(res, 500, 'Failed to moderate review');
  }
};

module.exports = { getReviews, moderateReview };
