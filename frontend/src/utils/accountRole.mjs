// Older provider registrations stored "client" as their session role.
export function normalizeAccountSession(session) {
  if (!session) return session;
  const role = String(session.role || '').toUpperCase();
  return { ...session, role: role === 'CLIENT' ? 'PROVIDER' : role };
}

export function accountDashboard(role) {
  return { ADMIN: '/admin-dashboard', PROVIDER: '/provider-dashboard', USER: '/client-dashboard' }[role] || '/login';
}
