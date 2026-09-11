#!/usr/bin/env node
/**
 * Creates a password hash for the first admin account.
 *
 *   npm run admin:hash -- "your-password"
 *
 * Uses the same PBKDF2-SHA256 format as the running site, so the output can be
 * inserted straight into the users table.
 */
import { webcrypto as crypto } from 'node:crypto';

const ITERATIONS = 210_000;

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run admin:hash -- "<password>"');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Please choose a password with at least 12 characters.');
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(password),
  'PBKDF2',
  false,
  ['deriveBits'],
);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  key,
  256,
);

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const hash = `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
const id = `usr_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`;

console.log('\nPassword hash:\n');
console.log(hash);
console.log('\nSQL to create the owner account (replace the email address):\n');
console.log(
  `INSERT INTO users (id, email, email_normalized, password_hash, role)\n` +
    `VALUES ('${id}', 'you@example.com', 'you@example.com', '${hash}', 'owner');\n`,
);
