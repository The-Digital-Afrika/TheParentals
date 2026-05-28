// frontend/src/utils/helpers.js
export const getMultiSelectValues = (select) => {
  return Array.from(select.options).filter(o => o.selected).map(o => o.value);
};

export const setMultiSelectValues = (select, values) => {
  if (!select) return;
  Array.from(select.options).forEach(o => {
    o.selected = values.includes(o.value);
  });
};

export const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const getPlanLimits = (plan) => {
  const limits = {
    free: { maxServices: 1, maxTags: 10 },
    pro: { maxServices: 5, maxTags: 20 },
    featured: { maxServices: 10, maxTags: 30 }
  };
  return limits[plan] || limits.free;
};

export const formatPrice = (price, plan) => {
  if (plan === 'free') return 'R0';
  if (plan === 'pro') return 'R149';
  if (plan === 'featured') return 'R399';
  return price;
};

export const getPlanName = (plan) => {
  const names = {
    free: 'Community Member',
    pro: 'Trusted Provider',
    featured: 'Featured Partner'
  };
  return names[plan] || 'Community Member';
};