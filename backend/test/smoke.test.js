/**
 * Backend smoke / security tests.  Run:  npm test
 * Uses a throw-away copy of the seed data so your real data.json is never touched.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = path.join(os.tmpdir(), `smartevent-test-${Date.now()}.json`);
process.env.SMARTEVENT_DATA_FILE = tmp;
process.env.NODE_ENV = 'test';
process.env.AT_API_KEY = ''; // force SIMULATION - never send real SMS from tests
process.env.AT_USERNAME = '';
process.env.GOOGLE_CLIENT_ID = '';
process.env.ML_SERVICE_URL = 'http://127.0.0.1:9'; // unreachable on purpose -> fallback path

const app = require('../server');

let server;
let base;
const PW = 'password123';

async function api(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (e) { /* html */ }
  return { status: res.status, json, res };
}
const login = async (email) => (await api('POST', '/api/auth/login', { body: { email, password: PW } })).json.token;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => {
  server.close();
  try { fs.unlinkSync(tmp); } catch (e) { /* ignore */ }
});

// ------------------------------------------------------------------ AUTH
test('seed data: 2 admins, 10 organizers, 10 students, lowercase roles', async () => {
  const t = await login('admin@strathmore.edu');
  const { json } = await api('GET', '/api/admin/overview', { token: t });
  assert.equal(json.data.summary.totals.admins, 2);
  assert.equal(json.data.summary.totals.organizers, 10);
  assert.equal(json.data.summary.totals.students, 10);
});

test('login rejects wrong password, unknown email and wrong role', async () => {
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'student@strathmore.edu', password: 'nope1234' } })).status, 401);
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'ghost@strathmore.edu', password: PW } })).status, 401);
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'student@strathmore.edu', password: PW, role: 'admin' } })).status, 403);
  const ok = await api('POST', '/api/auth/login', { body: { email: 'student@strathmore.edu', password: PW, role: 'student' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.user.passwordHash, undefined);
});

test('login locks after 5 failed attempts', async () => {
  for (let i = 0; i < 5; i++) await api('POST', '/api/auth/login', { body: { email: 'faith.mutua@strathmore.edu', password: 'wrong-pass1' } });
  const locked = await api('POST', '/api/auth/login', { body: { email: 'faith.mutua@strathmore.edu', password: PW } });
  assert.equal(locked.status, 429);
});

test('signup: admin blocked, weak password blocked, bad phone blocked, student created', async () => {
  const base1 = { name: 'Test User', email: 'tester1@strathmore.edu', password: 'GoodPass1', phone: '0712000111', studentId: '160001' };
  assert.equal((await api('POST', '/api/auth/signup', { body: { ...base1, role: 'admin' } })).status, 403);
  assert.equal((await api('POST', '/api/auth/signup', { body: { ...base1, role: 'student', password: 'short' } })).status, 400);
  assert.equal((await api('POST', '/api/auth/signup', { body: { ...base1, role: 'student', phone: '123' } })).status, 400);
  const ok = await api('POST', '/api/auth/signup', { body: { ...base1, role: 'student' } });
  assert.equal(ok.status, 201);
  assert.equal(ok.json.user.phone, '+254712000111');
  assert.equal((await api('POST', '/api/auth/signup', { body: { ...base1, role: 'student' } })).status, 409);
});

test('google sign-in cannot be forged with a fake credential or without the password', async () => {
  const fake = Buffer.from(JSON.stringify({ email: 'admin@strathmore.edu', sub: '1' })).toString('base64');
  const r1 = await api('POST', '/api/auth/google', { body: { credential: `x.${fake}.y` } });
  assert.notEqual(r1.status, 200);
  const r2 = await api('POST', '/api/auth/google', { body: { email: 'admin@strathmore.edu' } });
  assert.notEqual(r2.status, 200);
  assert.equal(r2.json.token, undefined);
});

test('expired / garbage tokens are treated as anonymous', async () => {
  assert.equal((await api('GET', '/api/auth/me', { token: 'garbage.token.here' })).status, 401);
});

