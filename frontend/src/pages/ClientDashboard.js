// frontend/src/pages/ClientDashboard.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import TagsInput from '../components/client/TagsInput';
import { DAYS_OF_WEEK, PRICING_MODELS, PROVINCES } from '../utils/constants';
import { getPlanLimits } from '../utils/helpers';
import { formatInquiryDate, getInquiries, markInquiryRead, respondToInquiry } from '../utils/inquiries';
import { api, apiRequest } from '../services/api';
import '../assets/css/dashboard.css'

/* ─────────────── localStorage helpers ─────────────── */
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('sah_current_user') || 'null'); }
  catch { return null; }
}
function getProviderById(id) {
  try {
    const all = JSON.parse(localStorage.getItem('sah_providers') || '[]');
    return all.find(p => p.id === id || p.userId === id) || null;
  } catch { return null; }
}
function getProviderForSession(session) {
  try {
    const all = JSON.parse(localStorage.getItem('sah_providers') || '[]');
    const id = session?.id || session?.userId || '';
    const email = String(session?.email || '').toLowerCase();
    return all.find(p =>
      (id && (p.id === id || p.userId === id))
      || (email && String(p.email || p.contactEmail || p.inquiryEmail || '').toLowerCase() === email)
    ) || null;
  } catch { return null; }
}
function getSavedTime(profile) {
  const value = profile?.localSavedAt || profile?.updatedAt || profile?.createdAt || profile?.registered;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}
function localProfileIsNewer(localProfile, remoteProfile) {
  return getSavedTime(localProfile) > getSavedTime(remoteProfile);
}
function profileCompletenessScore(profile) {
  if (!profile) return 0;
  const checks = [
    profile.name || profile.fullName,
    profile.email || profile.contactEmail || profile.inquiryEmail,
    profile.bio,
    profile.primaryCategory,
    profile.city,
    profile.province,
    profile.phone,
    profile.contactEmail || profile.inquiryEmail,
    profile.serviceTitle || profile.services?.some(service => service?.title),
    profile.serviceDesc || profile.services?.some(service => service?.description),
    profile.pricingModel,
    profile.startingPrice,
    profile.availabilityDays?.length,
    profile.degrees || profile.certifications,
    profile.languages?.length,
  ];
  return checks.filter(Boolean).length;
}
function shouldUseLocalProfile(localProfile, remoteProfile) {
  if (!localProfile) return false;
  if (!remoteProfile) return true;
  if (localProfileIsNewer(localProfile, remoteProfile)) return true;
  return profileCompletenessScore(localProfile) > profileCompletenessScore(remoteProfile);
}
function isBlankProfileValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
function fillMissingProfileFields(remoteProfile, localProfile) {
  if (!localProfile) return remoteProfile;
  const merged = { ...remoteProfile };
  Object.entries(localProfile).forEach(([key, value]) => {
    if (!isBlankProfileValue(value) && isBlankProfileValue(merged[key])) {
      merged[key] = value;
    }
  });
  return merged;
}
function normalizeProviderForSave(profile) {
  const now = new Date().toISOString();
  const firstService = profile.services?.[0] || {};
  const id = profile.userId || profile.id || '';
  const contactEmail = profile.contactEmail || profile.inquiryEmail || profile.email || '';
  const displayName = profile.name || profile.fullName || profile.contactName || '';
  const serviceTitle = profile.serviceTitle || firstService.title || '';
  const serviceDesc = profile.serviceDesc || firstService.description || '';
  const subjects = profile.subjects || firstService.subjects || profile.tags?.join(', ') || '';
  const ageGroups = (profile.ageGroups && profile.ageGroups.length)
    ? profile.ageGroups
    : (firstService.ageGroups || []);
  const deliveryMode = profile.deliveryMode || firstService.deliveryMode || '';

  return {
    ...profile,
    id,
    userId: id,
    name: displayName,
    fullName: displayName,
    email: profile.email || contactEmail,
    contactEmail,
    inquiryEmail: contactEmail,
    serviceTitle,
    serviceDesc,
    subjects,
    ageGroups,
    deliveryMode,
    services: profile.services?.length
      ? profile.services
      : [{ title: serviceTitle, description: serviceDesc, subjects, ageGroups, deliveryMode: deliveryMode || 'Online' }],
    social: profile.website || profile.social || '',
    image: profile.profilePhoto || profile.photo || profile.image || null,
    photo: profile.profilePhoto || profile.photo || profile.image || null,
    updatedAt: now,
    localSavedAt: now,
  };
}
function saveProviderById(updated) {
  try {
    const normalized = normalizeProviderForSave(updated);
    const all = JSON.parse(localStorage.getItem('sah_providers') || '[]');
    const email = String(normalized.email || normalized.contactEmail || normalized.inquiryEmail || '').toLowerCase();
    const idx = all.findIndex(p =>
      p.id === normalized.id
      || p.userId === normalized.id
      || p.id === normalized.userId
      || p.userId === normalized.userId
      || (email && String(p.email || p.contactEmail || p.inquiryEmail || '').toLowerCase() === email)
    );
    if (idx !== -1) all[idx] = { ...all[idx], ...normalized }; else all.push(normalized);
    localStorage.setItem('sah_providers', JSON.stringify(all));
    return true;
  } catch { return false; }
}

function buildProviderSaveFormData(toSave, currentData = {}) {
  const fd = new FormData();
  fd.append('providerData', JSON.stringify({
    fullName:            toSave.name,
    accountType:         toSave.accountType,
    bio:                 toSave.bio,
    experience:          toSave.yearsExperience,
    languages:           toSave.languages,
    primaryCategory:     toSave.primaryCategory,
    secondaryCategories: toSave.secondaryCategories,
    serviceTitle:        toSave.serviceTitle,
    serviceDesc:         toSave.serviceDesc,
    subjects:            toSave.subjects,
    ageGroups:           toSave.ageGroups,
    deliveryMode:        toSave.deliveryMode,
    city:                toSave.city,
    province:            toSave.province,
    serviceAreaType:     toSave.serviceAreaType,
    radius:              toSave.radius,
    pricingModel:        toSave.pricingModel,
    startingPrice:       toSave.startingPrice,
    availabilityDays:    toSave.availabilityDays,
    availabilityNotes:   toSave.availabilityNotes,
    phone:               toSave.phone,
    whatsapp:            toSave.whatsapp,
    inquiryEmail:        toSave.contactEmail,
    website:             toSave.website,
    facebook:            toSave.facebook,
    instagram:           toSave.instagram,
    linkedin:            toSave.linkedin,
    tiktok:              toSave.tiktok,
    twitter:             toSave.twitter,
    degrees:             toSave.degrees,
    certifications:      toSave.certifications,
    memberships:         toSave.memberships,
    clearance:           toSave.clearance,
    profilePhoto:        toSave.profilePhoto || toSave.photo || toSave.image,
    publicDisplay:       toSave.publicToggle,
  }));

  if (currentData._newCertFile) fd.append('certFile', currentData._newCertFile);
  if (currentData._newClearanceFile) fd.append('clearanceFile', currentData._newClearanceFile);
  return fd;
}

function isMemberAccount(account) {
  const role = String(account?.role || '').toUpperCase();
  const accountType = String(account?.accountType || '').toLowerCase();
  return role === 'USER' || ['parent', 'student', 'guardian', 'learner', 'member'].includes(accountType);
}

function getStoredMemberProfile(id) {
  try {
    const all = JSON.parse(localStorage.getItem('sah_member_profiles') || '[]');
    return all.find(p => p.id === id || p.userId === id) || null;
  } catch { return null; }
}

function saveStoredMemberProfile(profile) {
  try {
    const all = JSON.parse(localStorage.getItem('sah_member_profiles') || '[]');
    const idx = all.findIndex(p => p.id === profile.id || p.userId === profile.userId);
    if (idx !== -1) all[idx] = profile; else all.push(profile);
    localStorage.setItem('sah_member_profiles', JSON.stringify(all));
    return true;
  } catch { return false; }
}

function buildMemberProfile(session, existing = {}) {
  return {
    id: session?.id || existing.id || '',
    userId: session?.id || existing.userId || existing.id || '',
    role: 'USER',
    profileKind: 'member',
    name: existing.name || session?.name || '',
    email: existing.email || session?.email || '',
    accountType: existing.accountType || session?.accountType || 'parent',
    phone: existing.phone || '',
    city: existing.city || '',
    province: existing.province || '',
    bio: existing.bio || '',
    image: existing.image || existing.photo || existing.profilePhoto || session?.profilePhoto || null,
    photo: existing.photo || existing.profilePhoto || existing.image || session?.profilePhoto || null,
    profilePhoto: existing.profilePhoto || existing.photo || existing.image || session?.profilePhoto || null,
    publicToggle: existing.publicToggle ?? true,
    updatedAt: existing.updatedAt || null,
  };
}

function toPublicMemberProfile(profile) {
  return {
    ...profile,
    id: profile.userId || profile.id,
    userId: profile.userId || profile.id,
    name: profile.name || '',
    email: profile.email || '',
    contactEmail: profile.email || '',
    primaryCategory: 'Member Profile',
    category: 'Member Profile',
    location: [profile.city, profile.province].filter(Boolean).join(', '),
    image: profile.profilePhoto || profile.photo || profile.image || null,
    photo: profile.profilePhoto || profile.photo || profile.image || null,
    profilePhoto: profile.profilePhoto || profile.photo || profile.image || null,
    listingPlan: 'free',
    tier: 'free',
    plan: 'free',
    services: [],
    tags: [],
    ageGroups: [],
    availabilityDays: [],
    reviews: { average: 0, count: 0, items: [] },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  mapDbProfileToLocal
//  Converts a Prisma ProviderProfile row (DB shape) → flat UI shape used by
//  the dashboard.  Handles both the API response and the localStorage fallback.
// ─────────────────────────────────────────────────────────────────────────────
function mapDbProfileToLocal(db) {
  if (!db) return null;
  return {
    // identity
    id:                   db.id            || db.userId || '',
    userId:               db.userId        || db.id     || '',
    name:                 db.fullName      || db.name   || '',
    fullName:             db.fullName      || db.name   || '',
    email:                db.user?.email   || db.email  || db.inquiryEmail || '',
    accountType:          db.accountType   || 'Individual Provider',
    // profile
    bio:                  db.bio           || '',
    yearsExperience:      db.experience    != null ? String(db.experience) : '',
    languages:            db.languages     || [],
    primaryCategory:      db.primaryCategory || db.category || '',
    secondaryCategories:  db.secondaryCategories || [],
    // tags from subjects field or existing tags array
    tags: db.tags?.length
      ? db.tags
      : (db.subjects ? db.subjects.split(',').map(s => s.trim()).filter(Boolean) : []),
    // qualifications
    degrees:              db.degrees        || '',
    certifications:       db.certifications || '',
    memberships:          db.memberships    || '',
    clearance:            db.clearance      || db.clearanceText || '',
    // service (DB stores flat; UI wraps in array)
    serviceTitle:         db.serviceTitle   || '',
    serviceDesc:          db.serviceDesc    || '',
    subjects:             db.subjects       || '',
    ageGroups:            db.ageGroups      || [],
    deliveryMode:         db.deliveryMode   || db.delivery || '',
    services: db.services?.length
      ? db.services
      : [{
          title:        db.serviceTitle || '',
          description:  db.serviceDesc  || '',
          ageGroups:    db.ageGroups    || [],
          deliveryMode: db.deliveryMode || db.delivery || 'Online',
          subjects:     db.subjects     || '',
        }],
    // location
    city:             db.city             || '',
    province:         db.province         || '',
    serviceAreas:     db.serviceAreas     || [],
    serviceAreaType:  db.serviceAreaType  || 'national',
    radius:           db.radius           != null ? String(db.radius) : '',
    // pricing & availability
    pricingModel:     db.pricingModel     || '',
    startingPrice:    db.startingPrice    || db.priceFrom || '',
    availabilityDays: db.availabilityDays || [],
    availabilityNotes:db.availabilityNotes|| '',
    // contact
    contactName:      db.contactName      || db.fullName || db.name || '',
    phone:            db.phone            || '',
    whatsapp:         db.whatsapp         || '',
    contactEmail:     db.inquiryEmail     || db.contactEmail || db.email || db.user?.email || '',
    // social / web
    website:          db.website          || db.social || '',
    social:           db.website          || db.social || '',
    facebook:         db.facebook         || '',
    instagram:        db.instagram        || '',
    linkedin:         db.linkedin         || '',
    tiktok:           db.tiktok           || '',
    twitter:          db.twitter          || '',
    youtube:          db.youtube          || '',
    // files / media
    image:            db.profilePhoto     || db.photo || db.image || null,
    photo:            db.profilePhoto     || db.photo || db.image || null,
    profilePhoto:     db.profilePhoto     || db.photo || db.image || null,
    // ── KEY FIX: pass through full certFilesAll / clearanceFilesAll arrays ──
    // These carry { name, type, size, data } objects where data is base64
    certFilesAll:         db.certFilesAll         || [],
    clearanceFilesAll:    db.clearanceFilesAll     || [],
    // Legacy flat fields (first file only)
    certFile:         db.certFile         || null,
    certFileName:     db.certFileName     || null,
    certFileType:     db.certFileType     || null,
    clearanceFile:    db.clearanceFile    || null,
    clearanceFileName:db.clearanceFileName|| null,
    clearanceFileType:db.clearanceFileType|| null,
    // Filename-only fallback arrays (when no base64 available)
    certDocuments:    db.certDocuments    || [],
    clearanceDocuments:   db.clearanceDocuments   || [],
    // status / plan
    plan:         db.listingPlan  || db.plan || db.tier || 'free',
    listingPlan:  db.listingPlan  || db.plan || db.tier || 'free',
    tier:         db.listingPlan  || db.tier || db.plan || 'free',
    requestedPlan: db.requestedPlan || null,
    billingStatus: db.billingStatus || 'inactive',
    nextBillingAt: db.nextBillingAt || null,
    status:       (db.status      || 'pending').toLowerCase(),
    publicToggle: db.publicDisplay ?? db.publicToggle ?? true,
    listingPublic:db.publicDisplay ?? db.listingPublic ?? true,
    updatedAt:     db.updatedAt     || null,
    createdAt:     db.createdAt     || null,
    localSavedAt:  db.localSavedAt  || null,
    // reviews
    reviews: db.reviews
      ? (Array.isArray(db.reviews)
          ? { average: 0, count: db.reviews.length, items: db.reviews }
          : db.reviews)
      : { average: 0, count: 0, items: [] },
    registered: db.createdAt   || db.registered || null,
    lastLogin:  db.user?.lastLogin || db.lastLogin || null,
  };
}

/* ─────────────── empty profile ─────────────── */
const EMPTY_PROFILE = {
  id: '', userId: '', name: '', email: '', accountType: 'Individual Provider',
  yearsExperience: '', languages: [], primaryCategory: '', secondaryCategories: [],
  tags: [], bio: '', degrees: '', certifications: '', memberships: '', clearance: '',
  services: [{ title: '', description: '', ageGroups: [], deliveryMode: 'Online', subjects: '' }],
  serviceTitle: '', serviceDesc: '', subjects: '', ageGroups: [],
  province: '', city: '', serviceAreas: [], serviceAreaType: 'national', radius: '',
  deliveryMode: '', pricingModel: '', startingPrice: '',
  availabilityDays: [], availabilityNotes: '',
  contactName: '', phone: '', whatsapp: '', contactEmail: '',
  social: '', website: '', facebook: '', instagram: '', linkedin: '',
  tiktok: '', twitter: '', youtube: '',
  publicToggle: true,
  plan: 'free', listingPublic: true, status: 'pending',
  image: null, photo: null, profilePhoto: null,
  certFile: null, certFileName: null, certFileType: null,
  certFilesAll: [], certDocuments: [],
  clearanceFile: null, clearanceFileName: null, clearanceFileType: null,
  clearanceFilesAll: [], clearanceDocuments: [],
  reviews: { average: 0, count: 0, items: [] },
};

/* ─────────────── plan definitions ─────────────── */
const PLAN_CARDS = [
  {
    id: 'free', name: 'Community Member', desc: 'Basic profile — always free', price: 'R0',
    features: ['Basic profile information', '1 service listing', 'Contact via Parental\'s form', 'Max 1 service'],
  },
  {
    id: 'pro', name: 'Parental Plus+', desc: 'Discounted to R149/month for the first 12 months', price: 'R149',
    features: ['Everything in Community', 'Up to 3 services', 'Direct contact details', 'Pricing and availability visible', 'Newsletter, social post and native article'],
  },
];

const PAYMENT_AMOUNT_RANDS = 149;
const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', icon: 'fa-credit-card' },
  { id: 'bank', label: 'Bank Transfer', icon: 'fa-building-columns' },
  { id: 'eft', label: 'EFT', icon: 'fa-money-bill-transfer' },
];

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function detectCardBrand(number) {
  const digits = digitsOnly(number);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6/.test(digits)) return 'Discover';
  return digits.length >= 4 ? 'Card' : '';
}

