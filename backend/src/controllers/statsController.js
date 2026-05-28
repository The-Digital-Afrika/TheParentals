const { PrismaClient } = require('@prisma/client');
const { sendError } = require('../utils');

const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    const totalProviders = await prisma.providerProfile.count();
    const pendingApproval = await prisma.providerProfile.count({ where: { status: 'PENDING' } });
    const featuredSlots = await prisma.featuredSlot.count({ where: { providerId: { not: null } } });
    const pendingReviews = await prisma.review.count({ where: { status: 'pending' } });

    res.json({
      success: true,
      data: { totalProviders, pendingApproval, featuredSlots, pendingReviews },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch stats');
  }
};

module.exports = { getStats };