// ------------------------------------------------------------------ DATA EXPOSURE
test('anonymous users cannot read registrations, sms logs, user lists or send SMS', async () => {
  for (const [m, u] of [['GET', '/api/registrations'], ['GET', '/api/sms/logs'], ['GET', '/api/users'], ['GET', '/api/auth/users'], ['GET', '/api/analytics'], ['GET', '/api/admin/overview'], ['GET', '/api/notifications'], ['GET', '/api/favorites']]) {
    assert.equal((await api(m, u)).status, 401, `${m} ${u}`);
  }
  assert.equal((await api('POST', '/api/sms/send', { body: { message: 'spam', phoneNumbers: ['0712345678'] } })).status, 401);
  assert.equal((await api('GET', '/api/db')).status, 404);
});

test('console page shows no data to anonymous or non-admin visitors', async () => {
  const anon = await fetch(base + '/');
  const html = await anon.text();
  assert.match(html, /Admin Console/);
  assert.doesNotMatch(html, /@strathmore\.edu</);
  assert.ok(anon.headers.get('content-security-policy'));
  const t = await login('student@strathmore.edu');
  const res = await fetch(base + '/', { headers: { Authorization: `Bearer ${t}` } });
  assert.equal(res.status, 403);
});

test('roles cannot reach other roles\' endpoints', async () => {
  const stud = await login('amina.hassan@strathmore.edu');
  const org = await login('organizer@strathmore.edu');
  assert.equal((await api('GET', '/api/users', { token: stud })).status, 403);
  assert.equal((await api('GET', '/api/users', { token: org })).status, 403);
  assert.equal((await api('GET', '/api/admin/overview', { token: org })).status, 403);
  assert.equal((await api('POST', '/api/sms/send', { token: stud, body: { message: 'hi', eventId: 'evt-101' } })).status, 403);
  assert.equal((await api('POST', '/api/categories', { token: org, body: { name: 'Hack' } })).status, 403);
  assert.equal((await api('POST', '/api/events', { token: stud, body: {} })).status, 403);
});

// ------------------------------------------------------------------ EVENTS
test('events are public; organizers can only change their own and cannot mass-assign', async () => {
  const pub = await api('GET', '/api/events');
  assert.equal(pub.status, 200);
  assert.equal(pub.json.count, 16);

  const orgA = await login('organizer@strathmore.edu'); // owns evt-101
  const orgB = await login('ilab@strathmore.edu');
  assert.equal((await api('PUT', '/api/events/evt-101', { token: orgB, body: { title: 'Hijacked' } })).status, 403);
  assert.equal((await api('DELETE', '/api/events/evt-101', { token: orgB })).status, 403);
  assert.equal((await api('GET', '/api/events/evt-101/attendees', { token: orgB })).status, 403);
  assert.equal((await api('GET', '/api/events/evt-101/attendees', { token: orgA })).status, 200);

  const upd = await api('PUT', '/api/events/evt-101', { token: orgA, body: { title: 'AI & ML Colloquium 2026', organizerId: 'usr-org-9', registrationCount: 1 } });
  assert.equal(upd.status, 200);
  assert.equal(upd.json.data.organizerId, 'usr-org-1');
  assert.equal(upd.json.data.registrationCount, 412);
});

test('event validation: bad date / capacity / category rejected, valid event created and owned', async () => {
  const org = await login('sports@strathmore.edu');
  const good = { title: 'Friday Fitness Run', category: 'Sports', date: '2099-01-15', time: '07:00 - 09:00', venue: 'Main Pitch', venueCapacity: 50 };
  assert.equal((await api('POST', '/api/events', { token: org, body: { ...good, date: '15-01-2099' } })).status, 400);
  assert.equal((await api('POST', '/api/events', { token: org, body: { ...good, date: '2001-01-01' } })).status, 400);
  assert.equal((await api('POST', '/api/events', { token: org, body: { ...good, venueCapacity: -4 } })).status, 400);
  assert.equal((await api('POST', '/api/events', { token: org, body: { ...good, category: 'Nonsense' } })).status, 400);
  const ok = await api('POST', '/api/events', { token: org, body: good });
  assert.equal(ok.status, 201);
  assert.equal(ok.json.data.organizerId, 'usr-org-4');
  assert.equal(ok.json.data.timeSlot, 'Morning');
});

