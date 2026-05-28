const { PrismaClient } = require('@prisma/client');
const { sendError } = require('../utils');

const prisma = new PrismaClient();

const getFeaturedSlots = async (req, res) => {
  try {
    const slots = await prisma.featuredSlot.findMany({
      include: { provider: { select: { fullName: true } } },
    });
    res.json({ success: true, data: slots });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch featured slots');
  }
};

const assignFeaturedSlot = async (req, res) => {
  const { slotId, providerId } = req.body;
  try {
    const slot = await prisma.featuredSlot.update({
      where: { id: slotId },
      data: { providerId, addedAt: new Date(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },  // 7 days
    });
    res.json({ success: true, data: slot });
  } catch (err) {
    sendError(res, 500, 'Failed to assign slot');
  }
};

const removeFeaturedSlot = async (req, res) => {
  const { slotId } = req.params;
  try {
    const slot = await prisma.featuredSlot.update({
      where: { id: slotId },
      data: { providerId: null, expiresAt: null },
    });
    res.json({ success: true, data: slot });
  } catch (err) {
    sendError(res, 500, 'Failed to remove slot');
  }
};

const rotateFeaturedSlot = async (req, res) => {
  const { slotId } = req.params;
  // Logic to rotate: Assign to next eligible provider (simplified)
  try {
    // Example: Find a random approved provider
    const providers = await prisma.providerProfile.findMany({ where: { status: 'APPROVED' } });
    const randomProvider = providers[Math.floor(Math.random() * providers.length)];
    const slot = await prisma.featuredSlot.update({
      where: { id: slotId },
      data: { providerId: randomProvider.id, addedAt: new Date(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    res.json({ success: true, data: slot });
  } catch (err) {
    sendError(res, 500, 'Failed to rotate slot');
  }
};

module.exports = { getFeaturedSlots, assignFeaturedSlot, removeFeaturedSlot, rotateFeaturedSlot };
