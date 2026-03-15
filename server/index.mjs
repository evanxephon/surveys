import { createServer } from 'node:http';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createDb } from './db.mjs';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const SESSION_COOKIE = 'dost_session';
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 30);
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-me';
const MASTER_ACCESS_CODE = process.env.MASTER_ACCESS_CODE || 'local-master-2026-v_3a';
const OPEN_ACCESS = process.env.OPEN_ACCESS === '1';
const DIST_DIR = resolve(process.cwd(), 'dist');
const db = createDb();

mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function nowIso() {
  return new Date().toISOString();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const index = entry.indexOf('=');
        return [entry.slice(0, index), decodeURIComponent(entry.slice(index + 1))];
      }),
  );
}

function signValue(value) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function createSignedValue(value) {
  return `${value}.${signValue(value)}`;
}

function verifySignedValue(signedValue) {
  const lastDot = signedValue.lastIndexOf('.');
  if (lastDot === -1) {
    return null;
  }

  const value = signedValue.slice(0, lastDot);
  const signature = signedValue.slice(lastDot + 1);
  const expected = signValue(value);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return null;
  }

  return timingSafeEqual(a, b) ? value : null;
}

function makeSessionCookie(rawToken) {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${encodeURIComponent(createSignedValue(rawToken))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function isUrlSafeCode(code) {
  if (!/^[A-Za-z0-9_-]{32}$/.test(code)) {
    return false;
  }

  const char10 = code[9];
  const char20 = code[19];
  const char30 = code[29];

  return /[v-z]/.test(char10) && /[-_]/.test(char20) && /[1-5]/.test(char30);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '';
}

function isLocalRequest(req) {
  const hostname = new URL(req.url, `http://${req.headers.host}`).hostname;
  return hostname === '127.0.0.1' || hostname === 'localhost';
}

function ensureMasterCodeRecord() {
  const codeHash = sha256(MASTER_ACCESS_CODE);
  const existing = db.prepare('SELECT id FROM access_codes WHERE code_hash = ?').get(codeHash);
  if (existing) {
    return existing.id;
  }

  db.prepare(
    `INSERT INTO access_codes (code_hash, code_hint, status, max_uses, use_count, buyer_note, created_at)
     VALUES (?, ?, 'active', 999999999, 0, 'local-master-code', ?)`,
  ).run(codeHash, 'mast...2026', nowIso());

  const created = db.prepare('SELECT id FROM access_codes WHERE code_hash = ?').get(codeHash);
  return created.id;
}

function getSessionRecord(req) {
  const cookies = parseCookies(req.headers.cookie);
  const signed = cookies[SESSION_COOKIE];
  if (!signed) {
    return null;
  }

  const rawToken = verifySignedValue(signed);
  if (!rawToken) {
    return null;
  }

  const sessionHash = sha256(rawToken);
  const row = db
    .prepare(
      `SELECT
        s.id AS session_id,
        s.code_id,
        s.session_hash,
        s.revoked_at,
        c.status,
        c.expires_at,
        c.bound_session_hash
      FROM access_sessions s
      JOIN access_codes c ON c.id = s.code_id
      WHERE s.session_hash = ?`,
    )
    .get(sessionHash);

  if (!row || row.revoked_at) {
    return null;
  }

  if (row.status === 'disabled') {
    return null;
  }

  if (row.expires_at && Date.parse(row.expires_at) < Date.now()) {
    return null;
  }

  if (row.bound_session_hash && row.bound_session_hash !== sessionHash) {
    return null;
  }

  db.prepare('UPDATE access_sessions SET last_seen_at = ? WHERE id = ?').run(nowIso(), row.session_id);
  db.prepare('UPDATE access_codes SET last_used_at = ? WHERE id = ?').run(nowIso(), row.code_id);

  return row;
}

function redeemCode(code, req) {
  if (isLocalRequest(req) && code === MASTER_ACCESS_CODE) {
    const recordId = ensureMasterCodeRecord();
    const rawSessionToken = randomBytes(24).toString('base64url');
    const sessionHash = sha256(rawSessionToken);
    const timestamp = nowIso();
    const ipHash = getClientIp(req) ? sha256(getClientIp(req)) : null;
    const userAgent = req.headers['user-agent'] || '';

    db.prepare(
      `INSERT INTO access_sessions (code_id, session_hash, ip_hash, user_agent, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(recordId, sessionHash, ipHash, userAgent, timestamp, timestamp);

    return {
      status: 200,
      payload: { ok: true },
      headers: {
        'Set-Cookie': makeSessionCookie(rawSessionToken),
      },
    };
  }

  if (!isUrlSafeCode(code)) {
    return { status: 400, payload: { ok: false, message: '授权码格式不正确。' } };
  }

  const codeHash = sha256(code);
  const record = db
    .prepare(
      `SELECT id, status, max_uses, use_count, expires_at, bound_session_hash
       FROM access_codes
       WHERE code_hash = ?`,
    )
    .get(codeHash);

  if (!record) {
    return { status: 403, payload: { ok: false, message: '授权码不存在。' } };
  }

  if (record.status === 'disabled') {
    return { status: 403, payload: { ok: false, message: '授权码已失效。' } };
  }

  if (record.expires_at && Date.parse(record.expires_at) < Date.now()) {
    return { status: 403, payload: { ok: false, message: '授权码已过期。' } };
  }

  if (record.bound_session_hash) {
    return { status: 409, payload: { ok: false, message: '授权码已绑定到其他设备。' } };
  }

  if (record.use_count >= record.max_uses) {
    return { status: 403, payload: { ok: false, message: '授权码已用尽。' } };
  }

  const rawSessionToken = randomBytes(24).toString('base64url');
  const sessionHash = sha256(rawSessionToken);
  const timestamp = nowIso();
  const ipHash = getClientIp(req) ? sha256(getClientIp(req)) : null;
  const userAgent = req.headers['user-agent'] || '';

  db.prepare(
    `INSERT INTO access_sessions (code_id, session_hash, ip_hash, user_agent, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(record.id, sessionHash, ipHash, userAgent, timestamp, timestamp);

  const nextUseCount = record.use_count + 1;
  db.prepare(
    `UPDATE access_codes
     SET status = ?, use_count = ?, activated_at = COALESCE(activated_at, ?), last_used_at = ?, bound_session_hash = ?
     WHERE id = ?`,
  ).run('active', nextUseCount, timestamp, timestamp, sessionHash, record.id);

  return {
    status: 200,
    payload: { ok: true },
    headers: {
      'Set-Cookie': makeSessionCookie(rawSessionToken),
    },
  };
}

function handleSession(req, res) {
  if (OPEN_ACCESS) {
    sendJson(res, 200, { ok: true, mode: 'open' });
    return;
  }

  const session = getSessionRecord(req);
  if (!session) {
    sendJson(res, 401, { ok: false }, { 'Set-Cookie': clearSessionCookie() });
    return;
  }

  sendJson(res, 200, { ok: true });
}

function handleRecordAttempt(req, res, body) {
  if (OPEN_ACCESS) {
    sendJson(res, 200, { ok: true, mode: 'open' });
    return;
  }

  const session = getSessionRecord(req);
  if (!session) {
    sendJson(res, 401, { ok: false, message: '未授权。' }, { 'Set-Cookie': clearSessionCookie() });
    return;
  }

  const { resultId, answers, scores } = body ?? {};

  if (typeof resultId !== 'string' || !Array.isArray(answers) || typeof scores !== 'object' || !scores) {
    sendJson(res, 400, { ok: false, message: '答题记录格式不正确。' });
    return;
  }

  db.prepare(
    `INSERT INTO answer_records (code_id, session_id, result_id, answers_json, scores_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    session.code_id,
    session.session_id,
    resultId,
    JSON.stringify(answers),
    JSON.stringify(scores),
    nowIso(),
  );

  sendJson(res, 200, { ok: true });
}

function serveStaticFile(req, res) {
  const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const decodedPath = decodeURIComponent(requestPath);
  const safePath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = resolve(DIST_DIR, `.${safePath}`);

  if (!filePath.startsWith(DIST_DIR)) {
    sendJson(res, 403, { ok: false, message: '非法路径。' });
    return;
  }

  if (existsSync(filePath)) {
    const ext = extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    });
    createReadStream(filePath).pipe(res);
    return;
  }

  const fallback = join(DIST_DIR, 'index.html');
  if (existsSync(fallback)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(fallback));
    return;
  }

  sendJson(res, 404, { ok: false, message: '前端构建文件不存在，请先执行 npm run build。' });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/auth/session' && req.method === 'GET') {
    handleSession(req, res);
    return;
  }

  if (url.pathname === '/api/auth/redeem' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = redeemCode(String(body.code || ''), req);
      sendJson(res, result.status, result.payload, result.headers);
    } catch {
      sendJson(res, 400, { ok: false, message: '请求体解析失败。' });
    }
    return;
  }

  if (url.pathname === '/api/attempts' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      handleRecordAttempt(req, res, body);
    } catch {
      sendJson(res, 400, { ok: false, message: '请求体解析失败。' });
    }
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    sendJson(res, 404, { ok: false, message: '接口不存在。' });
    return;
  }

  serveStaticFile(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`auth server listening on http://${HOST}:${PORT}`);
});
