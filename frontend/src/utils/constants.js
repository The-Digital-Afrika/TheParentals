// frontend/src/utils/constants.js
export const PLAN_LIMITS = {
  free: { maxServices: 1, price: 0, name: 'Community Member' },
  pro: { maxServices: 5, price: 149, name: 'Trusted Provider' },
  featured: { maxServices: 10, price: 399, name: 'Featured Partner' }
};

export const LANGUAGES = [
  'Afrikaans', 'English', 'isiNdebele', 'isiXhosa', 'isiZulu',
  'Sesotho', 'Sesotho sa Leboa', 'Setswana', 'siSwati', 'Tshivenda', 'Xitsonga'
];

export const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

export const AGE_GROUPS = ['5–7 years', '8–10 years', '11–13 years', '14–18 years'];

export const DELIVERY_MODES = ['Online', 'In Person', 'Hybrid'];

export const PRICING_MODELS = ['Hourly', 'Per package', 'Per term', 'Custom quote'];

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const providerData = {
  khan: {
    id: 'khan',
    name: 'Khan Academy SA',
    email: 'contact@khanacademy.org.za',
    accountType: 'Organization / Company',
    yearsExperience: '10+ Years',
    languages: ['English', 'Afrikaans', 'isiXhosa', 'isiZulu'],
    primaryCategory: 'Curriculum Provider',
    tags: ['mathematics', 'science', 'online learning', 'free curriculum', 'video lessons'],
    bio: 'Free world-class education for anyone anywhere. Our curriculum covers mathematics, science, computing, humanities and more across South Africa. Completely free, forever.',
    certifications: 'Khan Academy Certified Content Provider, Google for Education Partner',
    degrees: 'BSc Computer Science (Stanford), MEd (Harvard)',
    memberships: 'SA Curriculum Association, Digital Learning Collective',
    clearance: 'Verified (2025)',
    serviceTitle: 'Math & Science Curriculum (Gr R–12)',
    ageGroups: ['5–7 years', '8–10 years', '11–13 years', '14–18 years'],
    deliveryMode: 'Online',
    province: 'Gauteng',
    city: 'Johannesburg',
    serviceArea: 'National',
    radius: '',
    pricingModel: 'Custom quote',
    startingPrice: 'Free',
    availabilityDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availabilityNotes: '24/7 Online — self-paced learning available anytime',
    contactName: 'Support Team',
    phone: '+27 11 555 1234',
    contactEmail: 'support@khanacademy.org.za',
    social: '@khanacademySA · www.khanacademy.org.za · FB, Twitter, YouTube',
    listingPlan: 'free',
    publicDisplay: true,
    reviews: {
      average: 4.9,
      count: 156,
      items: [
        { reviewer: 'Sarah J.', rating: 5, text: 'Excellent resource for our homeschool curriculum.' },
        { reviewer: 'Thabo M.', rating: 5, text: 'My kids love the math challenges.' }
      ]
    }
  },
  therapy: {
    id: 'therapy',
    name: 'Therapy4Learning',
    email: 'info@therapy4learning.co.za',
    accountType: 'Individual Provider',
    yearsExperience: '5–10 Years',
    languages: ['English', 'Afrikaans'],
    primaryCategory: 'Therapist',
    tags: ['occupational therapy', 'sensory integration', 'child development'],
    bio: 'Pediatric occupational therapy services for children with learning difficulties.',
    certifications: 'HPCSA, OT Reg',
    degrees: 'MSc Occupational Therapy',
    memberships: 'OTASA',
    clearance: 'Verified (2025)',
    serviceTitle: 'Pediatric OT Assessment & Therapy',
    ageGroups: ['5–7 years', '8–10 years', '11–13 years'],
    deliveryMode: 'In Person',
    province: 'Western Cape',
    city: 'Cape Town',
    serviceArea: 'Local',
    radius: '15',
    pricingModel: 'Hourly / Per package',
    startingPrice: 'R450/hr',
    availabilityDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availabilityNotes: 'Mon–Fri 9am–5pm',
    contactName: 'Dr Sarah Khumalo',
    phone: '+27 21 555 9876',
    contactEmail: 'drsarah@therapy4learning.co.za',
    social: '@therapy4learning · www.therapy4learning.co.za',
    listingPlan: 'pro',
    publicDisplay: true,
    reviews: {
      average: 4.7,
      count: 18,
      items: [
        { reviewer: 'Thabo M.', rating: 4, text: 'Great occupational therapist, very good with children.' }
      ]
    }
  },
  creative: {
    id: 'creative',
    name: 'Creative Arts Studio',
    email: 'hello@creativeartsstudio.co.za',
    accountType: 'Organization / Company',
    yearsExperience: '3–5 Years',
    languages: ['English', 'Afrikaans', 'isiXhosa'],
    primaryCategory: 'Extracurricular Activities',
    tags: ['art', 'music', 'drama', 'creative expression'],
    bio: 'After-school arts program fostering creativity through painting, music, and drama.',
    certifications: 'Arts Education Certification',
    degrees: 'BA Fine Arts, Dip Music',
    memberships: 'SA Arts Education Association',
    clearance: 'Pending',
    serviceTitle: 'After-school Creative Arts Program',
    ageGroups: ['5–7 years', '8–10 years', '11–13 years'],
    deliveryMode: 'In Person',
    province: 'Gauteng',
    city: 'Pretoria',
    serviceArea: 'Local',
    radius: '10',
    pricingModel: 'Per term',
    startingPrice: 'R1,200/term',
    availabilityDays: ['Mon', 'Tue', 'Wed', 'Thu'],
    availabilityNotes: 'Mon–Thu 14:00–17:00',
    contactName: 'Lisa van Wyk',
    phone: '+27 12 345 6789',
    contactEmail: 'lisa@creativeartsstudio.co.za',
    social: '@creativeartspta · www.creativeartsstudio.co.za',
    listingPlan: 'free',
    publicDisplay: true,
    reviews: {
      average: 3.5,
      count: 4,
      items: []
    }
  },
  bright: {
    id: 'bright',
    name: 'Bright Minds Tutoring',
    email: 'hello@brightminds.co.za',
    accountType: 'Organization / Company',
    yearsExperience: '10+ Years',
    languages: ['English', 'Afrikaans', 'isiXhosa'],
    primaryCategory: 'Tutor (Math & Science)',
    tags: ['mathematics', 'tutoring', 'grade 8–12'],
    bio: 'Specialised Maths & Science tutoring for grades 8–12. Small groups & individual support. Certified educators with 10+ years experience.',
    certifications: 'PGCE, TEFL, Maths Specialist',
    degrees: 'BSc Mathematics, MEd',
    memberships: 'SACE, SAALT, IEB Affiliate',
    clearance: 'Verified (2025)',
    serviceTitle: 'Math & Science Mentor (Gr 8–12)',
    ageGroups: ['14–18 years'],
    deliveryMode: 'Online & In-Person',
    province: 'Gauteng',
    city: 'Johannesburg',
    serviceArea: 'Local, National online',
    radius: '30',
    pricingModel: 'Hourly / Per package',
    startingPrice: 'R280/hr | R1,500/5 sessions',
    availabilityDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availabilityNotes: 'Mon–Fri 14:00–18:00, Sat 09:00–13:00',
    contactName: 'Maria van der Merwe',
    phone: '+27 82 555 1234',
    contactEmail: 'maria@brightminds.co.za',
    social: '@brightminds_tutoring · www.brightminds.co.za',
    listingPlan: 'featured',
    publicDisplay: true,
    reviews: {
      average: 4.8,
      count: 12,
      items: [
        { reviewer: 'Sarah J.', rating: 5, text: 'Bright Minds transformed my daughter\'s confidence in maths.' },
        { reviewer: 'Thabo M.', rating: 4, text: 'Excellent science tutor, very patient and knowledgeable.' }
      ]
    }
  },
  edu: {
    id: 'edu',
    name: 'EduConsult Pro',
    email: 'info@educonsultpro.co.za',
    accountType: 'Individual Provider',
    yearsExperience: '5–10 Years',
    languages: ['English', 'Afrikaans'],
    primaryCategory: 'Educational Consultant',
    tags: ['curriculum advice', 'school placement', 'learning support'],
    bio: 'Independent educational consultancy helping families choose the right curriculum and schools.',
    certifications: 'Educational Consulting Certification',
    degrees: 'MEd, BEd',
    memberships: 'SAERA, IACAC',
    clearance: 'Verified (2024)',
    serviceTitle: 'Homeschool Curriculum Consulting',
    ageGroups: ['All ages'],
    deliveryMode: 'Online, In Person',
    province: 'Western Cape',
    city: 'Cape Town',
    serviceArea: 'National',
    radius: '',
    pricingModel: 'Hourly, Per package',
    startingPrice: 'R500/hr',
    availabilityDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availabilityNotes: 'Mon–Fri 9am–5pm, Sat by appt',
    contactName: 'Dr James Ndlovu',
    phone: '+27 21 555 4321',
    contactEmail: 'james@educonsultpro.co.za',
    social: '@educonsultpro · www.educonsultpro.co.za',
    listingPlan: 'pro',
    publicDisplay: true,
    reviews: {
      average: 4.9,
      count: 24,
      items: [
        { reviewer: 'Linda van Wyk', rating: 5, text: 'James helped us choose the perfect curriculum for our son.' }
      ]
    }
  }
};

