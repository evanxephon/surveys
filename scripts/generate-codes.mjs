import { randomInt, createHash } from 'node:crypto';
import { createDb } from '../server/db.mjs';

const COUNT = Number(process.argv[2] || '1');
const BASE_URL = process.env.BASE_URL || 'https://your-domain.example/?k=';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const SLOT_10 = 'vwxyz';
const SLOT_20 = '-_';
const SLOT_30 = '12345';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function pick(chars) {
  return chars[randomInt(0, chars.length)];
}

function createCode() {
  const chars = Array.from({ length: 32 }, () => pick(ALPHABET));
  chars[9] = pick(SLOT_10);
  chars[19] = pick(SLOT_20);
  chars[29] = pick(SLOT_30);
  return chars.join('');
}

const db = createDb();
const insert = db.prepare(
  `INSERT INTO access_codes (code_hash, code_hint, status, max_uses, use_count, buyer_note, created_at)
   VALUES (?, ?, 'unused', 1, 0, ?, ?)`,
);

const createdAt = new Date().toISOString();

for (let i = 0; i < COUNT; i += 1) {
  let code = createCode();
  while (db.prepare('SELECT id FROM access_codes WHERE code_hash = ?').get(sha256(code))) {
    code = createCode();
  }

  insert.run(sha256(code), `${code.slice(0, 4)}...${code.slice(-4)}`, '', createdAt);
  console.log(`${code} ${BASE_URL}${code}`);
}
