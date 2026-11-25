import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { google } from 'googleapis';

const TABS = ['Users', 'Classes', 'Students', 'Payments'] as const;
type Tab = (typeof TABS)[number];
const COLUMNS: Record<Tab, string[]> = {
  Users: ['uid','displayName','email','schoolName','defaultCurrency'],
  Classes: ['name','schedule','feeAmount','currency','billingCycle','isActive'],
  Students: ['studentCode','fullName','gender','parentPhone','classId','className','monthlyFee','currency','dueDay','status','notes'],
  Payments: ['receiptNo','studentId','studentName','classId','className','billingMonth','amountPaid','expectedAmount','currency','method','paymentStatus','paidDate','note'],
};
const headersFor = (tab: Tab) => ['id','ownerId',...COLUMNS[tab],'createdAt','updatedAt'];
const columnLetter = (n: number) => { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };

function getFirebaseAdmin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return getAuth();
}
function getSheets() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return google.sheets({ version: 'v4', auth });
}
function spreadsheetId() {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) throw new Error('Missing GOOGLE_SHEETS_ID');
  return id;
}
let setupPromise: Promise<any> | null = null;
async function ensureTabs() {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
  const sheets = getSheets();
  const sid = spreadsheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sid });
  const existing = new Set((meta.data.sheets || []).map((s: { properties?: { title?: string | null } }) => s.properties?.title));
  const requests = TABS.filter(t => !existing.has(t)).map(title => ({ addSheet: { properties: { title } } }));
  if (requests.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId: sid, requestBody: { requests } });
  for (const tab of TABS) {
    const lastCol = columnLetter(headersFor(tab).length);
    const first = await sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${tab}!A1:${lastCol}1` });
    if (!first.data.values?.length) await sheets.spreadsheets.values.update({ spreadsheetId: sid, range: `${tab}!A1:${lastCol}1`, valueInputOption: 'RAW', requestBody: { values: [headersFor(tab)] } });
  }
  return sheets;
  })();
  try { return await setupPromise; } catch (error) { setupPromise = null; throw error; }
}
function safeTab(value: unknown): Tab {
  if (value === 'Users' || value === 'Classes' || value === 'Students' || value === 'Payments') return value;
  throw new Error('Invalid collection');
}
async function rows(tab: Tab) {
  const sheets = await ensureTabs();
  const lastCol = columnLetter(headersFor(tab).length);
  const result = await sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range: `${tab}!A2:${lastCol}`, valueRenderOption: 'UNFORMATTED_VALUE' });
  return (result.data.values || []).map((r: any[], index: number) => {
    const payload: Record<string, any> = {};
    COLUMNS[tab].forEach((key: string, i: number) => { const value = r[i + 2]; if (value !== undefined && value !== '') payload[key] = value; });
    return { rowNumber: index + 2, id: String(r[0] || ''), ownerId: String(r[1] || ''), payload, createdAt: String(r[COLUMNS[tab].length + 2] || ''), updatedAt: String(r[COLUMNS[tab].length + 3] || '') };
  });
}
function valuesFor(tab: Tab, record: any) {
  return [record.id, record.ownerId, ...COLUMNS[tab].map((key: string) => record.payload?.[key] ?? ''), record.createdAt, record.updatedAt];
}
async function writeRow(tab: Tab, rowNumber: number, record: any) {
  const sheets = await ensureTabs();
  const lastCol = columnLetter(headersFor(tab).length);
  await sheets.spreadsheets.values.update({ spreadsheetId: spreadsheetId(), range: `${tab}!A${rowNumber}:${lastCol}${rowNumber}`, valueInputOption: 'RAW', requestBody: { values: [valuesFor(tab, record)] } });
}
async function appendRow(tab: Tab, record: any) {
  const sheets = await ensureTabs();
  const lastCol = columnLetter(headersFor(tab).length);
  await sheets.spreadsheets.values.append({ spreadsheetId: spreadsheetId(), range: `${tab}!A:${lastCol}`, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: { values: [valuesFor(tab, record)] } });
}
async function removeRow(tab: Tab, rowNumber: number) {
  const sheets = await ensureTabs();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId() });
  const sheet = meta.data.sheets?.find((s: { properties?: { title?: string | null } }) => s.properties?.title === tab);
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId == null) throw new Error(`Missing tab ${tab}`);
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: spreadsheetId(), requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: rowNumber - 1, endIndex: rowNumber } } }] } });
}
function cleanPayload(tab: Tab, input: any) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid payload');
  const p = { ...input };
  delete p.ownerId;
  delete p.id;
  delete p.createdAt;
  delete p.updatedAt;
  const allowed: Record<Tab, string[]> = {
    Users: ['uid','displayName','email','schoolName','defaultCurrency'],
    Classes: ['name','schedule','feeAmount','currency','billingCycle','isActive'],
    Students: ['studentCode','fullName','gender','parentPhone','classId','className','monthlyFee','currency','dueDay','status','notes'],
    Payments: ['receiptNo','studentId','studentName','classId','className','billingMonth','amountPaid','expectedAmount','currency','method','paymentStatus','paidDate','note'],
  };
  for (const key of Object.keys(p)) if (!allowed[tab].includes(key)) delete p[key];
  if (tab === 'Classes') {
    if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 120) throw new Error('Invalid class name');
    if (!['USD', 'KHR'].includes(p.currency) || !['monthly', 'session'].includes(p.billingCycle)) throw new Error('Invalid class settings');
    p.feeAmount = Math.max(0, Math.min(100000000, Number(p.feeAmount) || 0));
    p.isActive = Boolean(p.isActive);
  }
  if (tab === 'Students') {
    if (typeof p.fullName !== 'string' || !p.fullName.trim() || p.fullName.length > 120) throw new Error('Invalid student name');
    if (!['male', 'female'].includes(p.gender)) throw new Error('Invalid gender');
    if (!['USD', 'KHR'].includes(p.currency)) throw new Error('Invalid currency');
    p.monthlyFee = Math.max(0, Math.min(100000000, Number(p.monthlyFee) || 0));
    p.dueDay = Math.max(1, Math.min(31, Math.round(Number(p.dueDay) || 5)));
  }
  if (tab === 'Payments') {
    if (!p.studentId || Number(p.amountPaid) <= 0 || Number(p.amountPaid) > 100000000) throw new Error('Invalid payment');
    if (!['cash', 'khqr', 'transfer'].includes(p.method)) throw new Error('Invalid payment method');
    if (!/^\d{4}-\d{2}$/.test(p.billingMonth) || !/^\d{4}-\d{2}-\d{2}$/.test(p.paidDate)) throw new Error('Invalid payment date');
  }
  return p;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Missing Firebase ID token' });
    const decoded = await getFirebaseAdmin().verifyIdToken(token, true);
    if (!decoded.email_verified) return res.status(403).json({ error: 'Email must be verified' });
    const uid = decoded.uid;
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const action = body.action;
    if (action === 'bootstrap') {
      const [u, c, s, p] = await Promise.all([rows('Users'), rows('Classes'), rows('Students'), rows('Payments')]);
      const mine = (items: any[]) => items.filter(x => x.ownerId === uid).map(x => ({ ...x.payload, id: x.id, ownerId: uid, createdAt: x.createdAt, updatedAt: x.updatedAt }));
      const profile = mine(u)[0] || null;
      return res.status(200).json({ profile, classes: mine(c), students: mine(s), payments: mine(p) });
    }
    if (action === 'create' || action === 'update' || action === 'delete' || action === 'profile') {
      const tab = action === 'profile' ? 'Users' : safeTab(body.collection);
      const now = new Date().toISOString();
      if (action === 'profile') {
        const existing = (await rows('Users')).find((r: any) => r.id === uid && r.ownerId === uid);
        const profileInput = cleanPayload('Users', body.data);
        if (!['USD', 'KHR'].includes(profileInput.defaultCurrency)) throw new Error('Invalid default currency');
        const payload = { ...(existing?.payload || {}), ...profileInput, uid, email: decoded.email || '', updatedAt: now };
        const record = { id: uid, ownerId: uid, payload, createdAt: existing?.createdAt || now, updatedAt: now };
        if (existing) await writeRow('Users', existing.rowNumber, record); else await appendRow('Users', record);
        return res.status(200).json({ data: { ...payload, createdAt: record.createdAt } });
      }
      const id = String(body.id || '');
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return res.status(400).json({ error: 'Invalid record id' });
      const all = await rows(tab);
      const existing = all.find((r: any) => r.id === id && r.ownerId === uid);
      if (action === 'delete') {
        if (!existing) return res.status(404).json({ error: 'Record not found' });
        await removeRow(tab, existing.rowNumber);
        return res.status(200).json({ ok: true });
      }
      const payload = cleanPayload(tab, body.data);
      if (tab === 'Students' && payload.classId) {
        const cls = (await rows('Classes')).find((r: any) => r.id === payload.classId && r.ownerId === uid);
        if (!cls) return res.status(400).json({ error: 'Class does not belong to this account' });
      }
      if (tab === 'Payments') {
        const student = (await rows('Students')).find((r: any) => r.id === payload.studentId && r.ownerId === uid);
        if (!student) return res.status(400).json({ error: 'Student does not belong to this account' });
        const cls = (await rows('Classes')).find((r: any) => r.id === payload.classId && r.ownerId === uid);
        if (!cls) return res.status(400).json({ error: 'Class does not belong to this account' });
      }
      if (action === 'update' && !existing) return res.status(404).json({ error: 'Record not found' });
      const record = { id, ownerId: uid, payload, createdAt: existing?.createdAt || now, updatedAt: now };
      if (existing) await writeRow(tab, existing.rowNumber, record); else await appendRow(tab, record);
      return res.status(200).json({ data: { ...payload, id, ownerId: uid, createdAt: record.createdAt, updatedAt: now } });
    }
    if (action === 'bulkImport') {
      const result: Record<string, number> = {};
      for (const tab of ['Users', 'Classes', 'Students', 'Payments'] as Tab[]) {
        const incoming = Array.isArray(body.data?.[tab]) ? body.data[tab] : [];
        const existingRows = await rows(tab);
        const existingIds = new Set(existingRows.filter((r: any) => r.ownerId === uid).map((r: any) => r.id));
        let count = 0;
        for (const item of incoming) {
          const id = String(item.id || item.uid || '');
          if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id) || existingIds.has(id)) continue;
          const payload = { ...item }; delete payload.id; delete payload.ownerId;
          const now = new Date().toISOString();
          await appendRow(tab, { id, ownerId: uid, payload, createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : now, updatedAt: now });
          existingIds.add(id); count++;
        }
        result[tab] = count;
      }
      return res.status(200).json({ imported: result });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error: any) {
    console.error('TutorPay API error', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
