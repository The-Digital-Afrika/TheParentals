export const savedBusinessKey = id => `parentals_saved_businesses_${id}`;
export function readSavedBusinesses(id) {
  try { return JSON.parse(localStorage.getItem(savedBusinessKey(id)) || '[]'); } catch { return []; }
}
export function toggleSavedBusiness(userId, business) {
  const saved = readSavedBusinesses(userId);
  const next = saved.some(p => p.id === business.id) ? saved.filter(p => p.id !== business.id)
    : [{ id: business.id, name: business.name, location: business.location }, ...saved].slice(0, 100);
  localStorage.setItem(savedBusinessKey(userId), JSON.stringify(next));
  window.dispatchEvent(new Event('parentals-saved-change'));
  return next;
}