function formatCardNumber(value) {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function validateExpiry(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;
  const year = 2000 + Number(match[2]);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth.getTime() >= Date.now();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function validateCardForm(form) {
  const errors = {};
  const cardDigits = digitsOnly(form.cardNumber);
  if (!String(form.cardName || '').trim()) errors.cardName = 'Enter the name on the card.';
  if (cardDigits.length < 13 || cardDigits.length > 19) errors.cardNumber = 'Enter a valid card number.';
  if (!validateExpiry(form.expiry)) errors.expiry = 'Enter a valid future expiry date.';
  if (!/^\d{3,4}$/.test(digitsOnly(form.cvv))) errors.cvv = 'Enter a valid CVV.';
  if (!isValidEmail(form.email)) errors.email = 'Enter a valid billing email.';
  if (form.phone && digitsOnly(form.phone).length < 7) errors.phone = 'Enter a valid phone number or leave it blank.';
  return errors;
}

function validateEftForm(form) {
  const errors = {};
  if (!String(form.fullName || '').trim()) errors.fullName = 'Enter your full name.';
  if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address.';
  if (form.phone && digitsOnly(form.phone).length < 7) errors.phone = 'Enter a valid phone number or leave it blank.';
  return errors;
}

function friendlyPaymentError(error) {
  const message = String(error?.message || '');
  if (/prisma|invocation|unknown argument|does not exist|database|column/i.test(message)) {
    return 'Demo payment could not start cleanly. Please try again.';
  }
  return message || 'Payment could not be processed. Please try again.';
}

const TABS = [
  { id: 'profile',  label: 'Profile',           icon: 'fa-user' },
  { id: 'services', label: 'Services',           icon: 'fa-briefcase' },
  { id: 'location', label: 'Location & Pricing', icon: 'fa-map-marker-alt' },
  { id: 'contact',  label: 'Contact & Social',   icon: 'fa-address-card' },
  { id: 'plan',     label: 'Plan & Reviews',     icon: 'fa-crown' },
];

/* ─────────────── styles ─────────────── */
const DASH_CSS = `
  .cd-wrap { font-family:'DM Sans','Segoe UI',sans-serif; background:#f4f1ec; min-height:100vh; -webkit-font-smoothing:antialiased; }
  .cd-wrap * { box-sizing:border-box; }
  .cd-hero { background:#6f8da6; padding:32px 0 0; position:relative; overflow:hidden; }
  .cd-hero::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23fff' fill-opacity='.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
  .cd-hero-top { max-width:1280px; margin:0 auto; padding:0 32px 28px; position:relative; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; flex-wrap:wrap; }
  .cd-hero-left { flex:1; min-width:0; }
  .cd-hero-eyebrow { font-size:0.67rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.5); margin-bottom:7px; display:flex; align-items:center; gap:8px; }
  .cd-hero-eyebrow span { width:20px; height:1px; background:rgba(255,255,255,0.3); display:inline-block; }
  .cd-hero-title { font-size:clamp(1.4rem,2.5vw,1.9rem); font-weight:800; color:#fff; margin:0 0 10px; line-height:1.15; font-family:'Playfair Display',Georgia,serif; }
  .cd-hero-title em { font-style:italic; color:#b7d5ea; }
  .cd-hero-meta { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  .cd-status-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 14px; border-radius:50px; font-size:0.75rem; font-weight:700; }
  .cd-status-pill.pending  { background:rgba(245,158,11,.2); color:#fbbf24; border:1px solid rgba(245,158,11,.35); }
  .cd-status-pill.approved { background:rgba(16,185,129,.2); color:#34d399; border:1px solid rgba(16,185,129,.35); }
  .cd-status-pill.rejected { background:rgba(239,68,68,.2);  color:#f87171; border:1px solid rgba(239,68,68,.35); }
  .cd-hero-right { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .cd-hero-right .cd-btn-solid { display:none; }
  .cd-btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:7px; border:1.5px solid rgba(255,255,255,.38); background:rgba(255,255,255,.07); color:#fff; font-size:0.81rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all .17s; text-decoration:none; white-space:nowrap; }
  .cd-btn-ghost:hover { background:rgba(255,255,255,.18); border-color:rgba(255,255,255,.75); }
  .cd-btn-solid { display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:7px; border:none; background:#6f8da6; color:#fff; font-size:0.81rem; font-weight:700; cursor:pointer; font-family:inherit; transition:all .17s; white-space:nowrap; }
  .cd-btn-solid:hover { background:#557691; transform:translateY(-1px); }
  .cd-btn-solid:disabled { opacity:.6; cursor:not-allowed; transform:none; }
  .cd-btn-solid.cancel { background:#6f8da6; }
  .cd-btn-solid.cancel:hover { background:#557691; }
  .cd-tab-bar { max-width:1280px; margin:0 auto; padding:0 32px; display:flex; gap:2px; position:relative; z-index:10; }
  .cd-tab-btn { padding:10px 18px; background:#ff8c42; border:none; border-bottom:none; color:#fff; font-size:0.8rem; font-weight:700; cursor:pointer; font-family:inherit; border-radius:8px 8px 0 0; transition:all .15s; display:inline-flex; align-items:center; gap:7px; white-space:nowrap; box-shadow:0 8px 18px rgba(255,140,66,.18); }
  .cd-tab-btn:hover { background:#f47b2b; color:#fff; }
  .cd-tab-btn.active { background:#e96f1f; color:#fff; font-weight:800; }
  .cd-main { max-width:1280px; margin:0 auto; padding:22px 32px 64px; }
  .cd-alert-wrap { max-width:1280px; margin:0 auto; padding:12px 32px 0; display:flex; justify-content:flex-end; }
  .cd-enquiry-bell { position:relative; width:44px; height:44px; border-radius:12px; border:1.5px solid #dbe8f1; background:#fff; color:#6f8da6; box-shadow:0 6px 18px rgba(111,141,166,.12); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1rem; transition:all .15s; }
  .cd-enquiry-bell:hover { border-color:#6f8da6; transform:translateY(-1px); box-shadow:0 10px 24px rgba(111,141,166,.16); }
  .cd-enquiry-bell.shake { animation:cdBellShake .34s ease-in-out; }
  .cd-enquiry-alert-count { position:absolute; top:-7px; right:-7px; min-width:19px; height:19px; border-radius:99px; padding:0 5px; background:#ff8c42; color:#fff; display:flex; align-items:center; justify-content:center; font-size:.62rem; font-weight:900; border:2px solid #fff; }
  @keyframes cdBellShake {
    0%, 100% { transform:rotate(0deg); }
    20% { transform:rotate(-14deg); }
    40% { transform:rotate(12deg); }
    60% { transform:rotate(-8deg); }
    80% { transform:rotate(6deg); }
  }
  .cd-directory-back { display:inline-flex; align-items:center; gap:8px; width:fit-content; margin:0 0 16px; padding:9px 16px; border-radius:8px; border:1.5px solid rgba(111,141,166,.35); background:#fff; color:#6f8da6; font-size:.86rem; font-weight:800; text-decoration:none; box-shadow:0 4px 14px rgba(0,0,0,.05); transition:all .15s; }
  .cd-directory-back:hover { border-color:#6f8da6; transform:translateY(-1px); box-shadow:0 8px 20px rgba(0,0,0,.08); }
  .cd-layout { display:grid; grid-template-columns:1fr 300px; gap:18px; align-items:start; }
  .cd-card { background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.06),0 1px 3px rgba(0,0,0,.04); margin-bottom:16px; border:1px solid rgba(0,0,0,.05); }
  .cd-card-header { display:flex; align-items:center; gap:11px; padding:14px 20px; border-bottom:1px solid #f0ece5; background:#faf9f7; }
  .cd-card-header-icon { width:34px; height:34px; border-radius:8px; background:#6f8da6; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.8rem; flex-shrink:0; }
  .cd-card-title    { font-size:0.88rem; font-weight:700; color:#1a1a1a; margin:0; }
  .cd-card-subtitle { font-size:0.71rem; color:#888; margin:1px 0 0; }
  .cd-card-body     { padding:20px; }
  .cd-card-body.tight { padding:14px 20px; }
  .cd-card-actions { margin-left:auto; display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
  .cd-inquiry-body { padding:12px 14px; }
  .cd-inquiry-layout { display:grid; grid-template-columns:minmax(260px,.8fr) minmax(340px,1fr); gap:12px; align-items:start; }
  .cd-inquiry-list { display:flex; flex-direction:column; gap:8px; align-self:start; }
  .cd-inquiry-card { border:1.5px solid #edf1f4; background:#fff; border-radius:9px; padding:10px 12px; display:flex; align-items:flex-start; gap:10px; width:100%; cursor:pointer; text-align:left; font-family:inherit; transition:all .15s; margin:0; }
  .cd-inquiry-card:hover { border-color:#6f8da6; box-shadow:0 8px 22px rgba(111,141,166,.12); transform:translateY(-1px); }
  .cd-inquiry-card.unread { background:#f8fcff; border-color:#b7d5ea; }
  .cd-inquiry-dot { width:30px; height:30px; border-radius:8px; background:#edf7ff; color:#6f8da6; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:.78rem; }
  .cd-inquiry-card.unread .cd-inquiry-dot { background:#6f8da6; color:#fff; }
  .cd-inquiry-main { flex:1; min-width:0; }
  .cd-inquiry-title { font-size:.82rem; font-weight:800; color:#1a1a1a; margin-bottom:2px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .cd-inquiry-meta { font-size:.69rem; color:#888; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .cd-inquiry-preview { color:#555; font-size:.76rem; margin-top:5px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
  .cd-inquiry-new { background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; border-radius:99px; padding:2px 7px; font-size:.62rem; font-weight:900; text-transform:uppercase; letter-spacing:.4px; }
  .cd-inquiry-empty { padding:14px; border:1.5px dashed #d9e3ea; border-radius:10px; background:#f8fcff; color:#6f8da6; font-size:.8rem; font-weight:700; text-align:center; }
  .cd-inquiry-side-panel { border-radius:10px; padding:12px; background:#f8fcff; border:1px solid #dcebf5; color:#5d7890; }
  .cd-inquiry-side-kicker { font-size:.62rem; font-weight:900; letter-spacing:.55px; text-transform:uppercase; color:#6f8da6; margin-bottom:7px; display:flex; align-items:center; gap:6px; }
  .cd-inquiry-side-text { font-size:.76rem; line-height:1.55; margin:0; color:#5c6872; }
  .cd-inquiry-side-stats { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:10px; }
  .cd-inquiry-side-stat { background:#fff; border:1px solid #e6eef4; border-radius:8px; padding:8px; }
  .cd-inquiry-side-num { font-size:1rem; font-weight:900; color:#6f8da6; line-height:1; }
  .cd-inquiry-side-label { font-size:.62rem; color:#888; margin-top:3px; font-weight:800; text-transform:uppercase; letter-spacing:.35px; }
  .cd-inquiry-detail { background:#faf9f7; border:1px solid #f0ece5; border-radius:10px; padding:12px; align-self:start; }
  .cd-inquiry-detail h4 { margin:0 0 8px; font-size:.86rem; color:#1a1a1a; }
  .cd-inquiry-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:7px; }
  .cd-inquiry-detail-row { display:block; font-size:.76rem; padding:7px 9px; border:1px solid #ece6dd; border-radius:8px; background:#fff; min-width:0; }
  .cd-inquiry-detail-row.wide { grid-column:1 / -1; }
  .cd-inquiry-detail-row:last-child { border-bottom:none; }
  .cd-inquiry-detail-label { color:#888; font-weight:800; text-transform:uppercase; letter-spacing:.4px; font-size:.61rem; margin-bottom:3px; }
  .cd-inquiry-detail-value { color:#333; line-height:1.45; word-break:break-word; }
  .cd-inquiry-count { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; padding:0 7px; border-radius:99px; background:#6f8da6; color:#fff; font-size:.7rem; font-weight:900; }
  .cd-inquiry-response-box { margin-top:8px; padding-top:8px; border-top:1px solid #e7ded3; }
  .cd-inquiry-response-box textarea { width:100%; min-height:52px; resize:vertical; border:1.5px solid #e5e0d8; border-radius:8px; padding:8px 10px; font-family:inherit; font-size:.78rem; color:#333; background:#fff; outline:none; }
  .cd-inquiry-response-box textarea:focus { border-color:#6f8da6; box-shadow:0 0 0 3px rgba(111,141,166,.1); }
  .cd-inquiry-response-actions { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:7px; flex-wrap:wrap; }
  .cd-inquiry-response-note { font-size:.69rem; color:#888; line-height:1.4; }
  .cd-inquiry-reply { margin-top:11px; padding:12px 13px; border-radius:9px; background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; font-size:.82rem; line-height:1.55; }
  .cd-inquiry-reply-label { display:block; font-size:.64rem; font-weight:900; text-transform:uppercase; letter-spacing:.5px; color:#059669; margin-bottom:4px; }
  .cd-edit-toggle { margin-left:auto; display:inline-flex; align-items:center; gap:6px; padding:6px 13px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:700; border:1.5px solid; transition:all .15s; font-family:inherit; }
  .cd-edit-toggle.inactive { border-color:#d1d5db; background:transparent; color:#6b7280; }
  .cd-edit-toggle.inactive:hover { border-color:#6f8da6; color:#6f8da6; }
  .cd-edit-toggle.active { border-color:#6f8da6; background:#edf7ff; color:#6f8da6; }
  .cd-field { margin-bottom:14px; }
  .cd-field:last-child { margin-bottom:0; }
  .cd-label { display:block; font-size:0.67rem; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#888; margin-bottom:5px; }
  .cd-label .req { color:#6f8da6; }
  .cd-value { font-size:0.87rem; color:#1a1a1a; padding:7px 0; border-bottom:1px solid #f0ece5; min-height:32px; display:flex; align-items:center; }
  .cd-value.empty { color:#bbb; font-style:italic; }
  .cd-input { width:100%; padding:9px 12px; border:1.5px solid #e5e0d8; border-radius:7px; background:#faf9f7; font-family:inherit; font-size:0.87rem; color:#1a1a1a; outline:none; transition:border-color .15s,box-shadow .15s; -webkit-appearance:none; appearance:none; }
  .cd-input:focus { border-color:#6f8da6; box-shadow:0 0 0 3px rgba(85,118,145,.11); }
  .cd-textarea { resize:vertical; min-height:82px; }
  .cd-select { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 11px center; padding-right:30px; cursor:pointer; }
  .cd-row   { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .cd-row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  .cd-svc-card { background:#faf9f7; border:1px solid #e5e0d8; border-radius:9px; padding:14px 16px; margin-bottom:10px; }
  .cd-svc-card.editing { border-color:#6f8da6; background:#fff; }
  .cd-svc-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; align-items:start; }
  .cd-svc-grid .cd-field { margin-bottom:0; }
  .cd-sec-label { font-size:0.67rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#6f8da6; display:flex; align-items:center; gap:7px; padding-bottom:8px; border-bottom:1px solid #f0ece5; margin:16px 0 12px; }
  .cd-days { display:flex; flex-wrap:wrap; gap:7px; }
  .cd-day-chip { padding:5px 12px; border-radius:20px; font-size:0.77rem; font-weight:600; transition:all .13s; border:none; }
  .cd-day-chip.on  { background:#6f8da6; color:#fff; }
  .cd-day-chip.off { background:#f0ece5; color:#bbb; border:1px solid #e5e0d8; }
  .cd-day-chip.clickable { cursor:pointer; }
  .cd-day-chip.clickable.off:hover { border-color:#6f8da6; color:#6f8da6; }
  .cd-tags { display:flex; flex-wrap:wrap; gap:7px; }
  .cd-tag { display:inline-flex; align-items:center; gap:4px; padding:3px 11px; border-radius:20px; background:#edf7ff; color:#6f8da6; border:1px solid #b7d5ea; font-size:0.75rem; font-weight:600; }
  .cd-tag button { background:none; border:none; cursor:pointer; color:#6f8da6; font-size:0.68rem; padding:0; line-height:1; }
  .cd-plan-badge { display:inline-flex; align-items:center; gap:7px; padding:8px 15px; border-radius:9px; font-size:0.82rem; font-weight:700; border:2px solid; }
  .cd-plan-badge.free     { background:#f9f9f9; color:#666;    border-color:#e5e5e5; }
  .cd-plan-badge.pro      { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
  .cd-plan-badge.featured { background:#fffbeb; color:#d97706; border-color:#fde68a; }
  .cd-plan-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; max-width:760px; margin:0 auto; }
  .cd-plan-card { border:2px solid #e5e0d8; border-radius:11px; padding:17px; background:#fff; position:relative; transition:border-color .18s; }
  .cd-plan-card.is-current { border-color:#6f8da6; background:#f8fcff; }
  .cd-plan-current-badge { position:absolute; top:-1px; right:14px; background:#6f8da6; color:#fff; font-size:0.63rem; font-weight:800; letter-spacing:.8px; text-transform:uppercase; padding:3px 9px; border-radius:0 0 7px 7px; }
  .cd-plan-card-name  { font-size:0.92rem; font-weight:800; color:#1a1a1a; margin-bottom:2px; }
  .cd-plan-card-desc  { font-size:0.72rem; color:#888; margin-bottom:9px; }
  .cd-plan-price      { font-family:'Playfair Display',serif; font-size:1.5rem; font-weight:900; color:#6f8da6; line-height:1; margin-bottom:11px; }
  .cd-plan-price small { font-size:0.59rem; color:#888; font-weight:400; font-family:'DM Sans',sans-serif; display:block; margin-top:2px; }
  .cd-plan-features   { list-style:none; padding:0; margin:0 0 4px; display:flex; flex-direction:column; gap:5px; }
  .cd-plan-features li { display:flex; align-items:center; gap:6px; font-size:0.77rem; color:#555; }
  .cd-plan-features li i { color:#10b981; font-size:0.63rem; }
  .cd-plan-action-btn { width:100%; margin-top:12px; padding:9px; border-radius:7px; font-size:0.8rem; font-weight:700; cursor:pointer; border:none; font-family:inherit; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:6px; }
  .cd-plan-action-btn.current   { background:#edf7ff; color:#6f8da6; border:2px solid #6f8da6; cursor:default; pointer-events:none; }
  .cd-plan-action-btn.upgrade   { background:#6f8da6; color:#fff; }
  .cd-plan-action-btn.upgrade:hover { background:#557691; }
  .cd-plan-action-btn.downgrade { background:#6f8da6; color:#fff; border:1.5px solid #6f8da6; }
  .cd-plan-action-btn.downgrade:hover { background:#557691; border-color:#557691; }
  .cd-payment-overlay { position:fixed; inset:0; z-index:10000; background:rgba(20,29,38,.56); display:flex; align-items:center; justify-content:center; padding:18px; }
  .cd-payment-modal { width:min(620px,100%); max-height:calc(100vh - 36px); overflow:auto; background:#fff; border-radius:12px; box-shadow:0 24px 76px rgba(0,0,0,.24); border:1px solid rgba(0,0,0,.08); }
  .cd-payment-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:18px 20px; background:#6f8da6; color:#fff; }
  .cd-payment-kicker { font-size:.68rem; font-weight:900; letter-spacing:1.3px; text-transform:uppercase; opacity:.76; }
  .cd-payment-title { margin-top:5px; font-family:'Playfair Display',serif; font-size:1.45rem; font-weight:900; line-height:1.1; }
  .cd-payment-close { width:32px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,.36); background:rgba(255,255,255,.08); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .cd-payment-body { padding:20px; }
  .cd-payment-summary { display:grid; grid-template-columns:1fr auto; gap:14px; align-items:center; padding:14px 16px; background:#faf9f7; border:1px solid #f0ece5; border-radius:9px; margin-bottom:16px; }
  .cd-payment-plan-name { font-weight:900; color:#1a1a1a; font-size:.96rem; }
  .cd-payment-plan-note { color:#837b70; font-size:.74rem; margin-top:3px; }
  .cd-payment-amount { text-align:right; font-family:'Playfair Display',serif; font-size:1.55rem; font-weight:900; color:#6f8da6; line-height:1; }
  .cd-payment-amount small { display:block; font-family:'DM Sans',sans-serif; font-size:.62rem; color:#888; font-weight:600; margin-top:3px; }
  .cd-payment-section-title { font-size:.72rem; font-weight:900; color:#1a1a1a; text-transform:uppercase; letter-spacing:.7px; margin:0 0 9px; }
  .cd-payment-methods { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:16px; }
  .cd-payment-method { border:1.5px solid #e5e0d8; border-radius:9px; background:#fff; padding:12px 10px; cursor:pointer; font-family:inherit; color:#555; display:flex; flex-direction:column; align-items:center; gap:7px; min-height:82px; transition:border-color .15s, background .15s, color .15s; }
  .cd-payment-method i { font-size:1.05rem; color:#6f8da6; }
  .cd-payment-method span { font-size:.76rem; font-weight:900; }
  .cd-payment-method.selected { border-color:#ff8c42; background:#fff7f0; color:#1a1a1a; }
  .cd-payment-steps { display:grid; gap:8px; margin:0 0 16px; padding:0; list-style:none; }
  .cd-payment-steps li { display:flex; gap:9px; align-items:flex-start; font-size:.8rem; color:#555; }
  .cd-payment-steps i { color:#10b981; margin-top:2px; font-size:.74rem; flex-shrink:0; }
  .cd-payment-error { padding:10px 12px; border-radius:8px; background:#fff3e0; color:#856404; font-size:.8rem; font-weight:800; margin-bottom:14px; }
  .cd-payment-actions { display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; border-top:1px solid #f0ece5; padding-top:16px; }
  .cd-payment-secondary { border:1.5px solid #dbe8f1; background:#fff; color:#6f8da6; border-radius:8px; padding:10px 15px; font-family:inherit; font-weight:900; cursor:pointer; }
  .cd-payment-primary { border:none; background:#ff8c42; color:#fff; border-radius:8px; padding:10px 17px; font-family:inherit; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; gap:8px; }
  .cd-payment-primary:disabled { opacity:.65; cursor:not-allowed; }
  .cd-payment-test-mode { display:inline-flex; margin-left:8px; padding:2px 7px; border-radius:999px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.26); font-size:.58rem; vertical-align:middle; }
  .cd-payment-form, .cd-payment-bank { margin:14px 0 4px; }
  .cd-payment-note { display:flex; align-items:flex-start; gap:8px; padding:10px 12px; background:#fffbeb; border:1px solid #fde68a; color:#856404; border-radius:8px; font-size:.78rem; font-weight:700; line-height:1.45; margin-bottom:13px; }
  .cd-payment-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .cd-payment-grid label { display:grid; gap:6px; color:#555; font-size:.72rem; font-weight:900; text-transform:uppercase; letter-spacing:.45px; }
  .cd-payment-grid label.wide { grid-column:1 / -1; }
  .cd-payment-grid input { width:100%; border:1.5px solid #e5e0d8; border-radius:8px; padding:10px 11px; font:inherit; font-size:.86rem; color:#1a1a1a; background:#fff; text-transform:none; letter-spacing:0; }
  .cd-payment-grid input:focus { outline:none; border-color:#6f8da6; box-shadow:0 0 0 3px rgba(111,141,166,.13); }
  .cd-payment-card-input { display:grid; grid-template-columns:1fr auto; align-items:center; gap:8px; border:1.5px solid #e5e0d8; border-radius:8px; padding:0 10px 0 0; background:#fff; }
  .cd-payment-card-input input { border:0; box-shadow:none; }
  .cd-payment-card-input input:focus { box-shadow:none; }
  .cd-payment-card-input span { color:#6f8da6; font-size:.72rem; font-weight:900; white-space:nowrap; }
  .cd-payment-field-error { color:#b91c1c; font-size:.7rem; font-weight:800; text-transform:none; letter-spacing:0; }
  .cd-payment-secure { display:flex; align-items:center; gap:7px; color:#2e7d32; font-size:.76rem; font-weight:900; margin-top:12px; }
  .cd-payment-result { text-align:center; padding:18px 6px 8px; }
  .cd-payment-result > i { font-size:2.1rem; margin-bottom:9px; }
  .cd-payment-result.success > i { color:#10b981; }
  .cd-payment-result.failed > i { color:#ef4444; }
  .cd-payment-result.pending > i { color:#6f8da6; }
  .cd-payment-result h3 { margin:0 0 6px; color:#1a1a1a; font-size:1.05rem; }
  .cd-payment-result p { margin:0 auto 14px; color:#555; font-size:.84rem; line-height:1.55; max-width:460px; }
  .cd-payment-result-grid { display:grid; grid-template-columns:minmax(120px, .75fr) 1.25fr; gap:8px 12px; align-items:center; text-align:left; padding:13px 14px; background:#faf9f7; border:1px solid #f0ece5; border-radius:8px; margin:12px 0 15px; }
  .cd-payment-result-grid span { color:#837b70; font-size:.72rem; font-weight:900; text-transform:uppercase; }
  .cd-payment-result-grid strong { color:#1a1a1a; font-size:.82rem; word-break:break-word; }
  .cd-copy-btn { margin-left:6px; border:1px solid #dbe8f1; background:#fff; color:#6f8da6; border-radius:6px; padding:3px 7px; font:inherit; font-size:.68rem; font-weight:900; cursor:pointer; }
  .cd-payment-actions.inline { justify-content:center; border-top:0; padding-top:2px; }
  .cd-payment-demo-tools { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-top:11px; padding-top:11px; border-top:1px solid #f0ece5; }
  .cd-payment-demo-tools button { border:1px solid #e5e0d8; background:#fff; color:#555; border-radius:7px; padding:7px 9px; font:inherit; font-size:.7rem; font-weight:900; cursor:pointer; }
  .cd-review { padding:12px 14px; background:#faf9f7; border-radius:9px; border-left:3px solid #6f8da6; margin-bottom:9px; }
  .cd-review-stars  { color:#f59e0b; font-size:0.82rem; margin-bottom:3px; }
  .cd-review-text   { font-size:0.84rem; color:#555; font-style:italic; }
  .cd-review-author { font-size:0.72rem; color:#888; margin-top:3px; font-weight:600; }
  .cd-contact-item { display:flex; align-items:center; gap:11px; padding:10px 0; border-bottom:1px solid #f0ece5; }
  .cd-contact-item:last-child { border-bottom:none; }
  .cd-contact-icon { width:31px; height:31px; border-radius:7px; background:#edf7ff; display:flex; align-items:center; justify-content:center; color:#6f8da6; font-size:0.8rem; flex-shrink:0; }
  .cd-contact-label { font-size:0.67rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#aaa; }
  .cd-contact-val   { font-size:0.85rem; color:#1a1a1a; font-weight:500; }
  .cd-toggle-row { display:flex; align-items:center; justify-content:space-between; }
  .cd-switch { position:relative; display:inline-block; width:40px; height:22px; }
  .cd-switch input { opacity:0; width:0; height:0; }
  .cd-slider { position:absolute; cursor:pointer; inset:0; background:#d1d5db; border-radius:22px; transition:.2s; }
  .cd-slider::before { content:''; position:absolute; height:16px; width:16px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:.2s; box-shadow:0 1px 3px rgba(0,0,0,.18); }
  .cd-switch input:checked + .cd-slider { background:#6f8da6; }
  .cd-switch input:checked + .cd-slider::before { transform:translateX(18px); }
  .cd-footer-bar { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; background:#faf9f7; border-top:1px solid #f0ece5; gap:10px; flex-wrap:wrap; }
  .cd-last-edit { font-size:0.72rem; color:#aaa; display:flex; align-items:center; gap:5px; }
  .cd-clearance { display:inline-flex; align-items:center; gap:6px; padding:4px 11px; border-radius:6px; background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; font-size:0.75rem; font-weight:700; }
  .cd-info-note { display:flex; align-items:flex-start; gap:8px; padding:10px 13px; background:#fffbeb; border-radius:7px; border:1px solid #fde68a; font-size:0.77rem; color:#92400e; margin-bottom:12px; }
  .cd-info-note i { color:#f59e0b; margin-top:1px; flex-shrink:0; }
  .cd-info-note.last { margin-bottom:0; }
  .cd-photo-wrap { position:relative; display:inline-block; flex-shrink:0; }
  .cd-photo-img  { width:76px; height:76px; border-radius:50%; object-fit:cover; border:3px solid #6f8da6; display:block; }
  .cd-photo-placeholder { width:76px; height:76px; border-radius:50%; background:#edf7ff; border:3px solid #6f8da6; display:flex; align-items:center; justify-content:center; color:#6f8da6; font-size:1.5rem; }
  .cd-photo-btn { position:absolute; bottom:0; right:0; background:#6f8da6; color:#fff; border:2px solid #fff; border-radius:50%; width:25px; height:25px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.67rem; transition:background .15s; }
  .cd-photo-btn:hover { background:#557691; }
  .cd-photo-input { display:none; }
  .cd-sidebar-card { background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,.06); margin-bottom:14px; border:1px solid rgba(0,0,0,.05); overflow:hidden; }
  .cd-sidebar-header { padding:12px 16px; background:#5a5a5a; }
  .cd-sidebar-title { font-size:0.75rem; font-weight:700; color:#fff; text-transform:uppercase; letter-spacing:.7px; }
  .cd-sidebar-body  { padding:14px 16px; }
  .cd-terms-summary { font-size:.78rem; color:#555; line-height:1.6; margin:0 0 10px; }
  .cd-sidebar-link-btn { border:none; background:none; color:#6f8da6; font-family:inherit; font-size:.77rem; font-weight:900; padding:0; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
  .cd-sidebar-link-btn:hover { color:#557691; text-decoration:underline; }
  .cd-sidebar-downgrade { width:100%; margin-top:12px; padding:9px 11px; border-radius:7px; border:none; background:#ff8c42; color:#fff; font-family:inherit; font-size:.78rem; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; }
  .cd-sidebar-downgrade:hover { background:#f47b2b; }
  .cd-terms-card { cursor:pointer; transition:transform .15s, box-shadow .15s; }
  .cd-terms-card:hover { transform:translateY(-1px); box-shadow:0 8px 20px rgba(0,0,0,.08); }
  .cd-terms-card .cd-sidebar-header { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .cd-terms-toggle { color:#fff; opacity:.78; font-size:.75rem; transition:transform .16s; }
  .cd-terms-toggle.open { transform:rotate(180deg); }
  .cd-terms-closed-note { padding:12px 16px; font-size:.76rem; color:#888; background:#fff; }
  .cd-terms-modal-overlay { position:fixed; inset:0; background:rgba(20,29,38,.52); display:flex; align-items:center; justify-content:center; padding:24px 16px; z-index:9999; overflow:hidden; }
  .cd-terms-modal { width:min(680px,100%); max-height:calc(100vh - 48px); background:#fff; border-radius:12px; box-shadow:0 22px 70px rgba(0,0,0,.22); border:1px solid rgba(0,0,0,.08); overflow:hidden; display:flex; flex-direction:column; }
  .cd-terms-modal-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; background:#5a5a5a; color:#fff; flex-shrink:0; }
  .cd-terms-modal-title { font-size:.9rem; font-weight:900; text-transform:uppercase; letter-spacing:.7px; display:flex; align-items:center; gap:8px; }
  .cd-terms-modal-close { width:30px; height:30px; border-radius:7px; border:1px solid rgba(255,255,255,.3); background:rgba(255,255,255,.08); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .cd-terms-modal-body { padding:16px 18px; color:#444; font-size:.84rem; line-height:1.65; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; scrollbar-gutter:stable; }
  .cd-terms-modal-body ul { margin:10px 0 0; padding-left:18px; }
  .cd-terms-modal-body li { margin-bottom:7px; }
  .cd-terms-modal-body ol { margin:0; padding-left:20px; }
  .cd-terms-modal-body ol > li { margin-bottom:13px; }
  .cd-terms-modal-body strong { display:block; color:#1a1a1a; font-size:.86rem; margin-bottom:3px; }
  .cd-terms-modal-body p { margin:0; }
  .cd-comp-item { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #f8f6f3; }
  .cd-comp-item:last-of-type { border-bottom:none; }
  /* ── uploaded document card ── */
  .cd-doc-card { display:flex; align-items:center; gap:10px; padding:10px 13px; background:#faf9f7; border:1.5px solid #e5e0d8; border-radius:8px; margin-bottom:8px; }
  .cd-doc-icon { width:32px; height:32px; border-radius:7px; background:#fff3e8; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .cd-doc-icon i { color:#6f8da6; font-size:0.82rem; }
  .cd-doc-info { flex:1; min-width:0; }
  .cd-doc-name { font-size:0.78rem; font-weight:700; color:#1a1a1a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cd-doc-sub  { font-size:0.68rem; color:#aaa; margin-top:1px; }
  .cd-doc-dl { padding:5px 11px; border-radius:5px; background:#6f8da6; color:#fff; font-size:0.7rem; font-weight:700; border:none; cursor:pointer; font-family:inherit; transition:background .15s; flex-shrink:0; display:inline-flex; align-items:center; gap:5px; }
  .cd-doc-dl:hover { background:#557691; }
  /* ── qual upload notice ── */
  .cd-qual-notice { display:flex; align-items:flex-start; gap:8px; padding:10px 13px; background:#f0f9ff; border-radius:7px; border:1px solid #bae6fd; font-size:0.77rem; color:#0369a1; margin-top:8px; }
  .cd-qual-notice i { color:#0284c7; margin-top:1px; flex-shrink:0; }
  /* ── documents section header ── */
  .cd-docs-section-title { font-size:0.67rem; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#aaa; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
  .cd-docs-empty { font-size:0.8rem; color:#bbb; font-style:italic; padding:8px 0; }
  @media(max-width:1024px) { .cd-layout { grid-template-columns:1fr; } .cd-plan-grid { grid-template-columns:1fr; } }
  @media(max-width:768px)  { .cd-main { padding:16px 14px 48px; } .cd-alert-wrap { padding:12px 14px 0; } .cd-hero-top { padding:0 16px 24px; } .cd-tab-bar { padding:0 14px; overflow-x:auto; flex-wrap:nowrap; } .cd-row { grid-template-columns:1fr; } .cd-svc-grid { grid-template-columns:1fr 1fr; } }
  @media(max-width:620px)  { .cd-payment-methods { grid-template-columns:1fr; } .cd-payment-summary { grid-template-columns:1fr; } .cd-payment-amount { text-align:left; } .cd-payment-grid { grid-template-columns:1fr; } .cd-payment-result-grid { grid-template-columns:1fr; } }
  @media(max-width:768px){
  .cd-hero-top { padding: 0 14px 20px; }
  .cd-tab-bar { padding: 0 10px; gap: 1px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .cd-tab-btn { padding: 8px 10px; font-size: 0.72rem; white-space: nowrap; flex-shrink: 0; }
  .cd-tab-btn i { display: none; }
  .cd-layout { grid-template-columns: 1fr; }
  .cd-row { grid-template-columns: 1fr; }
  .cd-card-body { padding: 14px; }
  .cd-card-header { align-items: flex-start; }
  .cd-card-actions { width: 100%; margin-left: 0; justify-content: flex-start; }
  .cd-hero-title { font-size: 1.3rem; }
  .cd-btn-ghost, .cd-btn-solid { font-size: 0.75rem; padding: 6px 10px; }
  .cd-plan-grid { grid-template-columns: 1fr; }
  .cd-svc-grid { grid-template-columns: 1fr; }
  .cd-inquiry-layout { grid-template-columns: 1fr; }
  .cd-inquiry-detail-grid { grid-template-columns: 1fr; }
}
  @media(max-width:520px)  { .cd-svc-grid { grid-template-columns:1fr; } .cd-row-3 { grid-template-columns:1fr 1fr; } .cd-plan-grid { grid-template-columns:1fr; } }
`;

/* ═══════════════════════════════════════════════════ */
const ClientDashboard = () => {
  const { user, updateUserPlan } = useAuth();
  const { showNotification }     = useNotification();
  const navigate                 = useNavigate();
  const photoInputRef            = useRef(null);
  const qualFileInputRef         = useRef(null);
  const clearanceFileInputRef    = useRef(null);
  const autosaveTimerRef         = useRef(null);
  const autosaveSeqRef           = useRef(0);

  const [activeTab,    setActiveTab]    = useState('profile');
  const [editing,      setEditing]      = useState(false);
  const [editSection,  setEditSection]  = useState(null);
  const [snapshot,     setSnapshot]     = useState(null);
  const [profileData,  setProfileData]  = useState(EMPTY_PROFILE);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [qualFileName,     setQualFileName]     = useState('');
  const [clearanceFileName, setClearanceFileName] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseDrafts, setResponseDrafts] = useState({});
  const [shakingBell, setShakingBell] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsCardOpen, setTermsCardOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutMethod, setCheckoutMethod] = useState('card');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutState, setCheckoutState] = useState('idle');
  const [activePayment, setActivePayment] = useState(null);
  const [cardForm, setCardForm] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '', email: '', phone: '' });
  const [eftForm, setEftForm] = useState({ fullName: '', email: '', phone: '' });
  const [copiedPaymentField, setCopiedPaymentField] = useState('');
  const [bankCountdown, setBankCountdown] = useState('');
  const [autosaveStatus, setAutosaveStatus] = useState('saved');

  /* inject CSS once */
  useEffect(() => {
    let s = document.getElementById('cd-styles');
    if (!s) {
      s = document.createElement('style');
      s.id = 'cd-styles';
      document.head.appendChild(s);
    }
    s.textContent = DASH_CSS;

    if (!document.getElementById('cd-fonts')) {
      const l = document.createElement('link');
      l.id = 'cd-fonts'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap';
      document.head.appendChild(l);
    }
  }, []);

  const refreshInquiries = useCallback(() => {
    setInquiries(getInquiries());
  }, []);

  useEffect(() => {
    refreshInquiries();
    const onFocus = () => refreshInquiries();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshInquiries]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const token = localStorage.getItem('sah_token');
        if (!token || token.startsWith('local_')) return;
        const result = await api.getPaymentHistory(token);
        setPaymentHistory(result.payments || []);
      } catch {
        setPaymentHistory([]);
      }
    };

    loadPayments();
  }, []);

  /* ── load profile: try API first, fall back to localStorage ── */
  useEffect(() => {
    const cu = getCurrentUser();
    if (!cu) { navigate('/login'); return; }

    const load = async () => {
      setDataLoading(true);
      const token = localStorage.getItem('sah_token');

      if (isMemberAccount(cu)) {
        const storedMember = getStoredMemberProfile(cu.id);
        const memberProfile = buildMemberProfile(cu, storedMember || {});
        setProfileData(memberProfile);
        setPhotoPreview(memberProfile.profilePhoto || null);
        saveStoredMemberProfile(memberProfile);
        setDataLoading(false);
        return;
      }

      // 1. Try API
      if (token && cu.id && !String(token).startsWith('local_')) {
        try {
            const storedBeforeApi = getProviderForSession(cu);
            const dbRow  = await apiRequest('GET', `/api/providers/${cu.id}`, null, token);
            const mapped = mapDbProfileToLocal(dbRow);

            // ── FIX: restore locally-saved photo if the API didn't return one ──
            try {
              const localPhoto = localStorage.getItem(`sah_photo_${cu.id}`);
              if (localPhoto && !mapped.profilePhoto) {
                mapped.profilePhoto = localPhoto;
                mapped.photo        = localPhoto;
                mapped.image        = localPhoto;
              }
            } catch {}

            const localMapped = storedBeforeApi ? mapDbProfileToLocal(storedBeforeApi) : null;
            const mergedProfile = shouldUseLocalProfile(localMapped, mapped)
              ? fillMissingProfileFields(localMapped, mapped)
              : fillMissingProfileFields(mapped, localMapped);
            const localOnlyMedia = localMapped ? {
              profilePhoto: mergedProfile.profilePhoto || localMapped.profilePhoto || null,
              photo: mergedProfile.photo || localMapped.photo || null,
              image: mergedProfile.image || localMapped.image || null,
              certFilesAll: mergedProfile.certFilesAll?.length ? mergedProfile.certFilesAll : localMapped.certFilesAll,
              certDocuments: mergedProfile.certDocuments?.length ? mergedProfile.certDocuments : localMapped.certDocuments,
              clearanceFilesAll: mergedProfile.clearanceFilesAll?.length ? mergedProfile.clearanceFilesAll : localMapped.clearanceFilesAll,
              clearanceDocuments: mergedProfile.clearanceDocuments?.length ? mergedProfile.clearanceDocuments : localMapped.clearanceDocuments,
            } : {};
            const finalProfile = {
              ...mergedProfile,
              ...localOnlyMedia,
              id: cu.id,
              userId: cu.id,
              email: mergedProfile.email || cu.email || localMapped?.email || '',
            };

            setProfileData(finalProfile);
            setPhotoPreview(finalProfile.profilePhoto || null);
            saveProviderById(finalProfile);
            setDataLoading(false);
            return;
        } catch (err) {
          console.warn('API load failed, falling back to localStorage:', err.message);
        }
      }

      // 2. Fall back to localStorage
      const stored = getProviderForSession(cu);
      if (stored) {
        const mapped = mapDbProfileToLocal(stored);

        // ── FIX: also restore photo from dedicated key for localStorage path ──
        try {
          const localPhoto = localStorage.getItem(`sah_photo_${cu.id}`);
          if (localPhoto && !mapped.profilePhoto) {
            mapped.profilePhoto = localPhoto;
            mapped.photo        = localPhoto;
            mapped.image        = localPhoto;
          }
        } catch {}

        setProfileData(mapped);
        setPhotoPreview(mapped.profilePhoto || null);
      } else {
        setProfileData(prev => ({
          ...prev,
          id:           cu.id    || prev.id,
          userId:       cu.id    || prev.userId,
          name:         cu.name  || prev.name,
          email:        cu.email || prev.email,
          plan:         cu.plan  || prev.plan,
          contactEmail: cu.email || prev.contactEmail,
        }));
      }
      setDataLoading(false);
    };

    load();
  }, [navigate]);

  /* computed */
  const maxServices = (getPlanLimits && getPlanLimits(profileData.plan)?.maxServices)
    || (profileData.plan === 'featured' ? 3 : profileData.plan === 'pro' ? 3 : 1);
  const svcCount    = profileData.services?.length || 1;
  const isPaidPlan  = profileData.plan === 'pro' || profileData.plan === 'featured';
  const planOrder   = { free: 0, pro: 1, featured: 2 };
  const days        = DAYS_OF_WEEK || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /* ─── edit helpers ─── */
  const startEdit = useCallback((section = 'all') => {
    setSnapshot({ ...profileData });
    setEditSection(section);
    setEditing(true);
  }, [profileData]);

  const cancelEdit = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveSeqRef.current += 1;
    if (snapshot) {
      setProfileData(snapshot);
      if (isMemberAccount(snapshot)) saveStoredMemberProfile(buildMemberProfile(getCurrentUser(), snapshot));
      else saveProviderById(snapshot);
    }
    setEditing(false);
    setEditSection(null);
    setSnapshot(null);
    setQualFileName('');
    setClearanceFileName('');
    setAutosaveStatus('saved');
    showNotification('Changes discarded', 'info');
  }, [snapshot, showNotification]);

  const saveProviderToBackend = useCallback(async (currentData) => {
    const toSave = normalizeProviderForSave({
      ...currentData,
      id: currentData.userId || currentData.id,
      userId: currentData.userId || currentData.id,
      social: currentData.website || currentData.social || '',
      image: currentData.profilePhoto || currentData.photo || currentData.image || null,
      photo: currentData.profilePhoto || currentData.photo || currentData.image || null,
    });

    saveProviderById(toSave);
    const cu = getCurrentUser();
    if (cu) {
      const updatedSession = {
        ...cu,
        id: toSave.userId,
        name: currentData.name,
        plan: currentData.plan,
        email: currentData.email || cu.email,
      };
      localStorage.setItem('sah_current_user', JSON.stringify(updatedSession));
      localStorage.setItem('sah_user', JSON.stringify(updatedSession));
    }

    const token = localStorage.getItem('sah_token');
    if (!token || !toSave.userId || String(token).startsWith('local_')) return toSave;

    const result = await api.updateProvider(toSave.userId, buildProviderSaveFormData(toSave, currentData), token);
    const mapped = mapDbProfileToLocal(result.profile || result) || {};
    const finalProfile = {
      ...mapped,
      ...toSave,
      id: mapped.userId || mapped.id || toSave.userId,
      userId: mapped.userId || toSave.userId,
      email: toSave.email || mapped.email,
      updatedAt: mapped.updatedAt || toSave.updatedAt,
      createdAt: mapped.createdAt || toSave.createdAt,
      certFilesAll: mapped.certFilesAll?.length ? mapped.certFilesAll : currentData.certFilesAll,
      certDocuments: mapped.certDocuments?.length ? mapped.certDocuments : currentData.certDocuments,
      clearanceFilesAll: mapped.clearanceFilesAll?.length ? mapped.clearanceFilesAll : currentData.clearanceFilesAll,
      clearanceDocuments: mapped.clearanceDocuments?.length ? mapped.clearanceDocuments : currentData.clearanceDocuments,
      _newCertFile: null,
      _newClearanceFile: null,
    };
    const savedFinalProfile = normalizeProviderForSave(finalProfile);
    saveProviderById(savedFinalProfile);
    return savedFinalProfile;
  }, []);

  const scheduleAutoSave = useCallback((nextProfile) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    if (isMemberAccount(nextProfile)) {
      saveStoredMemberProfile(buildMemberProfile(getCurrentUser(), nextProfile));
      setAutosaveStatus('saved');
      return;
    }

    saveProviderById(nextProfile);
    const token = localStorage.getItem('sah_token');
    const profileId = nextProfile.userId || nextProfile.id;
    if (!token || !profileId || String(token).startsWith('local_')) {
      setAutosaveStatus('saved');
      return;
    }

    setAutosaveStatus('saving');
    const seq = ++autosaveSeqRef.current;
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await saveProviderToBackend(nextProfile);
        if (seq === autosaveSeqRef.current) setAutosaveStatus('saved');
      } catch (err) {
        console.warn('Autosave saved locally; backend sync will retry on next edit:', err.message);
        if (seq === autosaveSeqRef.current) setAutosaveStatus('local');
      }
    }, 900);
  }, [saveProviderToBackend]);

  useEffect(() => () => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
  }, []);

  const upd = useCallback((patch) => {
    setProfileData(prev => {
      const updated = { ...prev, ...patch };
      if (isMemberAccount(updated)) saveStoredMemberProfile(buildMemberProfile(getCurrentUser(), updated));
      else saveProviderById(updated);
      scheduleAutoSave(updated);
      return updated;
    });
  }, [scheduleAutoSave]);

  /* ─── saveChanges ─── */
  const saveChanges = useCallback(async () => {
    setLoading(true);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveSeqRef.current += 1;
    const currentData = profileData;

    try {
      const savedProfile = await saveProviderToBackend(currentData);
      setProfileData(savedProfile);
      setPhotoPreview(savedProfile.profilePhoto || savedProfile.photo || savedProfile.image || null);

      setSnapshot(null);
      setEditing(false);
      setEditSection(null);
      setQualFileName('');
      setClearanceFileName('');
      setAutosaveStatus('saved');
      showNotification('Changes saved successfully!', 'success');
    } catch (err) {
      console.error('Save error:', err);
      const fallbackData = {
        ...profileData,
        id: profileData.userId || profileData.id,
        userId: profileData.userId || profileData.id,
        social: profileData.website || profileData.social || '',
        image: profileData.profilePhoto || profileData.photo || profileData.image || null,
        photo: profileData.profilePhoto || profileData.photo || profileData.image || null,
      };
      saveProviderById(fallbackData);
      setProfileData(fallbackData);
      setSnapshot(null);
      setEditing(false);
      setEditSection(null);
      setQualFileName('');
      setClearanceFileName('');
      setAutosaveStatus('local');
      showNotification('Changes saved on this device. The server could not be reached right now.', 'info');
    } finally {
      setLoading(false);
    }
  }, [profileData, saveProviderToBackend, showNotification]);

  const saveAndNavigate = useCallback(async (targetPath) => {
    setLoading(true);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveSeqRef.current += 1;

    const localProfile = normalizeProviderForSave({
      ...profileData,
      id: profileData.userId || profileData.id,
      userId: profileData.userId || profileData.id,
      social: profileData.website || profileData.social || '',
      image: profileData.profilePhoto || profileData.photo || profileData.image || null,
      photo: profileData.profilePhoto || profileData.photo || profileData.image || null,
    });
    saveProviderById(localProfile);
    setProfileData(localProfile);
    setPhotoPreview(localProfile.profilePhoto || localProfile.photo || localProfile.image || null);
    setSnapshot(null);
    setEditing(false);
    setEditSection(null);
    setQualFileName('');
    setClearanceFileName('');

    try {
      const savedProfile = await saveProviderToBackend(localProfile);
      setProfileData(savedProfile);
      setPhotoPreview(savedProfile.profilePhoto || savedProfile.photo || savedProfile.image || null);
      setAutosaveStatus('saved');
    } catch (err) {
      console.error('Save before navigation failed:', err);
      setAutosaveStatus('local');
      showNotification('Saved on this device. Backend sync will retry when it is reachable.', 'info');
    } finally {
      setLoading(false);
      navigate(targetPath);
    }
  }, [profileData, saveProviderToBackend, navigate, showNotification]);

  const openPublicView = useCallback(() => {
    const profileId = profileData.userId || profileData.id;
    return saveAndNavigate(profileId ? `/profile?id=${profileId}&from=dashboard` : '/profile?from=dashboard');
  }, [profileData.userId, profileData.id, saveAndNavigate]);

  const saveMemberChanges = useCallback(async () => {
    setLoading(true);
    try {
      const currentData = {
        ...buildMemberProfile(getCurrentUser(), profileData),
        updatedAt: new Date().toISOString(),
      };
      const publicMemberProfile = toPublicMemberProfile(currentData);

      saveStoredMemberProfile(currentData);
      saveProviderById(publicMemberProfile);
      setProfileData(currentData);
      setPhotoPreview(currentData.profilePhoto || null);

      const cu = getCurrentUser();
      if (cu) {
        const updatedSession = {
          ...cu,
          id: currentData.userId || currentData.id,
          name: currentData.name,
          email: currentData.email,
          accountType: currentData.accountType,
          profilePhoto: currentData.profilePhoto,
          phone: currentData.phone,
          city: currentData.city,
          province: currentData.province,
          bio: currentData.bio,
        };
        localStorage.setItem('sah_current_user', JSON.stringify(updatedSession));
        localStorage.setItem('sah_user', JSON.stringify(updatedSession));
      }
      if (currentData.profilePhoto && currentData.userId) {
        localStorage.setItem(`sah_photo_${currentData.userId}`, currentData.profilePhoto);
      }

      setSnapshot(null);
      setEditing(false);
      setEditSection(null);
      showNotification('Member profile saved successfully!', 'success');
    } catch (err) {
      console.error('Member save error:', err);
      showNotification('Could not save member profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [profileData, showNotification]);

  /* ─── photo ─── */
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setPhotoPreview(b64);
      setEditSection('profileInfo');
      setEditing(true);
      setProfileData(prev => {
        const updated = { ...prev, photo: b64, image: b64, profilePhoto: b64 };
        if (isMemberAccount(updated)) saveStoredMemberProfile(buildMemberProfile(getCurrentUser(), updated));
        else saveProviderById(updated);
        // ── FIX: persist photo to a dedicated key so it survives API reloads on refresh ──
        try {
          const cu = getCurrentUser();
          if (cu?.id) localStorage.setItem(`sah_photo_${cu.id}`, b64);
        } catch {}
        scheduleAutoSave(updated);
        return updated;
      });
      showNotification('Photo updated and saved automatically.', 'info');
    };
    reader.readAsDataURL(file);
  };

  /* ─── qualification PDF upload ─── */
  const handleQualFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showNotification('Only PDF files are accepted for qualification documents.', 'error');
      if (qualFileInputRef.current) qualFileInputRef.current.value = '';
      return;
    }
    setQualFileName(file.name);
    setEditSection('qualifications');
    setEditing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      const newEntry = { name: file.name, type: file.type || 'application/pdf', size: file.size, data: b64 };
      upd({
        _newCertFile: file,
        certFileName: file.name,
        certFileType: file.type,
        certFile: b64,
        certFilesAll: [...(profileData.certFilesAll || []), newEntry],
      });
    };
    reader.readAsDataURL(file);
    showNotification('PDF attached. Click Save Changes to upload.', 'info');
  };

  /* ─── clearance PDF upload ─── */
  const handleClearanceFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showNotification('Only PDF files are accepted for police clearance documents.', 'error');
      if (clearanceFileInputRef.current) clearanceFileInputRef.current.value = '';
      return;
    }
    setClearanceFileName(file.name);
    setEditSection('qualifications');
    setEditing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      const newEntry = { name: file.name, type: file.type || 'application/pdf', size: file.size, data: b64 };
      upd({
        _newClearanceFile: file,
        clearanceFileName: file.name,
        clearanceFileType: file.type,
        clearanceFile: b64,
        clearanceFilesAll: [...(profileData.clearanceFilesAll || []), newEntry],
      });
    };
    reader.readAsDataURL(file);
    showNotification('PDF attached. Click Save Changes to upload.', 'info');
  };

  /* ─── service helpers ─── */
  const addService    = () => { if (svcCount < maxServices) upd({ services: [...profileData.services, { title: '', ageGroups: [], deliveryMode: 'Online', description: '', subjects: '' }] }); };
  const updService    = (i, s) => {
    const a = [...profileData.services];
    a[i] = s;
    const patch = { services: a };
    if (i === 0) {
      patch.serviceTitle = s.title || '';
      patch.serviceDesc = s.description || '';
      patch.subjects = s.subjects || '';
      patch.ageGroups = s.ageGroups || [];
      patch.deliveryMode = s.deliveryMode || '';
    }
    upd(patch);
  };
  const removeService = (i)    => { if (profileData.services.length > 1) upd({ services: profileData.services.filter((_, idx) => idx !== i) }); };

  /* ─── day toggle ─── */
  const toggleDay = (d) => upd({
    availabilityDays: profileData.availabilityDays.includes(d)
      ? profileData.availabilityDays.filter(x => x !== d)
      : [...profileData.availabilityDays, d],
  });

  /* ─── plan change ─── */
  const handlePlanChange = async (p) => {
    const names = { free: 'Community Member', pro: 'Parental Plus+', featured: 'Parental Plus+' };

    try {
      if (p === 'free') {
        const token = localStorage.getItem('sah_token');
        if (!token || token.startsWith('local_')) {
          showNotification('Please log in with your backend account before changing paid plans.', 'error');
          return;
        }

        await api.cancelSubscription(token);
        upd({ plan: 'free', listingPlan: 'free', tier: 'free', billingStatus: 'cancelled', requestedPlan: null });
        if (updateUserPlan) updateUserPlan('free');
        showNotification(`Plan changed to ${names[p]}`, 'success');
        return;
      }

      setCheckoutPlan({
        id: p,
        name: names[p] || p,
        amount: 149,
        period: 'month',
      });
      setCheckoutMethod('card');
      setCheckoutError('');
      setCheckoutState('idle');
      setActivePayment(null);
      setCopiedPaymentField('');
      setCardForm({
        cardName: profileData.name || profileData.fullName || '',
        cardNumber: '',
        expiry: '',
        cvv: '',
        email: profileData.contactEmail || profileData.email || '',
        phone: profileData.phone || '',
      });
      setEftForm({
        fullName: profileData.name || profileData.fullName || '',
        email: profileData.contactEmail || profileData.email || '',
        phone: profileData.phone || '',
      });
    } catch (error) {
      showNotification(error.message || 'Could not start payment checkout.', 'error');
    }
  };

  const syncPaidPlanInUi = useCallback((payment) => {
    upd({ plan: 'pro', listingPlan: 'pro', tier: 'pro', requestedPlan: null, billingStatus: 'active' });
    if (updateUserPlan) updateUserPlan('pro');
    setActivePayment(payment || null);
    setPaymentHistory(prev => {
      if (!payment?.reference) return prev;
      const withoutExisting = prev.filter(item => item.reference !== payment.reference);
      return [payment, ...withoutExisting].slice(0, 25);
    });
  }, [upd, updateUserPlan]);

  const closePaymentModal = useCallback(() => {
    const activeStates = ['initializing', 'processing', 'authorizing', 'verifying', 'checking'];
    if (activeStates.includes(checkoutState)) {
      const ok = window.confirm('A payment is currently in progress. Closing now will not cancel the Paystack transaction. Do you still want to close this modal?');
      if (!ok) return;
    }
    setCheckoutPlan(null);
    setCheckoutError('');
    setCheckoutLoading(false);
  }, [checkoutState]);

  const verifyActivePayment = async (reference = activePayment?.reference) => {
    if (!reference) return;
    setCheckoutLoading(true);
    setCheckoutState('verifying');
    setCheckoutError('');

    try {
      const token = localStorage.getItem('sah_token');
      if (!token || token.startsWith('local_')) throw new Error('Please log in with your backend account before verifying payment.');
      const result = await api.verifyPayment(reference, token);
      const payment = result.payment || activePayment;
      syncPaidPlanInUi(payment);
      setCheckoutState('success');
      showNotification('Payment verified. Parental Plus+ is active.', 'success');
    } catch (error) {
      const payment = error.data?.payment;
      if (payment) setActivePayment(payment);
      const status = payment?.status;
      if (status === 'PENDING') setCheckoutState('pending');
      else if (status === 'EXPIRED') setCheckoutState('expired');
      else if (status === 'CANCELLED') setCheckoutState('cancelled');
      else setCheckoutState('failed');
      setCheckoutError(friendlyPaymentError(error));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const startCheckoutPayment = async () => {
    if (!checkoutPlan) return;
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutState('initializing');

    try {
      const token = localStorage.getItem('sah_token');
      if (!token || token.startsWith('local_')) {
        throw new Error('Your current session is offline/local only. Please log out, make sure the backend is running, then log in again with your registered email and password before paying.');
      }

      if (checkoutMethod === 'card') {
        const errors = validateCardForm(cardForm);
        if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      }
      if (checkoutMethod === 'eft') {
        const errors = validateEftForm(eftForm);
        if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      }

      const payment = await api.initializePayment({
        plan: checkoutPlan.id,
        method: checkoutMethod,
        returnUrl: `${window.location.origin}/payment/callback`,
      }, token);
      const safePayment = payment.payment || payment;
      setActivePayment(safePayment);

      upd({ requestedPlan: checkoutPlan.id, billingStatus: 'pending' });

      if (checkoutMethod === 'bank') {
        setCheckoutState('pending');
        showNotification('Bank transfer details generated.', 'info');
        return;
      }

      if (checkoutMethod === 'eft') {
        setCheckoutState('authorizing');
        showNotification('Redirecting to secure EFT payment...', 'info');
        window.location.href = payment.authorizationUrl;
        return;
      }

      setCheckoutState('processing');
      if (payment.mode === 'mock' || payment.demo) {
        await verifyActivePayment(safePayment.reference || payment.reference);
        return;
      }

      showNotification('Opening secure Paystack checkout...', 'info');
      window.location.href = payment.authorizationUrl;
    } catch (error) {
      setCheckoutError(friendlyPaymentError(error));
      setCheckoutState(error.status === 0 ? 'network_error' : 'failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!activePayment?.reference || checkoutLoading) return;
    setCheckoutLoading(true);
    setCheckoutState('checking');
    setCheckoutError('');
    try {
      const token = localStorage.getItem('sah_token');
      const result = await api.getPaymentStatus(activePayment.reference, token);
      const payment = result.payment;
      setActivePayment(payment);
      if (payment.status === 'PAID' || payment.status === 'SUCCESS') {
        syncPaidPlanInUi(payment);
        setCheckoutState('success');
      } else if (payment.status === 'FAILED') setCheckoutState('failed');
      else if (payment.status === 'EXPIRED') setCheckoutState('expired');
      else if (payment.status === 'CANCELLED') setCheckoutState('cancelled');
      else setCheckoutState('pending');
    } catch (error) {
      setCheckoutState('network_error');
      setCheckoutError(friendlyPaymentError(error));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const simulateMockOutcome = async (status) => {
    if (!activePayment?.reference) return;
    const token = localStorage.getItem('sah_token');
    await api.setMockPaymentOutcome(activePayment.reference, status, token);
    await verifyActivePayment(activePayment.reference);
  };

  useEffect(() => {
    if (!activePayment?.expiresAt) {
      setBankCountdown('');
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = new Date(activePayment.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setBankCountdown('Expired');
        setCheckoutState(prev => (prev === 'pending' ? 'expired' : prev));
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setBankCountdown(`${minutes}:${String(seconds).padStart(2, '0')}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activePayment?.expiresAt]);

  const copyPaymentText = async (label, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedPaymentField(label);
      setTimeout(() => setCopiedPaymentField(''), 1500);
    } catch {
      showNotification('Could not copy. Please copy it manually.', 'error');
    }
  };

  /* ─── file download ─── */
  const downloadFile = (dataUrl, fileName) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* ─── misc ─── */
  const getPlanName = () => {
    if ((profileData.billingStatus === 'pending' || profileData.billingStatus === 'payment_required') && profileData.requestedPlan === 'pro') {
      return 'Parental Plus+ (payment pending)';
    }
    return ({ free: 'Community Member (Free)', pro: 'Parental Plus+ (R149/mo)', featured: 'Parental Plus+' }[profileData.plan] || 'Community Member');
  };
  const statusInfo  = { approved: { cls: 'approved', icon: 'fa-check-circle', label: 'Approved — Live' }, rejected: { cls: 'rejected', icon: 'fa-times-circle', label: 'Rejected' }, pending: { cls: 'pending', icon: 'fa-clock', label: 'Pending Approval' } }[profileData.status] || { cls: 'pending', icon: 'fa-clock', label: 'Pending Approval' };

  /* completeness */
  const compItems = [
    { label: 'Name & Bio',      done: !!(profileData.name && profileData.bio) },
    { label: 'Photo',           done: !!(profileData.image || profileData.photo || profileData.profilePhoto) },
    { label: 'Services',        done: (profileData.services || []).some(s => s.title) || !!profileData.serviceTitle },
    { label: 'Location',        done: !!(profileData.city && profileData.province) },
    { label: 'Contact Details', done: !!(profileData.phone && profileData.contactEmail) },
    { label: 'Qualifications',  done: !!(profileData.degrees || profileData.certifications) },
    { label: 'Availability',    done: (profileData.availabilityDays || []).length > 0 },
  ];
  const compPct = Math.round(compItems.filter(x => x.done).length / compItems.length * 100);

  const isEditingSection = useCallback((section) => editing && editSection === section, [editing, editSection]);

  const autosaveLabel = autosaveStatus === 'saving'
    ? 'saving automatically...'
    : autosaveStatus === 'local'
      ? 'saved on this device'
      : 'saved automatically';

  const renderSaveBar = (section = 'all') => (editing && editSection === section) ? (
    <div className="cd-footer-bar">
      <span className="cd-last-edit"><i className="far fa-clock"></i> {autosaveLabel}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
          <i className="fas fa-floppy-disk"></i> {loading ? 'Saving…' : 'Save Changes'}
        </button>
        <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
      </div>
    </div>
  ) : null;

  /* ── renderDocCard: single document card with download button ── */
  const renderHeaderEditControls = (section = 'all', label = 'Edit') => (
    editing && editSection === section ? (
      <div className="cd-card-actions">
        <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
          <i className="fas fa-floppy-disk"></i> {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
      </div>
    ) : !editing ? (
      <button className="cd-edit-toggle inactive" onClick={() => startEdit(section)}>
        <i className="fas fa-edit"></i> {label}
      </button>
    ) : null
  );

  const renderDocCard = (fileData, fileName, fileType, fallbackLabel) => {
    const displayName = fileName || fallbackLabel;
    const isPdf = (fileType || '').includes('pdf') || (displayName || '').toLowerCase().endsWith('.pdf');

    if (fileData) {
      return (
        <div className="cd-doc-card">
          <div className="cd-doc-icon">
            <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-file-alt'}`}></i>
          </div>
          <div className="cd-doc-info">
            <div className="cd-doc-name">{displayName}</div>
            <div className="cd-doc-sub">{isPdf ? 'PDF document · click to download' : 'Document'}</div>
          </div>
          <button className="cd-doc-dl" onClick={() => downloadFile(fileData, displayName)}>
            <i className="fas fa-download"></i> Download
          </button>
        </div>
      );
    }

    // Name only — no downloadable data
    if (displayName && displayName !== fallbackLabel) {
      return (
        <div className="cd-doc-card">
          <div className="cd-doc-icon"><i className="fas fa-file-pdf"></i></div>
          <div className="cd-doc-info">
            <div className="cd-doc-name">{displayName}</div>
            <div className="cd-doc-sub">Stored on server — contact admin to retrieve</div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#888', flexShrink: 0, padding: '5px 8px', background: '#f0ece5', borderRadius: 5 }}>
            <i className="fas fa-cloud"></i> Server
          </span>
        </div>
      );
    }

    return null;
  };

  /* ── renderAllDocCards: render from certFilesAll / clearanceFilesAll arrays ── */
  const renderAllDocCards = (filesAll, docNames, sectionLabel) => {
    const cards = [];

    // Primary: full objects with base64 data (set during registration)
    if (filesAll && filesAll.length > 0) {
      filesAll.forEach((f, i) => {
        const card = renderDocCard(f.data || null, f.name, f.type, sectionLabel);
        if (card) cards.push(<div key={`${sectionLabel}-${i}`}>{card}</div>);
      });
    } else if (docNames && docNames.length > 0) {
      // Fallback: filename strings only (no base64)
      docNames.forEach((name, i) => {
        const card = renderDocCard(null, name, 'application/pdf', sectionLabel);
        if (card) cards.push(<div key={`${sectionLabel}-name-${i}`}>{card}</div>);
      });
    }

    return cards;
  };

  const renderSidebar = () => (
    <div>
      <div className="cd-sidebar-card">
        <div className="cd-sidebar-header">
          <div className="cd-sidebar-title"><i className="fas fa-tasks" style={{ marginRight: 6 }}></i>Profile Completeness</div>
        </div>
        <div className="cd-sidebar-body">
          {compItems.map(({ label, done }) => (
            <div key={label} className="cd-comp-item">
              <i className={`fas ${done ? 'fa-check-circle' : 'fa-circle'}`} style={{ color: done ? '#10b981' : '#d1d5db', fontSize: '0.82rem', width: 14 }}></i>
              <span style={{ fontSize: '0.8rem', color: done ? '#1a1a1a' : '#999', fontWeight: done ? 600 : 400 }}>{label}</span>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.69rem', color: '#888', fontWeight: 700 }}>COMPLETE</span>
              <span style={{ fontSize: '0.69rem', color: '#6f8da6', fontWeight: 800 }}>{compPct}%</span>
            </div>
            <div style={{ height: 5, background: '#f0ece5', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${compPct}%`, background: '#ff8c42', borderRadius: 3, transition: 'width .5s' }} />
            </div>
          </div>
        </div>
      </div>
      {profileData.status === 'pending' && (
        <div className="cd-sidebar-card">
          <div className="cd-sidebar-header">
            <div className="cd-sidebar-title"><i className="fas fa-clock" style={{ marginRight: 6 }}></i>Pending Review</div>
          </div>
          <div className="cd-sidebar-body">
            <p style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.65 }}>
              Your profile is awaiting admin verification. Once approved it will appear live in the directory — typically 1–2 business days.
            </p>
          </div>
        </div>
      )}
      <div
        className="cd-sidebar-card cd-terms-card"
        onClick={() => setTermsCardOpen(open => !open)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setTermsCardOpen(open => !open);
          }
        }}
      >
        <div className="cd-sidebar-header">
          <div className="cd-sidebar-title"><i className="fas fa-file-contract" style={{ marginRight: 6 }}></i>Terms & Conditions</div>
          <i className={`fas fa-chevron-down cd-terms-toggle${termsCardOpen ? ' open' : ''}`}></i>
        </div>
        {termsCardOpen ? (
          <div className="cd-sidebar-body">
            <p className="cd-terms-summary">
              Provider listings must be accurate, genuine, respectful and verifiable. Paid plans are billed monthly according to the selected plan.
            </p>
            <button
              type="button"
              className="cd-sidebar-link-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowTermsModal(true);
              }}
            >
              Read More <i className="fas fa-chevron-right"></i>
            </button>
            {(profileData.plan || 'free') !== 'free' && (
              <button
                type="button"
                className="cd-sidebar-downgrade"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanChange('free');
                }}
              >
                <i className="fas fa-arrow-down"></i> Downgrade Plan
              </button>
            )}
          </div>
        ) : (
          <div className="cd-terms-closed-note">
            Click to view terms and plan options.
          </div>
        )}
      </div>
      {(profileData.languages || []).length > 0 && (
        <div className="cd-sidebar-card">
          <div className="cd-sidebar-header">
            <div className="cd-sidebar-title"><i className="fas fa-language" style={{ marginRight: 6 }}></i>Languages</div>
          </div>
          <div className="cd-sidebar-body">
            <div className="cd-tags">
              {(profileData.languages || []).map((l, i) => <span key={i} className="cd-tag">{l}</span>)}
            </div>
          </div>
        </div>
      )}
      {/* ── Sidebar: quick document access ── */}
      {(() => {
        const hasCert  = (profileData.certFilesAll?.length > 0) || (profileData.certDocuments?.length > 0) || !!profileData.certFile;
        const hasClear = (profileData.clearanceFilesAll?.length > 0) || (profileData.clearanceDocuments?.length > 0) || !!profileData.clearanceFile;
        if (!hasCert && !hasClear) return null;
        return (
          <div className="cd-sidebar-card">
            <div className="cd-sidebar-header">
              <div className="cd-sidebar-title"><i className="fas fa-file-pdf" style={{ marginRight: 6 }}></i>My Documents</div>
            </div>
            <div className="cd-sidebar-body">
              <p style={{ fontSize: '0.74rem', color: '#888', marginBottom: 10 }}>
                Documents you uploaded during registration. Go to <strong>Profile → Qualifications</strong> to view and download.
              </p>
              <button
                style={{ width: '100%', padding: '8px 12px', background: '#6f8da6', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-folder-open"></i> View Documents
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );

  /* ══ TAB: PROFILE ══ */
  const renderTabProfile = () => (
    <div className="cd-layout">
      <div>
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-id-card"></i></div>
            <div><div className="cd-card-title">Account Information</div><div className="cd-card-subtitle">Your public-facing identity</div></div>
            {isEditingSection('profileInfo') && (
              <div className="cd-card-actions">
                <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                  <i className="fas fa-floppy-disk"></i> {loading ? 'Saving...' : 'Save'}
                </button>
                <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
              </div>
            )}
            {!editing && <button className="cd-edit-toggle inactive" onClick={() => startEdit('profileInfo')}>
              <i className="fas fa-edit"></i>
              {editing ? 'Editing…' : 'Edit Profile'}
            </button>}
          </div>
          <div className="cd-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f0ece5' }}>
              <div className="cd-photo-wrap">
                {photoPreview
                  ? <img src={photoPreview} alt="Profile" className="cd-photo-img" />
                  : <div className="cd-photo-placeholder"><i className="fas fa-user"></i></div>}
                <div className="cd-photo-btn" onClick={() => photoInputRef.current?.click()}>
                  <i className="fas fa-camera"></i>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="cd-photo-input" onChange={handlePhotoChange} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>{profileData.name || 'Your Name'}</div>
                <div style={{ fontSize: '0.76rem', color: '#888', margin: '2px 0 6px' }}>{profileData.email}</div>
                <button onClick={() => photoInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#6f8da6', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  <i className="fas fa-camera"></i> Change photo / logo
                </button>
              </div>
            </div>
            <div className="cd-row">
              <div className="cd-field">
                <label className="cd-label">Full Name / Business <span className="req">*</span></label>
                {isEditingSection('profileInfo')
                  ? <input className="cd-input" type="text" value={profileData.name || ''} onChange={e => upd({ name: e.target.value })} placeholder="Name or business name" />
                  : <div className={`cd-value ${!profileData.name ? 'empty' : ''}`}>{profileData.name || '—'}</div>}
              </div>
              <div className="cd-field">
                <label className="cd-label">Email Address <span className="req">*</span></label>
                {isEditingSection('profileInfo')
                  ? <input className="cd-input" type="email" value={profileData.email || ''} onChange={e => upd({ email: e.target.value })} />
                  : <div className={`cd-value ${!profileData.email ? 'empty' : ''}`}>{profileData.email || '—'}</div>}
              </div>
              <div className="cd-field">
                <label className="cd-label">Account Type</label>
                {isEditingSection('profileInfo')
                  ? <select className="cd-input cd-select" value={profileData.accountType || 'Individual Provider'} onChange={e => upd({ accountType: e.target.value })}>
                      <option>Individual Provider</option>
                      <option>Organisation / Company</option>
                    </select>
                  : <div className={`cd-value ${!profileData.accountType ? 'empty' : ''}`}>{profileData.accountType || '—'}</div>}
              </div>
              <div className="cd-field">
                <label className="cd-label">Years of Experience</label>
                {isEditingSection('profileInfo')
                  ? <input className="cd-input" type="number" value={profileData.yearsExperience || ''} min={0} max={60} onChange={e => upd({ yearsExperience: e.target.value })} />
                  : <div className={`cd-value ${!profileData.yearsExperience ? 'empty' : ''}`}>{profileData.yearsExperience || '—'}</div>}
              </div>
            </div>
            <div className="cd-field" style={{ marginTop: 4 }}>
              <label className="cd-label">Short Bio <span className="req">*</span></label>
              {isEditingSection('profileInfo')
                ? <textarea className="cd-input cd-textarea" value={profileData.bio || ''} onChange={e => upd({ bio: e.target.value })} placeholder="Tell families about your experience and approach…" />
                : <div className={`cd-value ${!profileData.bio ? 'empty' : ''}`} style={{ display: 'block', lineHeight: 1.6, padding: '7px 0' }}>{profileData.bio || 'No bio added yet.'}</div>}
            </div>
            <div className="cd-field">
              <label className="cd-label">Primary Category</label>
              {isEditingSection('profileInfo')
                ? <select className="cd-input cd-select" value={profileData.primaryCategory || ''} onChange={e => upd({ primaryCategory: e.target.value })}>
                    <option value="">-- Select --</option>
                    {['Tutor', 'Therapist', 'Curriculum Provider', 'Online / Hybrid School', 'Educational Consultant', 'Extracurricular / Enrichment'].map(o => <option key={o}>{o}</option>)}
                  </select>
                : <div className={`cd-value ${!profileData.primaryCategory ? 'empty' : ''}`}>{profileData.primaryCategory || '—'}</div>}
            </div>
            {(profileData.secondaryCategories || []).length > 0 && (
              <div className="cd-field">
                <label className="cd-label">Secondary Categories</label>
                <div className="cd-tags">
                  {(profileData.secondaryCategories || []).map((c, i) => <span key={i} className="cd-tag">{c}</span>)}
                </div>
              </div>
            )}
            <div className="cd-field">
              <label className="cd-label">Tags / Subjects</label>
              {isEditingSection('profileInfo')
                ? <TagsInput
                    tags={profileData.tags || []}
                    isEditing
                    onAddTag={t => { if (t && !(profileData.tags || []).includes(t)) upd({ tags: [...(profileData.tags || []), t] }); }}
                    onRemoveTag={i => upd({ tags: (profileData.tags || []).filter((_, idx) => idx !== i) })}
                  />
                : <div className="cd-tags">
                    {(profileData.tags || []).length > 0
                      ? (profileData.tags || []).map((t, i) => <span key={i} className="cd-tag">{t}</span>)
                      : <span className="cd-value empty" style={{ padding: 0 }}>No tags yet</span>}
                  </div>}
            </div>
            <div className="cd-field">
              <label className="cd-label">Languages Spoken</label>
              {isEditingSection('profileInfo') ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {['English','Afrikaans','isiZulu','isiXhosa','Sepedi','Setswana','Sesotho','Xitsonga','SiSwati','Tshivenda','isiNdebele','Other'].map(lang => (
                    <label key={lang} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'0.8rem', cursor:'pointer', padding:'5px 11px', border:'1.5px solid', borderColor:(profileData.languages||[]).includes(lang)?'#6f8da6':'#e5e0d8', borderRadius:6, background:(profileData.languages||[]).includes(lang)?'rgba(85,118,145,0.08)':'#faf9f7', color:(profileData.languages||[]).includes(lang)?'#6f8da6':'#555', fontWeight:600 }}>
                      <input type="checkbox" style={{ accentColor:'#6f8da6' }}
                        checked={(profileData.languages||[]).includes(lang)}
                        onChange={e => {
                          const cur = profileData.languages || [];
                          upd({ languages: e.target.checked ? [...cur, lang] : cur.filter(l => l !== lang) });
                        }} />
                      {lang}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="cd-tags">
                  {(profileData.languages||[]).length > 0
                    ? (profileData.languages||[]).map((l,i) => <span key={i} className="cd-tag">{l}</span>)
                    : <span className="cd-value empty" style={{ padding:0 }}>—</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Qualifications card */}
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-graduation-cap"></i></div>
            <div><div className="cd-card-title">Qualifications & Experience</div><div className="cd-card-subtitle">Credentials that build trust</div></div>
            {isEditingSection('qualifications') && (
              <div className="cd-card-actions">
                <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                  <i className="fas fa-floppy-disk"></i> {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
              </div>
            )}
            <button className="cd-edit-toggle inactive" style={{ display: editing ? 'none' : undefined }} onClick={() => startEdit('qualifications')}>
              <i className={`fas ${editing ? 'fa-pencil-alt' : 'fa-edit'}`}></i>
              {editing ? 'Editing…' : 'Edit'}
            </button>
          </div>
          <div className="cd-card-body">
            <div className="cd-row">
              <div className="cd-field">
                <label className="cd-label">Degrees / Diplomas</label>
                {isEditingSection('qualifications')
                  ? <input className="cd-input" type="text" value={profileData.degrees || ''} onChange={e => upd({ degrees: e.target.value })} placeholder="e.g. BEd Honours, Mathematics" />
                  : <div className={`cd-value ${!profileData.degrees ? 'empty' : ''}`}>{profileData.degrees || '—'}</div>}
              </div>
              <div className="cd-field">
                <label className="cd-label">Certifications</label>
                {isEditingSection('qualifications')
                  ? <input className="cd-input" type="text" value={profileData.certifications || ''} onChange={e => upd({ certifications: e.target.value })} placeholder="e.g. SACE Registered" />
                  : <div className={`cd-value ${!profileData.certifications ? 'empty' : ''}`}>{profileData.certifications || '—'}</div>}
              </div>
              <div className="cd-field">
                <label className="cd-label">Professional Memberships</label>
                {isEditingSection('qualifications')
                  ? <input className="cd-input" type="text" value={profileData.memberships || ''} onChange={e => upd({ memberships: e.target.value })} placeholder="e.g. SA Curriculum Association" />
                  : <div className={`cd-value ${!profileData.memberships ? 'empty' : ''}`}>{profileData.memberships || '—'}</div>}
              </div>
              <div className="cd-field">
                <label className="cd-label">Background Clearance</label>
                {isEditingSection('qualifications')
                  ? <input className="cd-input" type="text" value={profileData.clearance || ''} onChange={e => upd({ clearance: e.target.value })} placeholder="e.g. Verified 2024 — Cert No. 12345" />
                  : profileData.clearance
                    ? <span className="cd-clearance"><i className="fas fa-shield-alt"></i>{profileData.clearance}</span>
                    : <div className="cd-value empty">Not provided</div>}
              </div>
            </div>

            {/* ── PDF uploads (edit mode) ── */}
            {isEditingSection('qualifications') && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0ece5' }}>
                <div className="cd-sec-label"><i className="fas fa-file-pdf"></i> Upload Supporting Documents (PDF only)</div>
                <div className="cd-info-note" style={{ marginBottom: 14 }}>
                  <i className="fas fa-info-circle"></i>
                  <span>Upload PDF documents only. These will be reviewed by the admin as-is and will not affect your text fields above.</span>
                </div>
                <div className="cd-field">
                  <label className="cd-label"><i className="fas fa-certificate" style={{ marginRight: 5, color: '#6f8da6' }}></i>Qualification / Certificate PDF</label>
                  <input
                    ref={qualFileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="cd-input"
                    style={{ padding: '7px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                    onChange={handleQualFileChange}
                  />
                  {qualFileName && (
                    <div className="cd-qual-notice">
                      <i className="fas fa-file-pdf"></i>
                      <span><strong>{qualFileName}</strong> — will be submitted to admin on Save.</span>
                    </div>
                  )}
                </div>
                <div className="cd-field" style={{ marginTop: 10 }}>
                  <label className="cd-label"><i className="fas fa-shield-alt" style={{ marginRight: 5, color: '#6f8da6' }}></i>Police Clearance PDF</label>
                  <input
                    ref={clearanceFileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="cd-input"
                    style={{ padding: '7px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                    onChange={handleClearanceFileChange}
                  />
                  {clearanceFileName && (
                    <div className="cd-qual-notice">
                      <i className="fas fa-file-pdf"></i>
                      <span><strong>{clearanceFileName}</strong> — will be submitted to admin on Save.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Previously uploaded documents — always visible ── */}
            {(() => {
              const certCards    = renderAllDocCards(profileData.certFilesAll, profileData.certDocuments, 'Qualification / Certificate');
              const clearCards   = renderAllDocCards(profileData.clearanceFilesAll, profileData.clearanceDocuments, 'Police Clearance');
              const hasCertDocs  = certCards.length > 0;
              const hasClearDocs = clearCards.length > 0;

              if (!hasCertDocs && !hasClearDocs) return null;

              return (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0ece5' }}>
                  <div className="cd-sec-label">
                    <i className="fas fa-paperclip"></i> Uploaded Documents
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#aaa', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      {(certCards.length + clearCards.length)} file{(certCards.length + clearCards.length) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {hasCertDocs && (
                    <div style={{ marginBottom: hasClearDocs ? 14 : 0 }}>
                      <div className="cd-docs-section-title">
                        <i className="fas fa-certificate" style={{ color: '#6f8da6' }}></i>
                        Qualification / Certificate PDFs
                      </div>
                      {certCards}
                    </div>
                  )}

                  {hasClearDocs && (
                    <div>
                      <div className="cd-docs-section-title">
                        <i className="fas fa-shield-alt" style={{ color: '#059669' }}></i>
                        Police Clearance PDFs
                      </div>
                      {clearCards}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  /* ══ TAB: SERVICES ══ */
  const renderTabServices = () => (
    <div className="cd-layout">
      <div>
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-briefcase"></i></div>
            <div><div className="cd-card-title">Service Details</div><div className="cd-card-subtitle">What you offer to homeschooling families</div></div>
            {isEditingSection('services') && (
              <div className="cd-card-actions">
                <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                  <i className="fas fa-floppy-disk"></i> {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
              </div>
            )}
            <button className={`cd-edit-toggle ${isEditingSection('services') ? 'active' : 'inactive'}`} style={{ display: isEditingSection('services') ? 'none' : undefined }} onClick={isEditingSection('services') ? cancelEdit : () => startEdit('services')}>
              <i className={`fas ${isEditingSection('services') ? 'fa-pencil-alt' : 'fa-edit'}`}></i> {isEditingSection('services') ? 'Editing...' : 'Edit'}
            </button>
          </div>
          <div className="cd-card-body">
            <div className="cd-info-note">
              <i className="fas fa-info-circle"></i>
              {profileData.plan === 'featured' ? 'Parental Plus+: up to 3 services.'
                : profileData.plan === 'pro' ? 'Parental Plus+: up to 3 services.'
                : 'Free plan: 1 service. Upgrade to add more.'}
            </div>
            {(profileData.services || []).map((svc, idx) => (
              <div key={idx} className={`cd-svc-card ${isEditingSection('services') ? 'editing' : ''}`}>
                {isEditingSection('services') ? (
                  <div>
                    <div className="cd-svc-grid">
                      <div className="cd-field">
                        <label className="cd-label">Service Title <span className="req">*</span></label>
                        <input className="cd-input" type="text" value={svc.title || ''} placeholder="e.g. Maths Tutor Gr 10–12"
                          onChange={e => updService(idx, { ...svc, title: e.target.value })} />
                      </div>
                      <div className="cd-field">
                        <label className="cd-label">Age Group Served</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                          {['5–7', '8–10', '11–13', '14–18'].map(ag => (
                            <label key={ag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.79rem', cursor: 'pointer', userSelect: 'none' }}>
                              <input type="checkbox" style={{ accentColor: '#6f8da6' }}
                                checked={(svc.ageGroups || []).includes(ag)}
                                onChange={e => updService(idx, { ...svc, ageGroups: e.target.checked ? [...(svc.ageGroups || []), ag] : (svc.ageGroups || []).filter(a => a !== ag) })} />
                              {ag}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="cd-field">
                        <label className="cd-label">Mode of Delivery</label>
                        <select className="cd-input cd-select" value={svc.deliveryMode || 'Online'}
                          onChange={e => updService(idx, { ...svc, deliveryMode: e.target.value })}>
                          <option>Online</option>
                          <option>In-person</option>
                          <option>Hybrid (Online &amp; In-person)</option>
                        </select>
                      </div>
                    </div>
                    <div className="cd-row" style={{ marginTop: 10 }}>
                      <div className="cd-field" style={{ marginBottom: 0 }}>
                        <label className="cd-label">Subjects / Specialisations</label>
                        <input className="cd-input" type="text" value={svc.subjects || ''} placeholder="e.g. Mathematics, Dance"
                          onChange={e => updService(idx, { ...svc, subjects: e.target.value })} />
                      </div>
                      <div className="cd-field" style={{ marginBottom: 0 }}>
                        <label className="cd-label">Service Description</label>
                        <textarea className="cd-input cd-textarea" style={{ minHeight: 55 }} value={svc.description || ''} placeholder="Brief description…"
                          onChange={e => updService(idx, { ...svc, description: e.target.value })} />
                      </div>
                    </div>
                    {isPaidPlan && (profileData.services || []).length > 1 && (
                      <button onClick={() => removeService(idx)} style={{ marginTop: 10, background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 6, padding: '5px 12px', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <i className="fas fa-times" style={{ marginRight: 4 }}></i>Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="cd-svc-grid">
                    <div className="cd-field">
                      <label className="cd-label">Service Title</label>
                      <div className="cd-value" style={{ fontWeight: 600, display: 'block', padding: '5px 0' }}>
                        {svc.title || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Untitled</span>}
                        {svc.description && <div style={{ fontSize: '0.76rem', color: '#666', marginTop: 3, fontWeight: 400 }}>{svc.description}</div>}
                      </div>
                    </div>
                    <div className="cd-field">
                      <label className="cd-label">Age Group</label>
                      <div className="cd-value" style={{ flexWrap: 'wrap', gap: 5, padding: '5px 0' }}>
                        {(svc.ageGroups || []).length > 0
                          ? (svc.ageGroups).map(a => <span key={a} className="cd-tag" style={{ fontSize: '0.72rem', padding: '2px 9px' }}>{a}</span>)
                          : <span style={{ color: '#bbb', fontStyle: 'italic' }}>—</span>}
                      </div>
                    </div>
                    <div className="cd-field">
                      <label className="cd-label">Delivery Mode</label>
                      <div className={`cd-value ${!svc.deliveryMode ? 'empty' : ''}`} style={{ padding: '5px 0' }}>{svc.deliveryMode || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isEditingSection('services') && isPaidPlan && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <button onClick={addService} disabled={svcCount >= maxServices}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 7, border: '1.5px dashed #6f8da6', background: '#edf7ff', color: '#6f8da6', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit', cursor: svcCount >= maxServices ? 'not-allowed' : 'pointer', opacity: svcCount >= maxServices ? 0.5 : 1 }}>
                  <i className="fas fa-plus-circle"></i> Add Service
                </button>
                <span style={{ fontSize: '0.74rem', color: '#888' }}>{svcCount}/{maxServices} used</span>
              </div>
            )}
            {isEditingSection('services') && !isPaidPlan && (
              <div className="cd-info-note last" style={{ marginTop: 8 }}>
                <i className="fas fa-lock"></i>
                <span>Want more services?{' '}
                  <span style={{ fontWeight: 700, color: '#6f8da6', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActiveTab('plan')}>
                    Upgrade your plan →
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  /* ══ TAB: LOCATION & PRICING ══ */
  const renderTabLocation = () => (
    <div className="cd-layout">
      <div>
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-map-marker-alt"></i></div>
            <div><div className="cd-card-title">Location & Reach</div><div className="cd-card-subtitle">Where you serve families</div></div>
            {isEditingSection('location') && (
              <div className="cd-card-actions">
                <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                  <i className="fas fa-floppy-disk"></i> {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
              </div>
            )}
            <button className={`cd-edit-toggle ${isEditingSection('location') ? 'active' : 'inactive'}`} style={{ display: isEditingSection('location') ? 'none' : undefined }} onClick={isEditingSection('location') ? cancelEdit : () => startEdit('location')}>
              <i className={`fas ${isEditingSection('location') ? 'fa-pencil-alt' : 'fa-edit'}`}></i> {isEditingSection('location') ? 'Editing...' : 'Edit'}
            </button>
          </div>
          <div className="cd-card-body">
            <div className="cd-row">
              <div className="cd-field">
                <label className="cd-label">Province <span className="req">*</span></label>
                {isEditingSection('location')
                  ? <select className="cd-input cd-select" value={profileData.province || ''} onChange={e => upd({ province: e.target.value })}>
                      <option value="">-- Select --</option>
                      {(PROVINCES || ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape']).map(p => <option key={p}>{p}</option>)}
                    </select>
                  : <div className={`cd-value ${!profileData.province ? 'empty' : ''}`}>{profileData.province || '—'}</div>}
              </div>
              <div className="cd-field">
                <label className="cd-label">City / Town</label>
                {isEditingSection('location')
                  ? <input className="cd-input" type="text" value={profileData.city || ''} onChange={e => upd({ city: e.target.value })} />
                  : <div className={`cd-value ${!profileData.city ? 'empty' : ''}`}>{profileData.city || '—'}</div>}
              </div>
            </div>
            <div className="cd-field">
              <label className="cd-label">Service Area <span className="req">*</span></label>
              {isEditingSection('location')
                ? <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="cd-input cd-select" value={profileData.serviceAreaType || 'national'} style={{ width: 'auto' }} onChange={e => upd({ serviceAreaType: e.target.value })}>
                      <option value="local">Local (radius)</option>
                      <option value="national">National</option>
                      <option value="online">Online only</option>
                    </select>
                    {profileData.serviceAreaType === 'local' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input className="cd-input" type="number" value={profileData.radius || ''} style={{ width: 80 }} min="1" max="200" onChange={e => upd({ radius: e.target.value })} />
                        <span style={{ fontSize: '0.82rem', color: '#888' }}>km</span>
                      </div>
                    )}
                  </div>
                : <div className="cd-value">
                    {profileData.serviceAreaType === 'local' ? `Local — ${profileData.radius || '?'} km radius`
                      : profileData.serviceAreaType === 'online' ? 'Online only' : 'National'}
                  </div>}
            </div>
          </div>
        </div>

        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-tag"></i></div>
            <div><div className="cd-card-title">Pricing & Availability</div><div className="cd-card-subtitle">Your rates and schedule</div></div>
            {isEditingSection('pricing') && (
              <div className="cd-card-actions">
                <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                  <i className="fas fa-floppy-disk"></i> {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
              </div>
            )}
            <button className={`cd-edit-toggle ${isEditingSection('pricing') ? 'active' : 'inactive'}`} style={{ display: isEditingSection('pricing') ? 'none' : undefined }} onClick={isEditingSection('pricing') ? cancelEdit : () => startEdit('pricing')}>
              <i className={`fas ${isEditingSection('pricing') ? 'fa-pencil-alt' : 'fa-edit'}`}></i> {isEditingSection('pricing') ? 'Editing...' : 'Edit'}
            </button>
          </div>
          <div className="cd-card-body">
            <div className="cd-row">
              <div className="cd-field">
                <label className="cd-label">Pricing Model <span className="req">*</span></label>
                {isEditingSection('pricing')
                  ? <select className="cd-input cd-select" value={profileData.pricingModel || ''} onChange={e => upd({ pricingModel: e.target.value })}>
                      <option value="">-- Select --</option>
                      {(PRICING_MODELS || ['Hourly', 'Per package', 'Per term', 'Custom quote']).map(m => <option key={m}>{m}</option>)}
                    </select>
                  : <div className={`cd-value ${!profileData.pricingModel ? 'empty' : ''}`}>{profileData.pricingModel || '—'}</div>}
              </div>
              <div className="cd-field">
                <label className="cd-label">Starting Price</label>
                {isEditingSection('pricing')
                  ? <input className="cd-input" type="text" value={profileData.startingPrice || ''} onChange={e => upd({ startingPrice: e.target.value })} placeholder="e.g. R150/hr" />
                  : <div className={`cd-value ${!profileData.startingPrice ? 'empty' : ''}`}>{profileData.startingPrice || '—'}</div>}
              </div>
            </div>
            <div className="cd-field">
              <label className="cd-label">Days Available</label>
              <div className="cd-days" style={{ marginTop: 5 }}>
                {days.map(d => {
                  const active = (profileData.availabilityDays || []).includes(d);
                  return (
                    <button key={d}
                      className={`cd-day-chip ${active ? 'on' : 'off'} ${isEditingSection('pricing') ? 'clickable' : ''}`}
                      onClick={() => isEditingSection('pricing') && toggleDay(d)}
                      style={{ border: active ? 'none' : '1px solid #e5e0d8' }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="cd-field">
              <label className="cd-label">Availability Notes</label>
              {isEditingSection('pricing')
                ? <input className="cd-input" type="text" value={profileData.availabilityNotes || ''} onChange={e => upd({ availabilityNotes: e.target.value })} placeholder="e.g. Weekday afternoons & Saturdays" />
                : <div className={`cd-value ${!profileData.availabilityNotes ? 'empty' : ''}`}>{profileData.availabilityNotes || '—'}</div>}
            </div>
          </div>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  /* ══ TAB: CONTACT & SOCIAL ══ */
  const renderTabContact = () => (
    <div className="cd-layout">
      <div>
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-address-card"></i></div>
            <div><div className="cd-card-title">Contact & Online Presence</div><div className="cd-card-subtitle">How families reach you</div></div>
            {isEditingSection('contact') && (
              <div className="cd-card-actions">
                <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                  <i className="fas fa-floppy-disk"></i> {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
              </div>
            )}
            <button className={`cd-edit-toggle ${isEditingSection('contact') ? 'active' : 'inactive'}`} style={{ display: isEditingSection('contact') ? 'none' : undefined }} onClick={isEditingSection('contact') ? cancelEdit : () => startEdit('contact')}>
              <i className={`fas ${isEditingSection('contact') ? 'fa-pencil-alt' : 'fa-edit'}`}></i> {isEditingSection('contact') ? 'Editing...' : 'Edit'}
            </button>
          </div>
          <div className="cd-card-body">
            {isEditingSection('contact') ? (
              <div className="cd-row">
                {[
                  { label: 'Contact Name',  key: 'contactName',  type: 'text',  placeholder: 'Full name' },
                  { label: 'Phone',         key: 'phone',        type: 'text',  placeholder: '+27 82 000 0000' },
                  { label: 'WhatsApp',      key: 'whatsapp',     type: 'text',  placeholder: '+27 82 000 0000' },
                  { label: 'Enquiry Email', key: 'contactEmail', type: 'email', placeholder: 'contact@example.com' },
                  { label: 'Website',       key: 'website',      type: 'url',   placeholder: 'https://yoursite.co.za' },
                  { label: 'LinkedIn',      key: 'linkedin',     type: 'url',   placeholder: 'https://linkedin.com/in/yourname' },
                  { label: 'Instagram',     key: 'instagram',    type: 'url',   placeholder: 'https://instagram.com/yourprofile' },
                  { label: 'Facebook',      key: 'facebook',     type: 'url',   placeholder: 'https://facebook.com/yourpage' },
                  { label: 'TikTok',        key: 'tiktok',       type: 'url',   placeholder: 'https://tiktok.com/@yourhandle' },
                  { label: 'X / Twitter',   key: 'twitter',      type: 'url',   placeholder: 'https://x.com/yourhandle' },
                  { label: 'YouTube',       key: 'youtube',      type: 'url',   placeholder: 'https://youtube.com/@yourchannel' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="cd-field">
                    <label className="cd-label">{label}</label>
                    <input className="cd-input" type={type} value={profileData[key] || ''} placeholder={placeholder}
                      onChange={e => upd({ [key]: e.target.value })} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {[
                  { icon: 'fa-user',        brand: false, label: 'Contact Name', val: profileData.contactName },
                  { icon: 'fa-phone',       brand: false, label: 'Phone',        val: profileData.phone },
                  { icon: 'fa-whatsapp',    brand: true,  label: 'WhatsApp',     val: profileData.whatsapp || profileData.phone },
                  { icon: 'fa-envelope',    brand: false, label: 'Email',        val: profileData.contactEmail },
                  { icon: 'fa-globe',       brand: false, label: 'Website',      val: profileData.website || profileData.social },
                  { icon: 'fa-linkedin',    brand: true,  label: 'LinkedIn',     val: profileData.linkedin },
                  { icon: 'fa-instagram',   brand: true,  label: 'Instagram',    val: profileData.instagram },
                  { icon: 'fa-facebook',    brand: true,  label: 'Facebook',     val: profileData.facebook },
                  { icon: 'fa-tiktok',      brand: true,  label: 'TikTok',       val: profileData.tiktok },
                  { icon: 'fa-x-twitter',   brand: true,  label: 'X / Twitter',  val: profileData.twitter },
                  { icon: 'fa-youtube',     brand: true,  label: 'YouTube',      val: profileData.youtube },
                ].filter(x => x.val).map(({ icon, brand, label, val }) => (
                  <div key={label} className="cd-contact-item">
                    <div className="cd-contact-icon">
                      <i className={`${brand ? 'fab' : 'fas'} ${icon}`}></i>
                    </div>
                    <div><div className="cd-contact-label">{label}</div><div className="cd-contact-val">{val}</div></div>
                  </div>
                ))}
                {!profileData.contactName && !profileData.phone && !profileData.contactEmail && (
                  <div className="cd-value empty">No contact details yet — click Edit to add.</div>
                )}
              </div>
            )}
            <div className="cd-toggle-row" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0ece5' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1a1a1a' }}>Display contact publicly</div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>Visible to families on your profile page</div>
              </div>
              <label className="cd-switch">
                <input type="checkbox" checked={!!profileData.publicToggle} disabled={!isEditingSection('contact')} onChange={e => upd({ publicToggle: e.target.checked })} />
                <span className="cd-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  /* ══ TAB: PLAN & REVIEWS ══ */
  const renderTabPlan = () => (
    <div className="cd-layout">
      <div>
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-crown"></i></div>
            <div><div className="cd-card-title">Your Current Plan</div><div className="cd-card-subtitle">Active listing tier</div></div>
          </div>
          <div className="cd-card-body tight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span className={`cd-plan-badge ${profileData.plan || 'free'}`}>
                <i className="fas fa-crown" style={{ color: '#f59e0b' }}></i>
                {getPlanName()}
              </span>
              <span style={{ fontSize: '0.76rem', color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-circle" style={{ color: profileData.status === 'approved' ? '#10b981' : '#f59e0b', fontSize: '0.5rem' }}></i>
                Listing is {profileData.status || 'pending'}
              </span>
            </div>
          </div>
        </div>
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-arrow-up"></i></div>
            <div><div className="cd-card-title">Change Plan</div><div className="cd-card-subtitle">Select an upgrade or adjust your tier</div></div>
          </div>
          <div className="cd-card-body">
            <div className="cd-plan-grid">
              {PLAN_CARDS.map(plan => {
                const isCurrent = profileData.plan === plan.id;
                const isHigher  = planOrder[plan.id] > planOrder[profileData.plan || 'free'];
                const showPlanAction = isCurrent || isHigher || plan.id !== 'free';
                return (
                  <div key={plan.id} className={`cd-plan-card ${isCurrent ? 'is-current' : ''}`}>
                    {isCurrent && <div className="cd-plan-current-badge">Current</div>}
                    <div className="cd-plan-card-name">{plan.name}</div>
                    <div className="cd-plan-card-desc">{plan.desc}</div>
                    <div className="cd-plan-price">{plan.price}<small>/month</small></div>
                    <ul className="cd-plan-features">
                      {plan.features.map((f, i) => <li key={i}><i className="fas fa-check-circle"></i>{f}</li>)}
                    </ul>
                    {showPlanAction && (
                      <button
                        className={`cd-plan-action-btn ${isCurrent ? 'current' : isHigher ? 'upgrade' : 'downgrade'}`}
                        disabled={isCurrent}
                        onClick={() => !isCurrent && handlePlanChange(plan.id)}
                      >
                        {isCurrent ? <><i className="fas fa-check"></i> Current Plan</>
                          : isHigher ? <><i className="fas fa-arrow-up"></i> Upgrade</>
                          : <><i className="fas fa-arrow-down"></i> Downgrade</>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-receipt"></i></div>
            <div><div className="cd-card-title">Payment History</div><div className="cd-card-subtitle">Paystack references and subscription activity</div></div>
          </div>
          <div className="cd-card-body">
            {paymentHistory.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {paymentHistory.map(payment => (
                  <div key={payment.id || payment.reference} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '12px 14px', background: '#faf9f7', borderRadius: 8, border: '1px solid #f0ece5' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: '#1a1a1a', fontSize: '.88rem' }}>{payment.plan === 'pro' ? 'Parental Plus+' : payment.plan}</div>
                      <div style={{ color: '#837b70', fontSize: '.72rem', wordBreak: 'break-all' }}>{payment.reference}</div>
                      <div style={{ color: '#888', fontSize: '.7rem', marginTop: 4 }}>
                        {payment.paidAt || payment.createdAt ? new Date(payment.paidAt || payment.createdAt).toLocaleString() : 'No date'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: '#6f8da6' }}>R{((payment.amount || 0) / 100).toFixed(2)}</div>
                      <div style={{ display: 'inline-flex', marginTop: 4, padding: '3px 8px', borderRadius: 99, background: ['PAID', 'SUCCESS', 'success'].includes(payment.status) ? '#e8f5e9' : '#fff3e0', color: ['PAID', 'SUCCESS', 'success'].includes(payment.status) ? '#2e7d32' : '#856404', fontSize: '.68rem', fontWeight: 900, textTransform: 'uppercase' }}>
                        {payment.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cd-value empty">No Paystack payments recorded yet. Paid checkouts will appear here after initialization.</div>
            )}
          </div>
        </div>
        <div className="cd-card">
          <div className="cd-card-header">
            <div className="cd-card-header-icon"><i className="fas fa-star"></i></div>
            <div><div className="cd-card-title">Reviews & Testimonials</div><div className="cd-card-subtitle">Family feedback on your listing</div></div>
          </div>
          <div className="cd-card-body">
            {(profileData.reviews?.items || []).length > 0 ? (
              <>
                {profileData.reviews.count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, padding: '9px 13px', background: '#faf9f7', borderRadius: 9 }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6f8da6', lineHeight: 1 }}>{profileData.reviews.average}</div>
                    <div>
                      <div style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(profileData.reviews.average))}{'☆'.repeat(5 - Math.round(profileData.reviews.average))}</div>
                      <div style={{ fontSize: '0.72rem', color: '#888' }}>Based on {profileData.reviews.count} reviews</div>
                    </div>
                  </div>
                )}
                {profileData.reviews.items.map((r, i) => (
                  <div key={i} className="cd-review">
                    <div className="cd-review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    <div className="cd-review-text">"{r.text}"</div>
                    <div className="cd-review-author">— {r.reviewer}</div>
                  </div>
                ))}
              </>
            ) : (
              <div className="cd-value empty">No reviews yet. Reviews appear once families leave feedback on your public profile.</div>
            )}
          </div>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  const renderActiveTab = () => {
    if (dataLoading) {
      return (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:200 }}>
          <div style={{ textAlign:'center', color:'#888' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize:'1.5rem', marginBottom:8, display:'block' }}></i>
            Loading your profile…
          </div>
        </div>
      );
    }
    switch (activeTab) {
      case 'profile':  return renderTabProfile();
      case 'services': return renderTabServices();
      case 'location': return renderTabLocation();
      case 'contact':  return renderTabContact();
      case 'plan':     return renderTabPlan();
      default:         return renderTabProfile();
    }
  };

  const getDashboardInquiries = (audience) => {
    const profileIds = [
      profileData.id,
      profileData.userId,
      getCurrentUser()?.id,
    ].filter(Boolean).map(String);
    const email = String(profileData.email || getCurrentUser()?.email || '').toLowerCase();

    return inquiries.filter((item) => {
      if (audience === 'provider') {
        return profileIds.includes(String(item.providerId || ''))
          || profileIds.includes(String(item.providerUserId || ''));
      }

      return profileIds.includes(String(item.clientId || ''))
        || (!!email && String(item.clientEmail || '').toLowerCase() === email);
    });
  };

  const openInquiry = (item, audience) => {
    setSelectedInquiry(item);
    markInquiryRead(item.id, audience);
    refreshInquiries();
  };

  const updateResponseDraft = (id, value) => {
    setResponseDrafts(prev => ({ ...prev, [id]: value }));
  };

  const sendInquiryResponse = (item) => {
    const response = (responseDrafts[item.id] || '').trim();
    if (!response) {
      showNotification('Please write a response before sending.', 'error');
      return;
    }

    const updated = respondToInquiry(item.id, response);
    const refreshed = updated.find(next => next.id === item.id) || item;
    setInquiries(updated);
    setSelectedInquiry(refreshed);
    setResponseDrafts(prev => ({ ...prev, [item.id]: '' }));
    showNotification('Response sent to the client dashboard.', 'success');
  };

  const scrollToEnquiries = () => {
    setShakingBell(true);
    setTimeout(() => {
      document.getElementById('dashboard-enquiries')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 240);
    setTimeout(() => setShakingBell(false), 420);
  };

  const renderEnquiryAlert = (audience) => {
    const visible = getDashboardInquiries(audience);
    const isProviderView = audience === 'provider';
    const unreadCount = visible.filter(item => isProviderView ? !item.providerRead : !item.clientRead).length;

    return (
      <div className="cd-alert-wrap">
        <button
          type="button"
          className={`cd-enquiry-bell${shakingBell ? ' shake' : ''}`}
          onClick={scrollToEnquiries}
          aria-label="View enquiry notifications"
          title="View enquiry notifications"
        >
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && <span className="cd-enquiry-alert-count">{unreadCount}</span>}
        </button>
      </div>
    );
  };

  const renderInquiryCenter = (audience) => {
    const visible = getDashboardInquiries(audience);
    const selected = selectedInquiry && visible.some(item => item.id === selectedInquiry.id)
      ? selectedInquiry
      : visible[0] || null;
    const unreadCount = visible.filter(item => audience === 'provider' ? !item.providerRead : !item.clientRead).length;
    const isProviderView = audience === 'provider';

    return (
      <div className="cd-card" id="dashboard-enquiries">
        <div className="cd-card-header">
          <div className="cd-card-header-icon"><i className="fas fa-bell"></i></div>
          <div>
            <div className="cd-card-title">{isProviderView ? 'Enquiry Notifications' : 'Your Enquiry Updates'}</div>
            <div className="cd-card-subtitle">
              {isProviderView ? 'New parent and learner messages land here.' : 'Confirmations for enquiries you have sent.'}
            </div>
          </div>
          {unreadCount > 0 && <span className="cd-inquiry-count">{unreadCount}</span>}
        </div>
        <div className="cd-card-body cd-inquiry-body">
          {visible.length === 0 ? (
            <div className="cd-inquiry-empty">
              <i className="fas fa-bell" style={{ marginRight: 8 }}></i>
              {isProviderView ? 'No enquiries yet. Fresh messages will pop up here.' : 'No sent enquiries yet. When you contact a provider, the confirmation will appear here.'}
            </div>
          ) : (
            <div className="cd-inquiry-layout">
              <div className="cd-inquiry-list">
                {visible.map((item) => {
                  const unread = isProviderView ? !item.providerRead : !item.clientRead;
                  return (
                    <button
                      key={item.id}
                      className={`cd-inquiry-card${unread ? ' unread' : ''}`}
                      onClick={() => openInquiry(item, audience)}
                    >
                      <div className="cd-inquiry-dot"><i className={`fas ${isProviderView ? 'fa-paper-plane' : 'fa-check'}`}></i></div>
                      <div className="cd-inquiry-main">
                        <div className="cd-inquiry-title">
                          {isProviderView ? item.clientName : item.providerName}
                          {unread && <span className="cd-inquiry-new">New</span>}
                        </div>
                        <div className="cd-inquiry-meta">
                          <span>{item.subject || 'General enquiry'}</span>
                          <span>{formatInquiryDate(item.createdAt)}</span>
                        </div>
                        <div className="cd-inquiry-preview">
                          {item.providerResponse && !isProviderView ? `Provider responded: ${item.providerResponse}` : item.message}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <div className="cd-inquiry-side-panel">
                  <div className="cd-inquiry-side-kicker">
                    <i className={`fas ${isProviderView ? 'fa-reply' : 'fa-clock'}`}></i>
                    {isProviderView ? 'Response hub' : 'Request tracker'}
                  </div>
                  <p className="cd-inquiry-side-text">
                    {isProviderView
                      ? 'Open a message, reply from the panel, and the client will see your response on their dashboard.'
                      : 'Your enquiry is saved here. Provider responses will appear as new updates.'}
                  </p>
                  <div className="cd-inquiry-side-stats">
                    <div className="cd-inquiry-side-stat">
                      <div className="cd-inquiry-side-num">{visible.length}</div>
                      <div className="cd-inquiry-side-label">{visible.length === 1 ? 'Enquiry' : 'Enquiries'}</div>
                    </div>
                    <div className="cd-inquiry-side-stat">
                      <div className="cd-inquiry-side-num">{unreadCount}</div>
                      <div className="cd-inquiry-side-label">New</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cd-inquiry-detail">
                {selected ? (
                  <>
                    <h4>{isProviderView ? 'Enquiry details' : 'Request confirmation'}</h4>
                    <div className="cd-inquiry-detail-grid">
                      <div className="cd-inquiry-detail-row">
                        <div className="cd-inquiry-detail-label">{isProviderView ? 'From' : 'Provider'}</div>
                        <div className="cd-inquiry-detail-value">{isProviderView ? selected.clientName : selected.providerName}</div>
                      </div>
                      <div className="cd-inquiry-detail-row">
                        <div className="cd-inquiry-detail-label">Subject</div>
                        <div className="cd-inquiry-detail-value">{selected.subject}</div>
                      </div>
                      {isProviderView && (
                        <>
                          <div className="cd-inquiry-detail-row">
                            <div className="cd-inquiry-detail-label">Email</div>
                            <div className="cd-inquiry-detail-value">{selected.clientEmail}</div>
                          </div>
                          <div className="cd-inquiry-detail-row">
                            <div className="cd-inquiry-detail-label">Phone</div>
                            <div className="cd-inquiry-detail-value">{selected.clientPhone || 'Not provided'}</div>
                          </div>
                        </>
                      )}
                      <div className="cd-inquiry-detail-row wide">
                        <div className="cd-inquiry-detail-label">Message</div>
                        <div className="cd-inquiry-detail-value">{selected.message}</div>
                      </div>
                      {!isProviderView && !selected.providerResponse && (
                        <div className="cd-inquiry-detail-row">
                          <div className="cd-inquiry-detail-label">Next</div>
                          <div className="cd-inquiry-detail-value">Your request is with the provider. They can review it from their dashboard and respond here.</div>
                        </div>
                      )}
                    </div>
                    {selected.providerResponse && (
                      <div className="cd-inquiry-reply">
                        <span className="cd-inquiry-reply-label">Provider response {formatInquiryDate(selected.respondedAt)}</span>
                        {selected.providerResponse}
                      </div>
                    )}
                    {isProviderView && (
                      <div className="cd-inquiry-response-box">
                        <label className="cd-label">Respond to client</label>
                        <textarea
                          value={responseDrafts[selected.id] || ''}
                          onChange={(e) => updateResponseDraft(selected.id, e.target.value)}
                          placeholder={selected.providerResponse ? 'Send an updated response...' : 'Write a friendly reply...'}
                        />
                        <div className="cd-inquiry-response-actions">
                          <div className="cd-inquiry-response-note">
                            The client will see this response in their dashboard.
                          </div>
                          <button type="button" className="cd-btn-solid" onClick={() => sendInquiryResponse(selected)}>
                            <i className="fas fa-paper-plane"></i> Send Response
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTermsModal = () => {
    if (!showTermsModal) return null;

    return (
      <div className="cd-terms-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="parentals-terms-title" onClick={(e) => { if (e.target === e.currentTarget) setShowTermsModal(false); }}>
        <div className="cd-terms-modal">
          <div className="cd-terms-modal-head">
            <div id="parentals-terms-title" className="cd-terms-modal-title">
              <i className="fas fa-file-contract"></i> Parentals Terms & Conditions
            </div>
            <button type="button" className="cd-terms-modal-close" aria-label="Close terms" onClick={() => setShowTermsModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="cd-terms-modal-body">
            <ol>
              <li>
                <strong>Eligibility &amp; Accuracy</strong>
                <p>By registering as a service provider, you confirm that all information provided is accurate, current, and complete. You must be at least 18 years of age or represent a legally registered organisation.</p>
              </li>
              <li>
                <strong>Listing Standards</strong>
                <p>Your listing must represent genuine products, services or professional support relevant to parents and families. Listings that are misleading, fraudulent, or offensive will be removed without notice.</p>
              </li>
              <li>
                <strong>Qualifications &amp; Credentials</strong>
                <p>Any qualifications, certifications, police clearances, or memberships listed must be legitimate and verifiable upon request. Parental's reserves the right to request proof of credentials at any time.</p>
              </li>
              <li>
                <strong>Conduct &amp; Community Standards</strong>
                <p>Treat all families and platform users with respect. Do not engage in spam, unsolicited advertising, or misleading promotions. Do not impersonate other individuals, organisations, or credentials.</p>
              </li>
              <li>
                <strong>Privacy &amp; Data Use</strong>
                <p>Information you provide will be stored and used to create and display your public provider profile. Contact information will be shared with families according to your selected plan. We do not sell personal data to third parties.</p>
              </li>
              <li>
                <strong>Profile Approval</strong>
                <p>All new profiles are subject to admin review before going live. Parental's reserves the right to reject or remove any listing that does not meet our community standards.</p>
              </li>
              <li>
                <strong>Paid Plans &amp; Billing</strong>
                <p>Paid listing plans are billed monthly. Cancellation can be requested at any time with effect from the next billing cycle. Refunds are not provided for partial months.</p>
              </li>
              <li>
                <strong>Liability</strong>
                <p>Parental's acts as a directory platform and is not responsible for the quality, safety, or outcome of services provided by listed businesses or providers. Families are encouraged to conduct their own due diligence.</p>
              </li>
              <li>
                <strong>Amendments</strong>
                <p>These terms may be updated periodically. Continued use of the platform constitutes acceptance of the updated terms.</p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentCheckoutModal = () => {
    if (!checkoutPlan) return null;

    const cardErrors = validateCardForm(cardForm);
    const eftErrors = validateEftForm(eftForm);
    const cardBrand = detectCardBrand(cardForm.cardNumber);
    const paymentButtonLabel = checkoutMethod === 'card'
      ? 'Pay R149 securely'
      : checkoutMethod === 'bank'
        ? 'Generate bank details'
        : 'Continue to secure EFT';
    const paymentDisabled = checkoutLoading
      || (checkoutMethod === 'card' && Object.keys(cardErrors).length > 0)
      || (checkoutMethod === 'eft' && Object.keys(eftErrors).length > 0);
    const methodName = PAYMENT_METHODS.find(method => method.id === checkoutMethod)?.label || checkoutMethod;
    const instructions = activePayment?.instructions || {};

    const renderFieldError = (message) => message ? <div className="cd-payment-field-error">{message}</div> : null;

    const renderPaymentState = () => {
      if (checkoutState === 'success') {
        return (
          <div className="cd-payment-result success">
            <i className="fas fa-check-circle"></i>
            <h3>Payment successful</h3>
            <p>Your account has been upgraded to Parental Plus+</p>
            <div className="cd-payment-result-grid">
              <span>Amount paid</span><strong>R149 ZAR</strong>
              <span>Payment method</span><strong>{methodName}</strong>
              <span>Reference</span><strong>{activePayment?.reference || '-'}</strong>
              <span>Date and time</span><strong>{activePayment?.paidAt || activePayment?.verifiedAt ? new Date(activePayment.paidAt || activePayment.verifiedAt).toLocaleString() : new Date().toLocaleString()}</strong>
            </div>
            <button type="button" className="cd-payment-primary" onClick={closePaymentModal}>Continue to dashboard</button>
          </div>
        );
      }

      if (['failed', 'cancelled', 'expired', 'network_error'].includes(checkoutState)) {
        const title = checkoutState === 'expired' ? 'Payment expired' : checkoutState === 'cancelled' ? 'Payment cancelled' : checkoutState === 'network_error' ? 'Network error' : 'Payment failed';
        return (
          <div className="cd-payment-result failed">
            <i className="fas fa-circle-exclamation"></i>
            <h3>{title}</h3>
            <p>{checkoutError || activePayment?.failureReason || 'The payment could not be completed safely.'}</p>
            <div className="cd-payment-actions inline">
              <button type="button" className="cd-payment-primary" disabled={checkoutLoading} onClick={startCheckoutPayment}>Try again</button>
              <button type="button" className="cd-payment-secondary" disabled={checkoutLoading} onClick={() => { setCheckoutState('idle'); setActivePayment(null); setCheckoutError(''); }}>Choose another payment method</button>
            </div>
          </div>
        );
      }

      if (['pending', 'checking', 'verifying'].includes(checkoutState) && activePayment) {
        return (
          <div className="cd-payment-result pending">
            <i className={`fas ${checkoutLoading ? 'fa-spinner fa-spin' : 'fa-clock'}`}></i>
            <h3>Your payment is still being confirmed</h3>
            <p>Reference: <strong>{activePayment.reference}</strong>. Please do not make this payment twice.</p>
            <div className="cd-payment-actions inline">
              <button type="button" className="cd-payment-primary" disabled={checkoutLoading} onClick={() => verifyActivePayment(activePayment.reference)}>
                {checkoutLoading ? 'Checking payment...' : 'Check status'}
              </button>
              <button type="button" className="cd-payment-secondary" disabled={checkoutLoading} onClick={checkPaymentStatus}>Refresh status</button>
            </div>
            {activePayment.provider === 'paystack-mock' && (
              <div className="cd-payment-demo-tools">
                <button type="button" onClick={() => simulateMockOutcome('SUCCESS')}>Simulate success</button>
                <button type="button" onClick={() => simulateMockOutcome('PENDING')}>Simulate pending</button>
                <button type="button" onClick={() => simulateMockOutcome('FAILED')}>Simulate failed</button>
                <button type="button" onClick={() => simulateMockOutcome('EXPIRED')}>Simulate expired</button>
              </div>
            )}
          </div>
        );
      }

      return null;
    };

    const terminalState = ['success', 'failed', 'cancelled', 'expired', 'network_error'].includes(checkoutState)
      || (checkoutMethod !== 'bank' && ['pending', 'checking', 'verifying'].includes(checkoutState) && activePayment);

    return (
      <div className="cd-payment-overlay" role="dialog" aria-modal="true" aria-labelledby="parentals-payment-title" onClick={(e) => { if (e.target === e.currentTarget) closePaymentModal(); }}>
        <div className="cd-payment-modal">
          <div className="cd-payment-head">
            <div>
              <div className="cd-payment-kicker">Paystack Checkout <span className="cd-payment-test-mode">Test mode</span></div>
              <div id="parentals-payment-title" className="cd-payment-title">Complete your upgrade</div>
            </div>
            <button type="button" className="cd-payment-close" aria-label="Close payment checkout" onClick={closePaymentModal}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="cd-payment-body">
            <div className="cd-payment-summary">
              <div>
                <div className="cd-payment-plan-name">Plan: {checkoutPlan.name}</div>
                <div className="cd-payment-plan-note">Billing: Monthly | Currency: ZAR | Total due today: R149</div>
              </div>
              <div className="cd-payment-amount">
                R{checkoutPlan.amount}
                <small>/ {checkoutPlan.period}</small>
              </div>
            </div>

            <div className="cd-payment-section-title">Choose payment method</div>
            <div className="cd-payment-methods">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.id}
                  type="button"
                  className={`cd-payment-method${checkoutMethod === method.id ? ' selected' : ''}`}
                  disabled={checkoutLoading || checkoutState === 'success'}
                  onClick={() => { setCheckoutMethod(method.id); setCheckoutState('idle'); setCheckoutError(''); setActivePayment(null); }}
                >
                  <i className={`fas ${method.icon}`}></i>
                  <span>{method.label}</span>
                </button>
              ))}
            </div>

            {terminalState ? renderPaymentState() : (
              <>
                {checkoutMethod === 'card' && (
                  <div className="cd-payment-form">
                    <div className="cd-payment-note"><i className="fas fa-shield-halved"></i> Test payment - no real charge will be made. Real card payments will use Paystack secure checkout or secure payment fields.</div>
                    <div className="cd-payment-grid">
                      <label>Name on card<input value={cardForm.cardName} onChange={e => setCardForm(prev => ({ ...prev, cardName: e.target.value }))} autoComplete="cc-name" />{renderFieldError(cardErrors.cardName)}</label>
                      <label>Billing email<input type="email" value={cardForm.email} onChange={e => setCardForm(prev => ({ ...prev, email: e.target.value }))} autoComplete="email" />{renderFieldError(cardErrors.email)}</label>
                      <label className="wide">Card number<div className="cd-payment-card-input"><input inputMode="numeric" value={cardForm.cardNumber} onChange={e => setCardForm(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))} autoComplete="cc-number" /><span>{cardBrand || 'Card'}</span></div>{renderFieldError(cardErrors.cardNumber)}</label>
                      <label>Expiry date<input inputMode="numeric" placeholder="MM/YY" value={cardForm.expiry} onChange={e => setCardForm(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))} autoComplete="cc-exp" />{renderFieldError(cardErrors.expiry)}</label>
                      <label>CVV<input inputMode="numeric" value={cardForm.cvv} onChange={e => setCardForm(prev => ({ ...prev, cvv: digitsOnly(e.target.value).slice(0, 4) }))} autoComplete="cc-csc" />{renderFieldError(cardErrors.cvv)}</label>
                      <label className="wide">Billing phone (optional)<input inputMode="tel" value={cardForm.phone} onChange={e => setCardForm(prev => ({ ...prev, phone: e.target.value.replace(/[^\d+()\-\s]/g, '') }))} autoComplete="tel" />{renderFieldError(cardErrors.phone)}</label>
                    </div>
                    <div className="cd-payment-secure"><i className="fas fa-lock"></i> Secure payment. Card details are not stored or sent to The Parentals backend.</div>
                  </div>
                )}

                {checkoutMethod === 'bank' && activePayment?.instructions ? (
                  <div className="cd-payment-bank">
                    <div className="cd-payment-note"><i className="fas fa-building-columns"></i> Transfer exactly R149 using the reference below. Your plan stays pending until Paystack confirms payment.</div>
                    <div className="cd-payment-result-grid">
                      <span>Bank name</span><strong>{instructions.bankName || '-'}</strong>
                      <span>Account name</span><strong>{instructions.accountName || '-'}</strong>
                      <span>Account number</span><strong>{instructions.accountNumber || '-'} <button type="button" className="cd-copy-btn" onClick={() => copyPaymentText('account', instructions.accountNumber)}>{copiedPaymentField === 'account' ? 'Copied' : 'Copy'}</button></strong>
                      <span>Amount</span><strong>R149</strong>
                      <span>Payment reference</span><strong>{instructions.reference || activePayment.reference} <button type="button" className="cd-copy-btn" onClick={() => copyPaymentText('reference', instructions.reference || activePayment.reference)}>{copiedPaymentField === 'reference' ? 'Copied' : 'Copy'}</button></strong>
                      <span>Expires</span><strong>{bankCountdown || '-'}</strong>
                    </div>
                    {activePayment.provider === 'paystack-mock' && (
                      <div className="cd-payment-demo-tools">
                        <button type="button" onClick={() => simulateMockOutcome('SUCCESS')}>Simulate success</button>
                        <button type="button" onClick={() => simulateMockOutcome('PENDING')}>Simulate pending</button>
                        <button type="button" onClick={() => simulateMockOutcome('FAILED')}>Simulate failed</button>
                        <button type="button" onClick={() => simulateMockOutcome('EXPIRED')}>Simulate expired</button>
                      </div>
                    )}
                  </div>
                ) : checkoutMethod === 'bank' && (
                  <div className="cd-payment-note"><i className="fas fa-circle-info"></i> Generate temporary Paystack bank details, then transfer exactly R149 using the displayed reference.</div>
                )}

                {checkoutMethod === 'eft' && (
                  <div className="cd-payment-form">
                    <div className="cd-payment-note"><i className="fas fa-lock"></i> You will complete EFT securely through Paystack or its supported banking provider. Never enter banking passwords in this app.</div>
                    <div className="cd-payment-grid">
                      <label>Full name<input value={eftForm.fullName} onChange={e => setEftForm(prev => ({ ...prev, fullName: e.target.value }))} />{renderFieldError(eftErrors.fullName)}</label>
                      <label>Email address<input type="email" value={eftForm.email} onChange={e => setEftForm(prev => ({ ...prev, email: e.target.value }))} />{renderFieldError(eftErrors.email)}</label>
                      <label className="wide">Phone number (optional)<input inputMode="tel" value={eftForm.phone} onChange={e => setEftForm(prev => ({ ...prev, phone: e.target.value.replace(/[^\d+()\-\s]/g, '') }))} />{renderFieldError(eftErrors.phone)}</label>
                    </div>
                  </div>
                )}
              </>
            )}

            {checkoutError && <div className="cd-payment-error">{checkoutError}</div>}

            {!terminalState && (
            <div className="cd-payment-actions">
              <button type="button" className="cd-payment-secondary" disabled={checkoutLoading} onClick={closePaymentModal}>
                Cancel
              </button>
              {checkoutMethod === 'bank' && activePayment ? (
                <button type="button" className="cd-payment-primary" disabled={checkoutLoading} onClick={() => verifyActivePayment(activePayment.reference)}>
                  <i className={`fas ${checkoutLoading ? 'fa-spinner fa-spin' : 'fa-rotate'}`}></i>
                  {checkoutLoading ? 'Checking payment...' : 'I have made the transfer'}
                </button>
              ) : (
              <button type="button" className="cd-payment-primary" disabled={paymentDisabled} onClick={startCheckoutPayment}>
                <i className={`fas ${checkoutLoading ? 'fa-spinner fa-spin' : 'fa-lock'}`}></i>
                {checkoutLoading ? 'Processing payment...' : paymentButtonLabel}
              </button>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMemberDashboard = () => {
    const memberId = profileData.userId || profileData.id;

    if (dataLoading) {
      return (
        <div className="cd-wrap">
          <Header userType="client" showBack={false} />
          <main className="cd-main">
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:260 }}>
              <div style={{ textAlign:'center', color:'#888' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize:'1.5rem', marginBottom:8, display:'block' }}></i>
                Loading your member profile...
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    return (
      <div className="cd-wrap">
        <Header userType="client" showBack={false} />
        <section className="cd-hero">
          <div className="cd-hero-top">
            <div className="cd-hero-left">
              <div className="cd-hero-eyebrow"><span></span>Member Dashboard</div>
              <h1 className="cd-hero-title">Welcome back, <em>{profileData.name || 'Member'}</em></h1>
              <div className="cd-hero-meta">
                <div className="cd-status-pill approved">
                  <i className="fas fa-user-circle"></i> Member Profile
                </div>
                <div style={{ color: 'rgba(255,255,255,.72)', fontSize: '0.75rem' }}>
                  Account type: {profileData.accountType || 'parent'}
                </div>
              </div>
            </div>
            <div className="cd-hero-right">
              <button
                className="cd-btn-ghost"
                onClick={() => navigate(memberId ? `/profile?member=${memberId}&from=dashboard` : '/profile?from=dashboard')}
              >
                <i className="fas fa-eye"></i> Public View
              </button>
            </div>
          </div>
        </section>
        {renderEnquiryAlert('client')}

        <main className="cd-main">
          <Link to="/#sah-providers" className="cd-directory-back">
            <i className="fas fa-arrow-left"></i> Back to Directory
          </Link>
          {renderInquiryCenter('client')}
          <div className="cd-layout" style={{ gridTemplateColumns: 'minmax(0, 760px) minmax(240px, 320px)' }}>
            <div className="cd-card">
              <div className="cd-card-header">
                <div className="cd-card-header-icon"><i className="fas fa-user"></i></div>
                <div>
                  <div className="cd-card-title">Account Information</div>
                  <div className="cd-card-subtitle">Your normal member profile details</div>
                </div>
                {editing ? (
                  <div className="cd-card-actions">
                    <button className="cd-btn-solid" onClick={saveMemberChanges} disabled={loading}>
                      <i className="fas fa-floppy-disk"></i> {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
                  </div>
                ) : (
                  <button className="cd-edit-toggle inactive" onClick={startEdit}>
                    <i className="fas fa-edit"></i>
                    Edit Profile
                  </button>
                )}
              </div>
              <div className="cd-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f0ece5' }}>
                  <div className="cd-photo-wrap">
                    {photoPreview
                      ? <img src={photoPreview} alt="Member profile" className="cd-photo-img" />
                      : <div className="cd-photo-placeholder"><i className="fas fa-user"></i></div>}
                    <div className="cd-photo-btn" onClick={() => photoInputRef.current?.click()}>
                      <i className="fas fa-camera"></i>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="cd-photo-input" onChange={handlePhotoChange} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a1a1a' }}>{profileData.name || 'Your Name'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888', margin: '2px 0 6px' }}>{profileData.email}</div>
                    <button onClick={() => photoInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#6f8da6', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      <i className="fas fa-camera"></i> Change profile photo
                    </button>
                  </div>
                </div>

                <div className="cd-row">
                  <div className="cd-field">
                    <label className="cd-label">Full Name</label>
                    {editing
                      ? <input className="cd-input" type="text" value={profileData.name || ''} onChange={e => upd({ name: e.target.value })} />
                      : <div className={`cd-value ${!profileData.name ? 'empty' : ''}`}>{profileData.name || '-'}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Email Address</label>
                    {editing
                      ? <input className="cd-input" type="email" value={profileData.email || ''} onChange={e => upd({ email: e.target.value })} />
                      : <div className={`cd-value ${!profileData.email ? 'empty' : ''}`}>{profileData.email || '-'}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Account Type</label>
                    {editing
                      ? (
                        <select className="cd-input cd-select" value={profileData.accountType || 'parent'} onChange={e => upd({ accountType: e.target.value })}>
                          <option value="parent">Parent</option>
                          <option value="student">Student</option>
                          <option value="guardian">Guardian</option>
                          <option value="educator">Educator</option>
                          <option value="member">Member</option>
                        </select>
                      )
                      : <div className="cd-value">{profileData.accountType || 'parent'}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Phone</label>
                    {editing
                      ? <input className="cd-input" type="tel" value={profileData.phone || ''} onChange={e => upd({ phone: e.target.value })} />
                      : <div className={`cd-value ${!profileData.phone ? 'empty' : ''}`}>{profileData.phone || '-'}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Province</label>
                    {editing
                      ? (
                        <select className="cd-input cd-select" value={profileData.province || ''} onChange={e => upd({ province: e.target.value })}>
                          <option value="">-- Select --</option>
                          {(PROVINCES || []).map(p => <option key={p}>{p}</option>)}
                        </select>
                      )
                      : <div className={`cd-value ${!profileData.province ? 'empty' : ''}`}>{profileData.province || '-'}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">City</label>
                    {editing
                      ? <input className="cd-input" type="text" value={profileData.city || ''} onChange={e => upd({ city: e.target.value })} />
                      : <div className={`cd-value ${!profileData.city ? 'empty' : ''}`}>{profileData.city || '-'}</div>}
                  </div>
                </div>

                <div className="cd-field" style={{ marginTop: 4 }}>
                  <label className="cd-label">Short Bio</label>
                  {editing
                    ? <textarea className="cd-input cd-textarea" value={profileData.bio || ''} onChange={e => upd({ bio: e.target.value })} placeholder="A short note about you..." />
                    : <div className={`cd-value ${!profileData.bio ? 'empty' : ''}`} style={{ display: 'block', lineHeight: 1.6, padding: '7px 0' }}>{profileData.bio || 'No bio added yet.'}</div>}
                </div>
              </div>
            </div>

            <div>
              <div className="cd-sidebar-card">
                <div className="cd-sidebar-header">
                  <div className="cd-sidebar-title"><i className="fas fa-circle-info" style={{ marginRight: 6 }}></i>Member Profile</div>
                </div>
                <div className="cd-sidebar-body">
                  <p style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.65 }}>
                    This profile is for your member account only. Provider listings, services, pricing, qualifications and plan settings are managed separately by provider accounts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  };

  const currentSession = getCurrentUser();
  if (isMemberAccount(currentSession) || isMemberAccount(profileData)) {
    return renderMemberDashboard();
  }

  return (
    <div className="cd-wrap">
      <Header userType="client" backPath="/" />
      <section className="cd-hero">
        <div className="cd-hero-top">
          <div className="cd-hero-left">
            <div className="cd-hero-eyebrow"><span></span>Provider Dashboard</div>
            <h1 className="cd-hero-title">Welcome back, <em>{profileData.name || 'Provider'}</em></h1>
            <div className="cd-hero-meta">
              <div className={`cd-status-pill ${statusInfo.cls}`}>
                <i className={`fas ${statusInfo.icon}`}></i> {statusInfo.label}
              </div>
              <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-crown" style={{ color: '#f59e0b' }}></i> {getPlanName()}
              </div>
            </div>
          </div>
          <div className="cd-hero-right">
            <button
              type="button"
              className="cd-btn-ghost"
              onClick={openPublicView}
            >
              <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-eye'}`}></i> Public View
            </button>
            {editing && (
              <>
                <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                  <i className="fas fa-floppy-disk"></i> {loading ? 'Saving…' : 'Save'}
                </button>
                <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
              </>
            )}
          </div>
        </div>
        <div className="cd-tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`cd-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <i className={`fas ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>
      </section>
      {renderEnquiryAlert('provider')}
      <main className="cd-main">
        <Link
          to="/#sah-providers"
          className="cd-directory-back"
          onClick={(event) => {
            event.preventDefault();
            saveAndNavigate('/#sah-providers');
          }}
        >
          <i className="fas fa-arrow-left"></i> Back to Directory
        </Link>
        {renderInquiryCenter('provider')}
        {renderActiveTab()}
      </main>
      {renderTermsModal()}
      {renderPaymentCheckoutModal()}
      <Footer />
    </div>
  );
};

export default ClientDashboard;
