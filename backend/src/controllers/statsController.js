const prisma = require('../db');
const { sendError } = require('../utils');


const getStats = async (req, res) => {
  try {
    const [totalProviders, pendingApproval, featuredSlots, pendingReviews] = await Promise.all([
      prisma.providerProfile.count(),
      prisma.providerProfile.count({ where: { status: 'PENDING' } }),
      prisma.featuredSlot.count({ where: { providerId: { not: null } } }),
      prisma.review.count({ where: { status: 'pending' } }),
    ]);

    res.json({
      success: true,
      data: { totalProviders, pendingApproval, featuredSlots, pendingReviews },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch stats');
  }
};

module.exports = { getStats };
