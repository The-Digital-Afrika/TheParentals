// frontend/src/pages/Profile.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { api } from '../services/api';
import '../assets/css/profile.css';

const SEED_PROVIDERS = [
  {
    id: "s1", name: "STEM Mastery Tutors", category: "tutor", location: "Johannesburg, Gauteng",
    delivery: "Online & In-person",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2b033f?w=600&auto=format&fit=crop&q=75",
    priceFrom: "R280/hr", badge: "featured", rating: 4.9, reviewCount: 62, tier: "featured",
    registered: "2025-01-10T08:00:00Z", status: "approved",
    primaryCategory: "Tutor", city: "Johannesburg", province: "Gauteng", deliveryMode: "Online & In-person",
    bio: "Specialist STEM tutors for Grades 8–12. We focus on Mathematics, Physical Sciences and Life Sciences with a proven track record of improving results.",
    tags: ["Mathematics", "Physical Sciences", "Life Sciences", "Grades 8–12"],
    ageGroups: ["11–13", "14–18"], startingPrice: "R280/hr",
    availabilityDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    availabilityNotes: "Weekday afternoons & Saturdays",
    phone: "+27 11 000 1111", contactEmail: "info@stemmastery.co.za",
    certifications: "SACE Registered, Honours in Mathematics Education",
    listingPlan: "featured",
    reviews: { average: 4.9, count: 62, items: [{ reviewer: "Nomsa P.", rating: 5, text: "My son went from 40% to 82% in Maths. Incredible tutors." }] }
  },
  {
    id: "khan", name: "Khan Academy SA", category: "curriculum", location: "Johannesburg, Gauteng",
    delivery: "Online",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&auto=format&fit=crop&q=75",
    priceFrom: "Free", badge: "featured", rating: 4.9, reviewCount: 156, tier: "featured",
    registered: "2025-01-01T00:00:00Z", status: "approved",
    primaryCategory: "Curriculum Provider", city: "Johannesburg", province: "Gauteng", deliveryMode: "Online",
    bio: "Free world-class education for anyone, anywhere. Our curriculum covers mathematics, science, computing, humanities and more. We provide video lessons, practice exercises, and personalised learning dashboards for homeschoolers across South Africa. Completely free, forever.",
    tags: ["Mathematics", "Science", "Online Learning", "Free Curriculum", "Video Lessons", "All Ages"],
    ageGroups: ["5–7", "8–10", "11–13", "14–18"], startingPrice: "Free",
    availabilityDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    availabilityNotes: "24/7 Online — self-paced learning available anytime",
    phone: "+27 11 555 1234", contactEmail: "support@khanacademy.org.za",
    email: "contact@khanacademy.org.za",
    certifications: "Khan Academy Certified Content Provider, Google for Education Partner",
    degrees: "BSc Computer Science (Stanford), MEd (Harvard)",
    memberships: "SA Curriculum Association, Digital Learning Collective",
    clearance: "Verified (2025)",
    social: "https://www.khanacademy.org",
    listingPlan: "featured",
    reviews: {
      average: 4.9, count: 156,
      items: [
        { reviewer: "Sarah J.", rating: 5, text: "Excellent resource for our homeschool curriculum." },
        { reviewer: "Thabo M.", rating: 5, text: "My kids love the math challenges." }
      ]
    }
  },
];

function findProvider(id, email) {
  try {
    const stored = JSON.parse(localStorage.getItem('sah_providers') || '[]');
    const all = [...stored, ...SEED_PROVIDERS];
    let found = null;
    if (id) found = all.find(p => p.id === id) || null;
    else if (email) found = all.find(p => p.email === email || p.contactEmail === email) || null;
    if (found) {
      return {
        ...found,
        name: found.name || '',
        bio: found.bio || '',
        primaryCategory: found.primaryCategory || found.category || '',
        city: found.city || '',
        province: found.province || '',
        phone: found.phone || '',
        whatsapp: found.whatsapp || '',
        contactEmail: found.contactEmail || found.email || '',
        website: found.website || found.social || '',
        facebook: found.facebook || '',
        social: found.social || found.website || '',
        startingPrice: typeof found.startingPrice === 'string' ? found.startingPrice : (found.priceFrom || ''),
        deliveryMode: found.deliveryMode || found.delivery || '',
        degrees: found.degrees || '',
        certifications: found.certifications || '',
        memberships: found.memberships || '',
        clearance: found.clearance || '',
        availabilityNotes: found.availabilityNotes || '',
        tags: Array.isArray(found.tags) ? found.tags : [],
        ageGroups: Array.isArray(found.ageGroups) ? found.ageGroups : [],
        availabilityDays: Array.isArray(found.availabilityDays) ? found.availabilityDays : [],
        services: Array.isArray(found.services) ? found.services : [],
        reviews: found.reviews || { average: 0, count: 0, items: [] },
      };
    }
    return null;
  } catch { return null; }
}

