// backend/src/controllers/providerController.js
const { PrismaClient } = require('@prisma/client');
const { sendError }    = require('../utils');

const prisma = new PrismaClient();

const createProvider = async (req, res) => {
  const {
    userId, fullName, accountType, bio, experience,
    primaryCategory, secondaryCategories, serviceTitle, serviceDesc,
    subjects, ageGroups, deliveryMode, city, province, serviceAreaType,
    radius, pricingModel, startingPrice, availabilityDays, availabilityNotes,
    phone, whatsapp, inquiryEmail, website, facebook, instagram, linkedin,
    tiktok, twitter, degrees, certifications, memberships, clearance,
    listingPlan, languages,
    profilePhoto, certFile, certFileName, certFileType,
    clearanceFile, clearanceFileName, clearanceFileType,
  } = req.body;

  if (!userId || !fullName) {
    return sendError(res, 400, 'userId and fullName are required.');
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, 404, 'User account not found.');

    const existing = await prisma.providerProfile.findUnique({ where: { userId } });
    if (existing) return sendError(res, 409, 'A provider profile already exists for this account.');

    const profile = await prisma.providerProfile.create({
      data: {
        userId,
        fullName,
        accountType:         accountType         || 'Individual Provider',
        bio:                 bio                 || null,
        experience:          experience          ? parseInt(experience) : null,
        languages:           languages           || [],
        primaryCategory:     primaryCategory     || null,
        secondaryCategories: secondaryCategories || [],
        serviceTitle:        serviceTitle        || null,
        serviceDesc:         serviceDesc         || null,
        subjects:            subjects            || null,
        ageGroups:           ageGroups           || [],
        deliveryMode:        deliveryMode        || null,
        city:                city                || null,
        province:            province            || null,
        serviceAreaType:     serviceAreaType     || null,
        radius:              radius              ? parseInt(radius) : null,
        pricingModel:        pricingModel        || null,
        startingPrice:       startingPrice       || null,
        availabilityDays:    availabilityDays    || [],
        availabilityNotes:   availabilityNotes   || null,
        phone:               phone               || null,
        whatsapp:            whatsapp            || null,
        inquiryEmail:        inquiryEmail        || null,
        website:             website             || null,
        facebook:            facebook            || null,
        instagram:           instagram           || null,
        linkedin:            linkedin            || null,
        tiktok:              tiktok              || null,
        twitter:             twitter             || null,
        degrees:             degrees             || null,
        certifications:      certifications      || null,
        memberships:         memberships         || null,
        clearance:           clearance           || null,
        listingPlan:         listingPlan         || 'free',
        status:              'PENDING',
        publicDisplay:       false,
        profilePhoto:        profilePhoto        || null,
        certFile:            certFile            || null,
        certFileName:        certFileName        || null,
        certFileType:        certFileType        || null,
        clearanceFile:       clearanceFile       || null,
        clearanceFileName:   clearanceFileName   || null,
        clearanceFileType:   clearanceFileType   || null,
      },
    });

    console.log(`[PROVIDER] Created | ${fullName} | photo=${!!profilePhoto} cert=${!!certFile} clearance=${!!clearanceFile}`);
    res.status(201).json({ success: true, message: 'Provider profile created. Pending admin approval.', data: profile, provider: profile });
  } catch (err) {
    console.error('[PROVIDER] createProvider error:', err);
    sendError(res, 500, 'Failed to create provider profile.');
  }
};

const getProviders = async (req, res) => {
  try {
    const providers = await prisma.providerProfile.findMany({
      include: { user: { select: { name: true, email: true, role: true, lastLogin: true, accountType: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: providers });
  } catch (err) {
    console.error('[PROVIDER] getProviders error:', err);
    sendError(res, 500, 'Failed to fetch providers.');
  }
};

const getProviderById = async (req, res) => {
  const { id } = req.params;
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } }, reviews: true },
    });
    if (!provider) return sendError(res, 404, 'Provider not found.');
    res.json({ success: true, data: provider });
  } catch (err) {
    console.error('[PROVIDER] getProviderById error:', err);
    sendError(res, 500, 'Failed to fetch provider.');
  }
};

const updateProvider = async (req, res) => {
  const { id } = req.params;
  try {
    const provider = await prisma.providerProfile.update({ where: { id }, data: req.body });
    res.json({ success: true, data: provider });
  } catch (err) {
    console.error('[PROVIDER] updateProvider error:', err);
    sendError(res, 500, 'Failed to update provider.');
  }
};

const approveProvider = async (req, res) => {
  const { id } = req.params;
  try {
    const provider = await prisma.providerProfile.update({ where: { id }, data: { status: 'APPROVED', publicDisplay: true } });
    console.log(`[PROVIDER] APPROVED | ${provider.fullName}`);
    res.json({ success: true, data: provider });
  } catch (err) {
    sendError(res, 500, 'Failed to approve provider.');
  }
};

const rejectProvider = async (req, res) => {
  const { id } = req.params;
  try {
    const provider = await prisma.providerProfile.update({ where: { id }, data: { status: 'REJECTED', publicDisplay: false } });
    console.log(`[PROVIDER] REJECTED | ${provider.fullName}`);
    res.json({ success: true, data: provider });
  } catch (err) {
    sendError(res, 500, 'Failed to reject provider.');
  }
};

module.exports = { createProvider, getProviders, getProviderById, updateProvider, approveProvider, rejectProvider };