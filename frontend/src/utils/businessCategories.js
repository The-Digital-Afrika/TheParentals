import categories from '../../../backend/src/businessCategories.json';

export const BUSINESS_CATEGORIES = categories;
export const CATEGORY_LABELS = categories.map(category => category.label);
export const findBusinessCategory = value => categories.find(category =>
  [category.id, category.label, ...category.aliases].some(label => label.toLowerCase() === String(value || '').trim().toLowerCase()));
export const categoryLabel = value => (findBusinessCategory(value) || categories[categories.length - 1]).label;