function normalizeApiProfile(found) {
  if (!found) return null;
  return {
    ...found,
    id: found.userId || found.id,
    userId: found.userId || found.id,
    name: found.name || found.fullName || '',
    bio: found.bio || '',
    primaryCategory: found.primaryCategory || found.category || '',
    city: found.city || '',
    province: found.province || '',
    location: found.location || [found.city, found.province].filter(Boolean).join(', '),
    phone: found.phone || '',
    whatsapp: found.whatsapp || '',
    contactEmail: found.contactEmail || found.inquiryEmail || found.email || '',
    website: found.website || found.social || '',
    facebook: found.facebook || '',
    social: found.social || found.website || '',
    startingPrice: typeof found.startingPrice === 'string' ? found.startingPrice : (found.priceFrom || ''),
    priceFrom: found.priceFrom || found.startingPrice || 'Contact',
    deliveryMode: found.deliveryMode || found.delivery || '',
    delivery: found.delivery || found.deliveryMode || '',
    degrees: found.degrees || '',
    certifications: found.certifications || '',
    memberships: found.memberships || '',
    clearance: found.clearance || '',
    image: found.image || found.profilePhoto || null,
    photo: found.photo || found.profilePhoto || null,
    tier: found.tier || found.plan || found.listingPlan || 'free',
    listingPlan: found.listingPlan || found.plan || found.tier || 'free',
    tags: found.tags || (found.subjects ? String(found.subjects).split(',').map(s => s.trim()).filter(Boolean) : []),
    reviews: found.reviews || { average: found.rating || 0, count: found.reviewCount || 0, items: [] },
  };
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ORANGE = '#6f8da6';

/* ── Inject all styles ── */
const injectStyles = () => {
  if (document.getElementById('profile-v2-styles')) return;
  const style = document.createElement('style');
  style.id = 'profile-v2-styles';
  style.textContent = `
    #profilePageV2 * { box-sizing: border-box; }
    #profilePageV2 {
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
      background: #f4f1ec;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Members Only Gate ── */
    .pv2-members-gate {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f7f8fa;
      padding: 32px 16px;
    }
    .pv2-gate-card {
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.12);
      padding: 48px 40px;
      text-align: center;
      max-width: 480px;
      width: 100%;
      border: 1px solid rgba(0,0,0,0.06);
    }
    .pv2-gate-icon {
      width: 80px; height: 80px;
      background: #ff8c42;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 8px 24px rgba(194,81,10,0.3);
    }
    .pv2-gate-icon i { color: #fff; font-size: 2rem; }
    .pv2-gate-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem; font-weight: 900;
      color: #1a1a1a; margin-bottom: 12px; line-height: 1.2;
    }
    .pv2-gate-subtitle {
      color: #666; font-size: 0.95rem; line-height: 1.6; margin-bottom: 32px;
    }
    .pv2-gate-actions {
      display: flex; flex-direction: column; gap: 12px;
    }
    .pv2-gate-btn-primary {
      display: block; width: 100%; padding: 14px 24px;
      background: ${ORANGE}; color: #fff;
      border: none; border-radius: 10px;
      font-family: 'DM Sans', sans-serif; font-size: 0.97rem; font-weight: 700;
      cursor: pointer; text-decoration: none;
      transition: background 0.15s, transform 0.12s;
      box-shadow: 0 4px 14px rgba(194,81,10,0.3);
    }
    .pv2-gate-btn-primary:hover { background: #a84412; transform: translateY(-1px); }
    .pv2-gate-btn-secondary {
      display: block; width: 100%; padding: 13px 24px;
      background: transparent; color: ${ORANGE};
      border: 2px solid ${ORANGE}; border-radius: 10px;
      font-family: 'DM Sans', sans-serif; font-size: 0.97rem; font-weight: 700;
      cursor: pointer; text-decoration: none;
      transition: all 0.15s;
    }
    .pv2-gate-btn-secondary:hover { background: rgba(194,81,10,0.06); }
    .pv2-gate-divider {
      display: flex; align-items: center; gap: 12px;
      color: #bbb; font-size: 0.82rem; margin: 4px 0;
    }
    .pv2-gate-divider::before, .pv2-gate-divider::after {
      content: ''; flex: 1; height: 1px; background: #e5e5e5;
    }
    .pv2-gate-perks {
      display: flex; flex-direction: column; gap: 10px;
      background: #faf9f7; border-radius: 10px;
      padding: 16px 20px; margin-bottom: 28px; text-align: left;
    }
    .pv2-gate-perk {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.86rem; color: #444; font-weight: 500;
    }
    .pv2-gate-perk i { color: ${ORANGE}; width: 16px; text-align: center; }

    /* ── Page wrapper ── */
    .pv2-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 28px 32px 60px;
    }

    /* ── TOP GRID ── */
    .pv2-top-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
      align-items: stretch;
      margin-bottom: 24px;
    }

    /* ── Left panel — side-by-side sections ── */
    .pv2-left {
      display: flex;
      flex-direction: row;
      gap: 0;
      background: #ede9e3;
      border-radius: 14px;
      border: 1px solid #dedad4;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      order: 2;
    }

    .pv2-services-section {
      flex: 1;
      padding: 28px 30px 28px;
      border-right: 1px solid rgba(0,0,0,0.08);
      overflow-y: auto;
    }

    .pv2-about-section {
      flex: 1;
      padding: 28px 30px 28px;
    }

    /* ── Eyebrow / heading shared ── */
    .pv2-eyebrow {
      display: block;
      color: ${ORANGE};
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.68rem;
      letter-spacing: 0.9px;
      margin-bottom: 6px;
    }
    .pv2-heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.3rem;
      font-weight: 800;
      color: #1a1a1a;
      margin: 0 0 16px 0;
      line-height: 1.25;
    }
    .pv2-heading-sm {
      font-size: 1rem;
      margin-bottom: 12px;
    }

    /* ── Tag cloud ── */
    .pv2-tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin-bottom: 12px;
    }
    .pv2-tag {
      display: inline-flex;
      align-items: center;
      background: #ffffff;
      color: ${ORANGE};
      border: 1.5px solid ${ORANGE};
      font-weight: 600;
      padding: 7px 16px;
      border-radius: 30px;
      font-size: 0.84rem;
      line-height: 1;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(194,81,10,0.08);
      transition: background 0.18s, color 0.18s;
      cursor: default;
    }
    .pv2-tag:hover { background: ${ORANGE}; color: #fff; }

    .pv2-svc-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 12px;
      border: 1px solid rgba(194,81,10,0.15);
      box-shadow: 0 4px 10px rgba(0,0,0,0.02);
      transition: box-shadow 0.2s;
    }
    .pv2-svc-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
    .pv2-svc-card:last-child { margin-bottom: 0; }
    .pv2-svc-title { font-weight: 700; color: #1a1a1a; font-size: 1.02rem; margin-bottom: 6px; }
    .pv2-svc-desc  { color: #555; font-size: 0.88rem; margin-bottom: 12px; line-height: 1.6; }
    .pv2-svc-pills { display: flex; flex-wrap: wrap; gap: 7px; }
    .pv2-svc-pill-subj {
      background: #f5f0ea; color: ${ORANGE}; border: 1px solid ${ORANGE};
      font-size: 0.78rem; font-weight: 500; padding: 4px 12px; border-radius: 20px;
    }
    .pv2-svc-pill-age {
      background: ${ORANGE}; color: #fff;
      font-size: 0.78rem; font-weight: 600; padding: 4px 12px; border-radius: 20px;
    }
    .pv2-svc-delivery { margin-top: 10px; font-size: 0.78rem; color: #666; }
    .pv2-svc-delivery i { color: ${ORANGE}; margin-right: 5px; }

    /* ── Age group pills ── */
    .pv2-age-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.07); }
    .pv2-age-pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .pv2-age-pill {
      display: inline-flex; align-items: center;
      background: #ffffff; color: ${ORANGE};
      border: 1.5px solid ${ORANGE}; font-weight: 600;
      padding: 6px 14px; border-radius: 28px; font-size: 0.82rem;
      box-shadow: 0 2px 6px rgba(194,81,10,0.08);
    }

    .pv2-about-text {
      color: #3a3a3a;
      line-height: 1.75;
      font-size: 0.93rem;
      margin: 0;
    }

    /* ── RIGHT CARD: Profile summary — full-width landscape banner ── */
    .pv2-right {
      order: 1;
      border-radius: 14px;
      overflow: hidden;
      position: relative;
      background-color: #1a1a1a;
      background-size: cover;
      background-position: center 20%;
      box-shadow: 0 12px 40px rgba(0,0,0,0.32);
      width: 100%;
      min-height: 420px;
    }
    .pv2-right-overlay {
      position: absolute;
      inset: 0;
      background: rgba(24,35,48,0.68);
      z-index: 0;
    }
    .pv2-right-content {
      position: relative;
      z-index: 1;
      padding: 44px 48px;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: 0;
      min-height: 420px;
    }

    /* Avatar column — left strip */
    .pv2-right-avatar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding-right: 40px;
      border-right: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
      width: 160px;
    }

    /* Info column — center, takes all remaining space */
    .pv2-right-info-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 0 44px;
    }

    /* Actions column — right strip */
    .pv2-right-actions-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: space-between;
      flex-shrink: 0;
      width: 220px;
      padding-left: 40px;
      border-left: 1px solid rgba(255,255,255,0.1);
    }

    .pv2-avatar {
      width: 130px; height: 130px;
      border-radius: 50%; object-fit: cover;
      border: 4px solid ${ORANGE};
      display: block;
      box-shadow: 0 8px 28px rgba(194,81,10,0.45);
    }
    .pv2-avatar-placeholder {
      width: 130px; height: 130px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 4px solid ${ORANGE};
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.5); font-size: 2.8rem;
      box-shadow: 0 8px 28px rgba(194,81,10,0.35);
    }
    .pv2-badges {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .pv2-badge-featured {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(85,118,145,0.28); color: #b7d5ea;
      border: 1px solid rgba(85,118,145,0.5);
      font-size: 0.78rem; font-weight: 700; padding: 5px 12px; border-radius: 20px;
      white-space: nowrap;
    }
    .pv2-badge-verified {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(16,185,129,0.2); color: #6ee7b7;
      border: 1px solid rgba(16,185,129,0.35);
      font-size: 0.78rem; font-weight: 700; padding: 5px 12px; border-radius: 20px;
      white-space: nowrap;
    }
    .pv2-name {
      font-family: 'Playfair Display', serif;
      font-size: 2.4rem; font-weight: 900; color: #fff;
      line-height: 1.1; margin: 0 0 6px;
    }
    .pv2-tagline {
      color: rgba(255,255,255,0.65);
      font-size: 1.05rem;
      font-weight: 500;
      margin-bottom: 0;
      letter-spacing: 0.2px;
    }
    .pv2-price-badge {
      display: inline-flex; align-items: center; gap: 7px;
      background: ${ORANGE}; color: #fff;
      font-size: 0.95rem; font-weight: 700; padding: 8px 18px;
      border-radius: 24px;
      box-shadow: 0 4px 14px rgba(194,81,10,0.4);
    }
    .pv2-meta-strip {
      display: flex; flex-wrap: wrap; gap: 6px 28px;
    }
    .pv2-meta-item {
      display: flex; align-items: center; gap: 9px;
      font-size: 0.95rem; color: rgba(255,255,255,0.85);
      font-weight: 500;
    }
    .pv2-meta-item i { color: ${ORANGE}; width: 16px; text-align: center; font-size: 0.9rem; }
    .pv2-rating-bar {
      display: flex; align-items: center; gap: 14px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 12px; padding: 16px 20px;
    }
    .pv2-rating-num { font-size: 2.6rem; font-weight: 800; color: ${ORANGE}; line-height: 1; }
    .pv2-rating-stars { color: ${ORANGE}; font-size: 1.1rem; letter-spacing: 2px; }
    .pv2-rating-sub { font-size: 0.8rem; color: rgba(255,255,255,0.65); margin-top: 3px; }
    .pv2-share-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 8px;
      border: 1.5px solid rgba(255,255,255,0.45); background: rgba(255,255,255,0.08);
      color: #fff; font-size: 0.88rem; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .pv2-share-btn:hover { background: rgba(255,255,255,0.2); }

    /* ── Contact accordion ── */
    .pv2-contact-accordion {
      background: rgba(0,0,0,0.5);
      border: 1.5px solid rgba(255,255,255,0.3);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 4px;
    }
    .pv2-contact-toggle {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 16px; cursor: pointer;
      font-size: 0.85rem; font-weight: 700; color: #fff;
      background: rgba(0,0,0,0.4); border: none; width: 100%;
      font-family: inherit; transition: background 0.15s;
      letter-spacing: 0.2px;
    }
    .pv2-contact-toggle:hover { background: rgba(0,0,0,0.6); }
    .pv2-contact-toggle i.arrow { transition: transform 0.2s; font-size: 0.7rem; color: rgba(255,255,255,0.7); }
    .pv2-contact-toggle i.arrow.open { transform: rotate(180deg); }
    .pv2-contact-panel { padding: 0 16px 16px; display: none; background: rgba(0,0,0,0.35); }
    .pv2-contact-panel.open { display: block; }
    .pv2-contact-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.15);
      font-size: 0.84rem;
    }
    .pv2-contact-row:last-child { border-bottom: none; padding-bottom: 0; }
    .pv2-contact-row i { color: ${ORANGE}; width: 16px; text-align: center; flex-shrink: 0; font-size: 0.9rem; }
    .pv2-contact-row-label { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: rgba(255,255,255,0.5); display: block; }
    .pv2-contact-row-val { color: #fff; font-weight: 600; font-size: 0.86rem; }
    .pv2-contact-row a { color: #fbbf7a; text-decoration: none; font-weight: 600; }
    .pv2-contact-row a:hover { text-decoration: underline; color: #fff; }
    .pv2-upgrade-note {
      background: rgba(85,118,145,0.2); border: 1px solid rgba(85,118,145,0.45);
      border-radius: 8px; padding: 12px 16px; margin-top: 4px;
      font-size: 0.8rem; color: rgba(255,255,255,0.8); text-align: center;
    }
    .pv2-upgrade-note strong { color: #b7d5ea; }

    /* ── MIDDLE ROW ── */
    .pv2-mid-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .pv2-card {
      background: #ede9e3;
      border: 1px solid #dedad4;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .pv2-card-gray {
      background: #d6d0c8;
      border: 1px solid #c8c2ba;
    }
    .pv2-qual-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .pv2-qual-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 0.88rem; color: #3a3a3a; line-height: 1.5; }
    .pv2-qual-list li i { color: ${ORANGE}; margin-top: 2px; flex-shrink: 0; }
    .pv2-avail-pills { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 10px; }
    .pv2-avail-pill {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 46px; padding: 6px 10px; border-radius: 8px;
      font-size: 0.78rem; font-weight: 600; line-height: 1;
    }
    .pv2-avail-on  { background: ${ORANGE}; color: #fff; }
    .pv2-avail-off { background: #c8c2ba; color: #999; border: 1px solid #bab4ac; }

    /* ── Reviews ── */
    .pv2-reviews { margin-bottom: 24px; }
    .pv2-review-item {
      background: #ede9e3; border-radius: 9px;
      padding: 14px 16px; margin-bottom: 10px;
      border-left: 3px solid ${ORANGE};
    }
    .pv2-review-stars { color: #f59e0b; font-size: 0.85rem; margin-bottom: 4px; }
    .pv2-review-text  { font-size: 0.86rem; color: #555; font-style: italic; }
    .pv2-review-name  { font-size: 0.74rem; color: #888; margin-top: 4px; font-weight: 600; }

    /* ── BOTTOM: Send Enquiry ── */
    .pv2-enquiry-section {
      background: #ede9e3;
      border: 1px solid #dedad4;
      border-radius: 14px;
      padding: 40px 36px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }
    .pv2-enquiry-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .pv2-enquiry-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 16px;
      align-items: end;
      margin-bottom: 16px;
    }
    .pv2-enquiry-grid-wide {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .pv2-enquiry-field { display: flex; flex-direction: column; gap: 5px; }
    .pv2-enquiry-field label {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.6px; color: #777;
    }
    .pv2-enquiry-field input,
    .pv2-enquiry-field select,
    .pv2-enquiry-field textarea {
      width: 100%; padding: 10px 13px;
      border: 1.5px solid rgba(0,0,0,0.12); border-radius: 8px;
      background: #fff; font-family: inherit; font-size: 0.88rem;
      color: #1a1a1a; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .pv2-enquiry-field input:focus,
    .pv2-enquiry-field select:focus,
    .pv2-enquiry-field textarea:focus {
      border-color: ${ORANGE};
      box-shadow: 0 0 0 3px rgba(194,81,10,0.12);
    }
    .pv2-enquiry-field textarea { resize: vertical; min-height: 78px; }
    .pv2-enquiry-send-btn {
      width: 100%; padding: 12px 20px;
      background: ${ORANGE}; color: #fff;
      border: none; border-radius: 8px;
      font-family: inherit; font-size: 0.9rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background 0.15s, transform 0.12s;
      box-shadow: 0 4px 14px rgba(194,81,10,0.3);
    }
    .pv2-enquiry-send-btn:hover { background: #a84412; transform: translateY(-1px); }
    .pv2-enquiry-footer {
      display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 4px;
    }
    .pv2-location-note {
      display: flex; align-items: center; gap: 7px;
      font-size: 0.82rem; color: #666;
    }
    .pv2-location-note i { color: ${ORANGE}; }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .pv2-enquiry-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 900px) {
      .pv2-right-content {
        flex-direction: column;
        gap: 24px;
        min-height: unset;
        padding: 32px 28px;
      }
      .pv2-right-avatar-col {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        padding-right: 0;
        border-right: none;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 20px;
        gap: 20px;
      }
      .pv2-right-info-col {
        padding: 0;
        gap: 16px;
      }
      .pv2-right-actions-col {
        align-items: flex-start;
        flex-direction: row;
        flex-wrap: wrap;
        width: 100%;
        padding-left: 0;
        border-left: none;
        border-top: 1px solid rgba(255,255,255,0.1);
        padding-top: 20px;
        gap: 12px;
      }
      .pv2-mid-row  { grid-template-columns: 1fr; }
      .pv2-enquiry-grid { grid-template-columns: 1fr 1fr; }
      .pv2-left { flex-direction: column !important; }
      .pv2-services-section { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.08) !important; }
    }
    @media (max-width: 700px) {
      .pv2-inner { padding: 16px 14px 48px; }
      .pv2-services-section { padding: 20px 18px 16px; }
      .pv2-about-section    { padding: 16px 18px 20px; }
      .pv2-card             { padding: 18px; }
      .pv2-enquiry-section  { padding: 28px 18px; }
      .pv2-enquiry-grid     { grid-template-columns: 1fr; }
      .pv2-enquiry-grid-wide { grid-template-columns: 1fr; }
      .pv2-gate-card { padding: 32px 24px; }
    }

    @media(max-width:480px){
  .pv2-inner { padding: 12px 12px 40px; }
  .pv2-name { font-size: 1.6rem; }
  .pv2-right-content { padding: 24px 18px; gap: 18px; }
  .pv2-mid-row { grid-template-columns: 1fr; }
  .pv2-enquiry-grid { grid-template-columns: 1fr; }
  .pv2-enquiry-grid-wide { grid-template-columns: 1fr; }
  .pv2-enquiry-section { padding: 24px 16px; }
}
  `;
  document.head.appendChild(style);

  if (!document.getElementById('pv2-fonts')) {
    const fonts = document.createElement('link');
    fonts.id = 'pv2-fonts'; fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(fonts);
  }
  if (!document.getElementById('pv2-fa')) {
    const fa = document.createElement('link');
    fa.id = 'pv2-fa'; fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
    document.head.appendChild(fa);
  }
};

// ── Members Only Gate Component ──
const MembersOnlyGate = () => (
  <div className="pv2-members-gate">
    <div className="pv2-gate-card">
      <div className="pv2-gate-icon">
        <i className="fas fa-lock" />
      </div>
      <h1 className="pv2-gate-title">Members Only</h1>
      <p className="pv2-gate-subtitle">
        Provider profiles are exclusively available to registered members of the SA Homeschooling Directory community.
      </p>
      <div className="pv2-gate-perks">
        <div className="pv2-gate-perk"><i className="fas fa-check-circle" /> View full provider contact details</div>
        <div className="pv2-gate-perk"><i className="fas fa-check-circle" /> Send direct enquiries to providers</div>
        <div className="pv2-gate-perk"><i className="fas fa-check-circle" /> Access qualifications &amp; credentials</div>
        <div className="pv2-gate-perk"><i className="fas fa-check-circle" /> Save favourite providers</div>
      </div>
      <div className="pv2-gate-actions">
        <Link to="/login" className="pv2-gate-btn-primary">
          <i className="fas fa-sign-in-alt" style={{ marginRight: 8 }} /> Log In to View Profile
        </Link>
        <div className="pv2-gate-divider">or</div>
        <Link to="/register" className="pv2-gate-btn-secondary">
          Create a Free Account
        </Link>
      </div>
    </div>
  </div>
);

const Profile = () => {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const fromDashboard = searchParams.get('from') === 'dashboard';

  useEffect(() => {
    try {
      // Check both storage keys used by AuthContext
      const cu = JSON.parse(
        localStorage.getItem('sah_current_user') ||
        localStorage.getItem('sah_user') ||
        'null'
      );
      setIsAuthenticated(!!cu);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    injectStyles();
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      let found = null;

      // 1. Try API by ID
      if (id) {
        try {
          found = normalizeApiProfile(await api.getProviderById(id));
        } catch (error) {
          console.warn('Profile API load failed, using local data:', error.message);
        }
      }

      // 2. Fall back to localStorage providers list
      if (!found) found = findProvider(id, email);

      // 3. Try to load the logged-in user's own profile from localStorage
      if (!found) {
        try {
          const cu = JSON.parse(
            localStorage.getItem('sah_current_user') ||
            localStorage.getItem('sah_user') ||
            'null'
          );
          if (cu?.id) {
            // Look up their saved provider data
            const stored = JSON.parse(localStorage.getItem('sah_providers') || '[]');
            const own = stored.find(p => p.id === cu.id || p.userId === cu.id);
            if (own) {
              found = normalizeApiProfile(own);
            } else {
              // Build a minimal profile from the user session itself
              found = {
                id: cu.id,
                userId: cu.id,
                name: cu.name || '',
                email: cu.email || '',
                bio: cu.bio || '',
                primaryCategory: cu.primaryCategory || cu.category || '',
                city: cu.city || '',
                province: cu.province || '',
                phone: cu.phone || '',
                contactEmail: cu.email || '',
                image: cu.profilePhoto || cu.photo || cu.image || null,
                photo: cu.profilePhoto || cu.photo || cu.image || null,
                tier: cu.plan || cu.tier || 'free',
                listingPlan: cu.plan || cu.tier || 'free',
                tags: [],
                ageGroups: [],
                availabilityDays: [],
                services: [],
                reviews: { average: 0, count: 0, items: [] },
              };
            }
          }
        } catch {}
      }

      // 4. Only fall back to seed data if explicitly viewing a seed profile by ID
      if (!found && id) {
        found = SEED_PROVIDERS.find(p => p.id === id) || null;
      }

      if (!cancelled) {
        setProfile(found);
        setLoading(false);
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [searchParams]);

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({ title: profile?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleBack = () => {
    if (fromDashboard) navigate('/client-dashboard');
    else navigate('/');
  };

  if (loading) return (
    <>
      <Header />
      <main style={{ padding: '4rem', textAlign: 'center' }}>Loading profile...</main>
      <Footer />
    </>
  );

  if (!profile) return (
    <>
      <Header />
      <main style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Profile not found</h2>
        <Link to="/">Back to Home</Link>
      </main>
      <Footer />
    </>
  );

  if (!isAuthenticated && !fromDashboard) {
    return (
      <>
        <Header />
        <main id="profilePageV2">
          <MembersOnlyGate />
        </main>
        <Footer />
      </>
    );
  }

  const tier = profile.listingPlan || profile.tier || 'free';
  const isPaid = tier === 'pro' || tier === 'featured';

  const ratingStars = (r) => {
    if (!r) return '';
    const full = Math.floor(r);
    const half = r % 1 >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  };

  return (
    <>
      {fromDashboard ? (
        <header style={{
          position: 'sticky', top: 0, zIndex: 1000,
          height: '140px', background: '#6f8da6',
          boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={handleBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.88)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit' }}>
                <i className="fas fa-arrow-left" /> Back to Dashboard
              </button>
              <span style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.28)', margin: '0 16px' }} />
              <img
                src="/parentals-logo-header.png"
                alt="Parentals"
                style={{ display: 'block', width: 230, maxWidth: '28vw', height: 124, objectFit: 'contain', objectPosition: 'left center', filter: 'drop-shadow(0 3px 12px rgba(255,138,31,0.26))' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 6, border: '1.5px solid rgba(255,255,255,0.55)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                <i className="fas fa-user-circle" /> {profile?.name || 'Provider'}
              </button>
              <button onClick={() => { localStorage.removeItem('sah_current_user'); navigate('/'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 18px', borderRadius: 6, border: 'none', background: ORANGE, color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                <i className="fas fa-right-from-bracket" /> Log Out
              </button>
            </div>
          </div>
        </header>
      ) : (
        <Header />
      )}

      <main id="profilePageV2">
        <div className="pv2-inner">

          {/* ── TOP GRID ── */}
          <div className="pv2-top-grid">

            {/* RIGHT: Profile banner — rendered first (order:1) */}
            <div
              className="pv2-right"
              style={{ backgroundImage: profile.image ? `url(${profile.image})` : 'none' }}
            >
              <div className="pv2-right-overlay" />
              <div className="pv2-right-content">

                {/* Avatar column */}
                <div className="pv2-right-avatar-col">
                  {profile.image || profile.photo
                    ? <img src={profile.image || profile.photo} alt={profile.name} className="pv2-avatar" />
                    : <div className="pv2-avatar-placeholder"><i className="fas fa-user" /></div>}
                  <div className="pv2-badges">
                    {tier === 'featured' && <span className="pv2-badge-featured"><i className="fas fa-star" /> Featured Partner</span>}
                    {isPaid && <span className="pv2-badge-verified"><i className="fas fa-check" /> Verified</span>}
                  </div>
                </div>

                {/* Info column — top: name+tagline, bottom: price+meta+rating */}
                <div className="pv2-right-info-col">
                  {/* Top: name */}
                  <div>
                    <h1 className="pv2-name">{profile.name}</h1>
                    <p className="pv2-tagline">{profile.primaryCategory || profile.category || ''}</p>
                  </div>

                  {/* Middle: price + meta */}
                  <div>
                    {profile.startingPrice && profile.startingPrice !== 'Contact' && (
                      <div className="pv2-price-badge" style={{ alignSelf: 'flex-start', marginBottom: 18 }}>
                        <i className="fas fa-tag" /> From {profile.startingPrice || profile.priceFrom}
                      </div>
                    )}
                    <div className="pv2-meta-strip">
                      <div className="pv2-meta-item">
                        <i className="fas fa-tag" />
                        <strong>{profile.primaryCategory || profile.category || 'Provider'}</strong>
                      </div>
                      <div className="pv2-meta-item">
                        <i className="fas fa-map-marker-alt" />
                        <span>{profile.city ? `${profile.city}, ${profile.province}` : profile.location || 'South Africa'}</span>
                      </div>
                      <div className="pv2-meta-item">
                        <i className="fas fa-laptop-house" />
                        <span>{profile.deliveryMode || profile.delivery || 'Online'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: rating */}
                  {isPaid && profile.reviews?.average > 0 && (
                    <div className="pv2-rating-bar">
                      <div className="pv2-rating-num">{profile.reviews.average}</div>
                      <div>
                        <div className="pv2-rating-stars">{ratingStars(profile.reviews.average)}</div>
                        <div className="pv2-rating-sub">Based on {profile.reviews.count} reviews</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions column — share at top, contact at bottom */}
                <div className="pv2-right-actions-col">
                  <button className="pv2-share-btn" onClick={shareProfile}>
                    <i className="fas fa-share-alt" /> Share Profile
                  </button>

                  {isPaid ? (
                    <button
                      className="pv2-contact-toggle"
                      onClick={() => document.getElementById('pv2-get-in-touch')?.scrollIntoView({ behavior: 'smooth' })}
                      style={{ width: '100%', borderRadius: 8 }}
                    >
                      <span><i className="fas fa-address-book" style={{ marginRight: 8, color: ORANGE }} />Contact Details</span>
                      <i className="fas fa-arrow-down" style={{ fontSize: '0.8rem' }} />
                    </button>
                  ) : (
                    <div className="pv2-upgrade-note">
                      <i className="fas fa-lock" style={{ marginRight: 6 }} />
                      Upgrade to <strong>Trusted Provider</strong> to display your contact details.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* LEFT: Services + About — side by side (order:2) */}
            <div className="pv2-left">

              {/* What We Offer */}
              <div className="pv2-services-section">
                <span className="pv2-eyebrow">What We Offer</span>
                <h2 className="pv2-heading">Our Services</h2>

                {profile.tags?.length > 0 && (
                  <div className="pv2-tag-cloud">
                    {profile.tags.map((tag, idx) => (
                      <span key={idx} className="pv2-tag">{tag}</span>
                    ))}
                  </div>
                )}

                {profile.services?.length > 0 ? (
                  <div style={{ marginTop: profile.tags?.length > 0 ? 16 : 0 }}>
                    {profile.services.map((svc, idx) => {
                      if (typeof svc === 'string') {
                        return <span key={idx} className="pv2-tag" style={{ marginRight: 8, marginBottom: 8, display: 'inline-flex' }}>{svc}</span>;
                      }
                      return (
                        <div key={idx} className="pv2-svc-card">
                          {svc.title && <div className="pv2-svc-title">{svc.title}</div>}
                          {svc.description && <div className="pv2-svc-desc">{svc.description}</div>}
                          <div className="pv2-svc-pills">
                            {svc.subjects && svc.subjects.split(',').map((s, i) => s.trim() && (
                              <span key={i} className="pv2-svc-pill-subj">{s.trim()}</span>
                            ))}
                            {(svc.ageGroups || []).map((age, i) => (
                              <span key={i} className="pv2-svc-pill-age">{age}</span>
                            ))}
                          </div>
                          {svc.deliveryMode && (
                            <div className="pv2-svc-delivery">
                              <i className="fas fa-laptop-house" />{svc.deliveryMode}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  !profile.tags?.length && (
                    <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.88rem' }}>No services listed yet.</p>
                  )
                )}

                {profile.ageGroups?.length > 0 && (
                  <div className="pv2-age-section">
                    <span className="pv2-eyebrow">Age Groups / Grades</span>
                    <div className="pv2-age-pills">
                      {profile.ageGroups.map((age, idx) => (
                        <span key={idx} className="pv2-age-pill">{age}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* About the Provider */}
              <div className="pv2-about-section">
                <span className="pv2-eyebrow">About the Provider</span>
                <h2 className="pv2-heading">About Us</h2>
                <p className="pv2-about-text">
                  {profile.bio || 'This provider has not yet added a description.'}
                </p>
              </div>

            </div>
            {/* ── end pv2-top-grid ── */}
          </div>

          {/* ── MIDDLE: Credentials + Availability ── */}
          <div className="pv2-mid-row">
            <div className="pv2-card">
              <span className="pv2-eyebrow">Credentials</span>
              <h3 className="pv2-heading pv2-heading-sm">Qualifications</h3>
              <ul className="pv2-qual-list">
                {profile.degrees        && <li><i className="fas fa-graduation-cap" />{profile.degrees}</li>}
                {profile.certifications && <li><i className="fas fa-certificate" />{profile.certifications}</li>}
                {profile.memberships    && <li><i className="fas fa-check-circle" />{profile.memberships}</li>}
                {profile.clearance      && <li><i className="fas fa-shield-alt" />{profile.clearance}</li>}
                {!profile.degrees && !profile.certifications && !profile.memberships && !profile.clearance && (
                  <li style={{ color: '#aaa', fontStyle: 'italic' }}>No qualifications listed yet.</li>
                )}
              </ul>
            </div>
            <div className="pv2-card">
              <span className="pv2-eyebrow">Schedule</span>
              <h3 className="pv2-heading pv2-heading-sm">Availability</h3>
              <div className="pv2-avail-pills">
                {DAYS_OF_WEEK.map(day => {
                  const active = (profile.availabilityDays || []).includes(day);
                  return (
                    <span key={day} className={`pv2-avail-pill ${active ? 'pv2-avail-on' : 'pv2-avail-off'}`}>
                      {day}
                    </span>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#777', margin: 0 }}>
                {profile.availabilityNotes || 'Contact for availability'}
              </p>
            </div>
          </div>

          {/* ── Reviews ── */}
          {isPaid && profile.reviews?.items?.length > 0 && (
            <div className="pv2-card pv2-card-gray pv2-reviews">
              <span className="pv2-eyebrow">Testimonials</span>
              <h3 className="pv2-heading pv2-heading-sm">Parent Reviews</h3>
              {profile.reviews.items.map((review, idx) => (
                <div key={idx} className="pv2-review-item">
                  <div className="pv2-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                  <div className="pv2-review-text">"{review.text}"</div>
                  <div className="pv2-review-name">— {review.reviewer}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── BOTTOM: Get in Touch ── */}
          <div className="pv2-enquiry-section" id="pv2-get-in-touch">
            <div className="pv2-enquiry-header">
              <h2 className="pv2-heading" style={{ textAlign: 'center', marginBottom: 8, color: '#1a1a1a', fontSize: '1.6rem' }}>Get in Touch</h2>
              <p style={{ fontSize: '0.88rem', color: '#777', textAlign: 'center' }}>
                Fill in your details below and we'll connect you with {profile.name || 'this provider'}.
              </p>
            </div>

            <div className="pv2-enquiry-grid">
              <div className="pv2-enquiry-field">
                <label>First Name</label>
                <input type="text" placeholder="Sarah" />
              </div>
              <div className="pv2-enquiry-field">
                <label>Last Name</label>
                <input type="text" placeholder="Smith" />
              </div>
              <div className="pv2-enquiry-field">
                <label>Email Address</label>
                <input type="email" placeholder="sarah@email.com" />
              </div>
              <div className="pv2-enquiry-field">
                <label>Phone Number</label>
                <input type="tel" placeholder="082 000 0000" />
              </div>
            </div>

            <div className="pv2-enquiry-grid-wide">
              <div className="pv2-enquiry-field">
                <label>Subject</label>
                <select>
                  <option>General enquiry</option>
                  <option>Pricing &amp; availability</option>
                  <option>Trial lesson / session</option>
                  <option>Curriculum question</option>
                  <option>Enrolment information</option>
                </select>
              </div>
              <div className="pv2-enquiry-field">
                <label>Message</label>
                <textarea placeholder="Hi, I'd like to know more about your services…" />
              </div>
            </div>

            <div className="pv2-enquiry-footer">
              <button
                className="pv2-enquiry-send-btn"
                style={{ width: 'auto', paddingLeft: 40, paddingRight: 40 }}
                onClick={() => alert('Enquiry sent! (Demo)')}
              >
                <i className="fas fa-paper-plane" /> Get in Touch
              </button>
              {profile.city && (
                <div className="pv2-location-note">
                  <i className="fas fa-map-marker-alt" />
                  {profile.city}, {profile.province} · {profile.serviceAreaType === 'national' ? 'National coverage' : profile.serviceAreaType === 'online' ? 'Online only' : `Local — ${profile.radius || ''} radius`}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
};

export default Profile;