// ------------------------------------------------------------------ REGISTRATIONS
test('student registration: capacity, duplicates, cancel, organizer/admin cannot register', async () => {
  const stud = await login('david.njoroge@strathmore.edu');
  const org = await login('sports@strathmore.edu');
  const created = await api('POST', '/api/events', { token: org, body: { title: 'Tiny Workshop', category: 'Workshop', date: '2099-02-01', venue: 'Room 1', venueCapacity: 1 } });
  const id = created.json.data.id;

  assert.equal((await api('POST', '/api/registrations', { token: org, body: { eventId: id } })).status, 403);
  const r1 = await api('POST', '/api/registrations', { token: stud, body: { eventId: id } });
  assert.equal(r1.status, 201);
  assert.equal((await api('POST', '/api/registrations', { token: stud, body: { eventId: id } })).status, 409);

  const other = await login('cynthia.chebet@strathmore.edu');
  const full = await api('POST', '/api/registrations', { token: other, body: { eventId: id } });
  assert.equal(full.status, 409); // fully booked

  // another student cannot cancel it by id
  assert.equal((await api('DELETE', `/api/registrations/${r1.json.data.id}`, { token: other })).status, 403);
  assert.equal((await api('DELETE', `/api/registrations/event/${id}`, { token: stud })).status, 200);
  const ev = await api('GET', `/api/events/${id}`);
  assert.equal(ev.json.data.registrationCount, 0);
});

test('registrations are role-scoped', async () => {
  const stud = await login('student@strathmore.edu');
  const mine = await api('GET', '/api/registrations', { token: stud });
  assert.ok(mine.json.data.every((r) => r.userId === 'usr-stud-1'));
  const org = await login('careers@strathmore.edu');
  const orgRegs = await api('GET', '/api/registrations', { token: org });
  assert.ok(orgRegs.json.data.every((r) => ['evt-105', 'evt-106'].includes(r.eventId)));
});

// ------------------------------------------------------------------ SMS
test('SMS: organizer limited to own events; simulation mode is honest; logs are scoped', async () => {
  const orgA = await login('organizer@strathmore.edu'); // owns evt-101 (has registrations)
  const orgB = await login('ilab@strathmore.edu');

  assert.equal((await api('POST', '/api/sms/send', { token: orgB, body: { eventId: 'evt-101', message: 'x', priority: 'HIGH' } })).status, 403);
  assert.equal((await api('POST', '/api/sms/send', { token: orgA, body: { eventId: 'evt-101', message: '' } })).status, 400);
  assert.equal((await api('POST', '/api/sms/send', { token: orgA, body: { eventId: 'evt-101', message: 'x', priority: 'URGENT' } })).status, 400);
  // organizers cannot target arbitrary numbers
  const arbitrary = await api('POST', '/api/sms/send', { token: orgA, body: { message: 'x', phoneNumbers: ['0711111111'] } });
  assert.equal(arbitrary.status, 400);

  const sent = await api('POST', '/api/sms/send', { token: orgA, body: { eventId: 'evt-101', message: 'Venue unchanged. See you at 2pm.', priority: 'HIGH' } });
  assert.equal(sent.status, 200);
  assert.equal(sent.json.mode, 'SIMULATION');
  assert.match(sent.json.message, /NOT sent/i);
  assert.ok(sent.json.dispatchedCount >= 3);
  assert.ok(sent.json.logs.every((l) => l.status === 'SIMULATED'));

  // organizer B cannot see organizer A's logs; student only sees own
  const logsB = await api('GET', '/api/sms/logs', { token: orgB });
  assert.ok(logsB.json.data.every((l) => ['evt-103', 'evt-104'].includes(l.eventId)));
  const stud = await login('student@strathmore.edu');
  const logsS = await api('GET', '/api/sms/logs', { token: stud });
  assert.ok(logsS.json.count >= 1);
});