export const featuredSlotsMock = [
  { id: 1, provider: 'Bright Minds Tutoring', addedDaysAgo: 2, daysRemaining: 5 },
  { id: 2, provider: 'Math Wizards', addedDaysAgo: 5, daysRemaining: 2 },
  { id: 3, provider: 'Bio Explorers', addedDaysAgo: 1, daysRemaining: 6 },
  { id: 4, provider: null, addedDaysAgo: 0, daysRemaining: 0 }
];

export const reviewsMock = [
  {
    id: 'review1',
    provider: 'Bright Minds Tutoring',
    rating: 5,
    text: 'My daughter has improved so much in maths! The tutor is patient and explains concepts clearly. Highly recommend!',
    reviewer: 'Sarah J.',
    daysAgo: 2,
    status: 'pending'
  },
  {
    id: 'review2',
    provider: 'Therapy4Learning',
    rating: 4,
    text: 'Great occupational therapist, very good with children. The sessions are engaging and helpful. Would recommend.',
    reviewer: 'Thabo M.',
    daysAgo: 3,
    status: 'pending'
  },
  {
    id: 'review3',
    provider: 'EduConsult Pro',
    rating: 5,
    text: 'James helped us choose the perfect curriculum for our son. His advice was invaluable and saved us so much time.',
    reviewer: 'Linda van Wyk',
    daysAgo: 1,
    status: 'pending'
  }
];

export const providersList = [
  {
    id: 'pending1',
    name: 'Khan Academy SA',
    avatar: 'KM',
    category: 'curriculum provider',
    status: 'pending',
    missing: 'service area, languages'
  },
  {
    id: 'pending2',
    name: 'Therapy4Learning',
    avatar: 'TL',
    category: 'therapist',
    status: 'pending',
    missing: 'qualifications, bio'
  },
  {
    id: 'pending3',
    name: 'Creative Arts Studio',
    avatar: 'CA',
    category: 'extracurricular',
    status: 'pending',
    missing: 'availability, pricing'
  },
  {
    id: 'bright',
    name: 'Bright Minds Tutoring',
    avatar: 'BT',
    category: 'tutor',
    status: 'approved',
    badge: 'featured',
    tier: 'featured'
  },
  {
    id: 'edu',
    name: 'EduConsult Pro',
    avatar: 'EC',
    category: 'consultant',
    status: 'approved',
    badge: 'trusted',
    tier: 'pro'
  }
];