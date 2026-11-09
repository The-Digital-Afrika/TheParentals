import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAccountSession, accountDashboard } from '../src/utils/accountRole.mjs';

test('legacy registration sessions reach the provider dashboard instead of looping', () => {
  const session = normalizeAccountSession({ id: 'new-provider', role: 'client' });
  assert.equal(session.role, 'PROVIDER');
  assert.equal(session.id, 'new-provider');
  assert.equal(accountDashboard(session.role), '/provider-dashboard');
});

test('members and admins retain their dashboards; unknown roles return to login', () => {
  assert.equal(accountDashboard(normalizeAccountSession({ role: 'user' }).role), '/client-dashboard');
  assert.equal(accountDashboard(normalizeAccountSession({ role: 'ADMIN' }).role), '/admin-dashboard');
  assert.equal(accountDashboard('UNKNOWN'), '/login');
});