test('SMS: admin can send to explicit numbers; invalid numbers reported; opt-out respected', async () => {
  const admin = await login('admin@strathmore.edu');
  const res = await api('POST', '/api/sms/send', { token: admin, body: { message: 'Test', priority: 'LOW', phoneNumbers: '0712345678, 12345, +254722112233' } });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json.invalidNumbers, ['12345']);
  assert.equal(res.json.dispatchedCount, 2);

  const stud = await login('amina.hassan@strathmore.edu');
  const me = await api('GET', '/api/auth/me', { token: stud });
  await api('PUT', `/api/users/${me.json.user.id}`, { token: stud, body: { smsOptOut: true } });
});

test('SMS delivery callback requires the secret in production and updates status', async () => {
  const admin = await login('admin@strathmore.edu');
  const sent = await api('POST', '/api/sms/send', { token: admin, body: { message: 'cb', phoneNumbers: ['0712345678'] } });
  const messageId = sent.json.logs[0].messageId;
  const res = await fetch(base + '/api/sms/delivery-callback', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `id=${messageId}&status=Success` });
  assert.equal(res.status, 200);
  const logs = await api('GET', '/api/sms/logs', { token: admin });
  assert.equal(logs.json.data.find((l) => l.messageId === messageId).status, 'DELIVERED');
});

// ------------------------------------------------------------------ ADMIN
test('admin user management: protections for last admin and self', async () => {
  const admin = await login('admin@strathmore.edu');
  const me = (await api('GET', '/api/auth/me', { token: admin })).json.user;
  assert.equal((await api('DELETE', `/api/users/${me.id}`, { token: admin })).status, 400);

  const created = await api('POST', '/api/users', { token: admin, body: { name: 'New Org', email: 'neworg@strathmore.edu', password: 'Orgpass123', role: 'organizer', phone: '0733000111' } });
  assert.equal(created.status, 201);
  assert.match(created.json.data.organizerCode, /^ORG-\d{3}$/);
  const del = await api('DELETE', `/api/users/${created.json.data.id}`, { token: admin });
  assert.equal(del.status, 200);

  // admin demoting the other admin is fine, demoting the last one is not
  const other = (await api('GET', '/api/users?role=admin', { token: admin })).json.data.find((u) => u.id !== me.id);
  assert.equal((await api('PUT', `/api/users/${other.id}`, { token: admin, body: { role: 'student' } })).status, 200);
  assert.equal((await api('PUT', `/api/users/${me.id}`, { token: admin, body: { role: 'student' } })).status, 400);
});

test('categories: admin only, unique, blocked deletion while in use, counts are live', async () => {
  const admin = await login('admin@strathmore.edu');
  const cats = await api('GET', '/api/categories');
  assert.ok(cats.json.data.every((c) => typeof c.count === 'number'));
  assert.equal((await api('POST', '/api/categories', { token: admin, body: { name: 'academic' } })).status, 409);
  assert.equal((await api('DELETE', `/api/categories/${cats.json.data.find((c) => c.name === 'Academic').id}`, { token: admin })).status, 409);
  const mk = await api('POST', '/api/categories', { token: admin, body: { name: 'Debate' } });
  assert.equal(mk.status, 201);
  assert.equal((await api('DELETE', `/api/categories/${mk.json.data.id}`, { token: admin })).status, 200);
});

test('predict falls back gracefully when the ML service is offline', async () => {
  const { status, json } = await api('POST', '/api/predict', { body: { eventId: 'evt-101' } });
  assert.equal(status, 200);
  assert.equal(json.source, 'fallback');
  assert.ok(json.predictedAttendance > 0);
});
