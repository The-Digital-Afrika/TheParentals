const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { build } = require('esbuild');
const Module = require('node:module');
const path = require('node:path');

test('admin buttons save approval, show errors, and require a visible rejection reason', async () => {
  const dom = new JSDOM('<html><head></head><body></body></html>', { url: 'http://localhost:3000' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.localStorage = dom.window.localStorage;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const React = require('react');
  const { render, fireEvent, screen, waitFor, cleanup, within } = require('@testing-library/react');
  const { MemoryRouter } = require('react-router-dom');
  const rows = ['Complete provider', 'Incomplete provider', 'Reject provider'].map((name, i) => ({
    id: `user${i}`, userId: `user${i}`, name, status: 'pending', email: 'test@example.invalid',
  }));
  const calls = [];
  global.__adminTest = {
    user: { id: 'admin', role: 'ADMIN', token: 'test-token' },
    notify() {},
    api: {
      getProviders: async () => rows,
      getUsers: async () => ({ data: [] }),
      getReviews: async () => [],
      getFeaturedSlots: async () => [],
      updateProviderStatus: async (id, status, token, reason) => {
        calls.push({ id, status, reason });
        if (id === 'user1') throw new Error('Complete the provider profile before publishing: Service areas.');
        return { profile: { ...rows.find(row => row.id === id), status: status.toLowerCase(), publicDisplay: status === 'APPROVED' }, notificationStatus: 'PENDING' };
      },
    },
  };
  const result = await build({
    entryPoints: [path.join(__dirname, '../src/pages/AdminDashboard.js')],
    bundle: true, write: false, platform: 'node', format: 'cjs', loader: { '.js': 'jsx', '.css': 'empty' },
    external: ['react', 'react-dom', 'react-router-dom'],
    plugins: [{ name: 'test-boundaries', setup(builder) {
      builder.onResolve({ filter: /contexts\/(AuthContext|NotificationContext)$|services\/api$/ }, args => ({ path: args.path, namespace: 'mock' }));
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents:
        args.path.includes('AuthContext') ? 'export const useAuth=()=>({user:globalThis.__adminTest.user});' :
        args.path.includes('NotificationContext') ? 'export const useNotification=()=>({showNotification:globalThis.__adminTest.notify});' :
        'export const api=globalThis.__adminTest.api;', loader: 'js' }));
      builder.onResolve({ filter: /components\/common\/(Header|Footer)$/ }, args => ({ path: args.path, namespace: 'layout' }));
      builder.onLoad({ filter: /.*/, namespace: 'layout' }, () => ({ contents: 'export default ()=>null;', loader: 'js' }));
    } }],
  });
  const compiled = new Module(path.join(__dirname, 'admin-ui-bundle.cjs'), module);
  compiled.filename = path.join(__dirname, 'admin-ui-bundle.cjs');
  compiled.paths = module.paths;
  compiled._compile(result.outputFiles[0].text, compiled.filename);
  const Dashboard = compiled.exports.default;
  try {
    render(React.createElement(MemoryRouter, null, React.createElement(Dashboard)));
    await screen.findByText('Complete provider');
    // Layout is asserted on the portal itself; avoid jsdom evaluating the large
    // dashboard stylesheet for every accessibility query.
    document.head.querySelectorAll('style').forEach(style => style.remove());
    fireEvent.click(screen.getByRole('tab', { name: /Approvals/ }));
    const row = name => screen.getByText(name).closest('.adm-expand-row');
    fireEvent.click(within(row('Complete provider')).getByRole('button', { name: 'Approve' }));
    await screen.findByText(/Provider approved and published/);
    assert.ok(screen.queryByText('Complete provider') === null, 'approved row leaves the pending list');
    fireEvent.click(within(row('Incomplete provider')).getByRole('button', { name: 'Approve' }));
    await screen.findByRole('alert');
    assert.match(screen.getByRole('alert').textContent, /Service areas/);
    assert.ok(row('Incomplete provider'));
    fireEvent.click(within(row('Reject provider')).getByRole('button', { name: 'Reject' }));
    const dialog = screen.getByRole('dialog', { name: 'Reject provider application' });
    assert.ok(dialog.parentElement.parentElement === document.body, 'dialog is portalled directly to the body');
    assert.equal(dialog.parentElement.style.position, 'fixed');
    const confirm = within(dialog).getByRole('button', { name: 'Reject & Notify Provider' });
    assert.equal(confirm.disabled, true);
    const reason = within(dialog).getByLabelText('Reason for rejection');
    fireEvent.change(reason, { target: { value: 'Please upload qualification documents.' } });
    assert.equal(confirm.disabled, false);
    fireEvent.click(confirm);
    await waitFor(() => assert.ok(screen.queryByRole('dialog') === null, 'dialog closes after saving'));
    assert.ok(screen.queryByText('Reject provider') === null, 'rejected row leaves the pending list');
    assert.deepEqual(calls.at(-1), { id: 'user2', status: 'REJECTED', reason: 'Please upload qualification documents.' });
    await screen.findByText(/Provider rejected and hidden/);
  } finally {
    cleanup();
    delete global.__adminTest;
    dom.window.close();
  }
});
