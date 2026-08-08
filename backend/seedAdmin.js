#!/usr/bin/env node
/**
 * seedAdmin.js — One-time Super Admin seeder
 * ─────────────────────────────────────────
 * Run once with:  node seedAdmin.js
 *
 * Reads credentials from .env:
 *   SUPER_ADMIN_NAME     - display name
 *   SUPER_ADMIN_EMAIL    - login email
 *   SUPER_ADMIN_PASSWORD - login password (min 6 chars)
 *
 * Safety: Will NOT overwrite an existing account with the same email.
 */

require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const {
  DB_HOST, DB_USER, DB_PASSWORD, DB_NAME,
  SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD,
} = process.env;

// ── Validation ────────────────────────────────────────────────
if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
  console.error('❌  SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}
if (SUPER_ADMIN_PASSWORD.length < 6) {
  console.error('❌  SUPER_ADMIN_PASSWORD must be at least 6 characters');
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────
async function seed() {
  let db;
  try {
    db = await mysql.createConnection({
      host:     DB_HOST     || 'localhost',
      user:     DB_USER     || 'root',
      password: DB_PASSWORD || '',
      database: DB_NAME     || 'bus_management',
    });

    console.log('✅  Connected to MySQL');

    // Check if this email already exists
    const [rows] = await db.execute(
      'SELECT user_id, email, role FROM users WHERE email = ?',
      [SUPER_ADMIN_EMAIL.trim().toLowerCase()]
    );

    if (rows.length > 0) {
      const existing = rows[0];
      if (existing.role === 'admin') {
        console.log(`⚠️   An admin with email "${existing.email}" already exists (id: ${existing.user_id}).`);
        console.log('     No changes were made. Delete the account first if you want to re-seed.');
      } else {
        // Exists as a regular user — promote to admin
        await db.execute(
          'UPDATE users SET role = ? WHERE user_id = ?',
          ['admin', existing.user_id]
        );
        console.log(`🔄  Existing user "${existing.email}" has been promoted to admin.`);
      }
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    // Insert super admin
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [
        (SUPER_ADMIN_NAME || 'Super Admin').trim(),
        SUPER_ADMIN_EMAIL.trim().toLowerCase(),
        passwordHash,
        'admin',
      ]
    );

    console.log('');
    console.log('🎉  Super Admin created successfully!');
    console.log('──────────────────────────────────────');
    console.log(`   ID    : ${result.insertId}`);
    console.log(`   Name  : ${SUPER_ADMIN_NAME || 'Super Admin'}`);
    console.log(`   Email : ${SUPER_ADMIN_EMAIL.trim().toLowerCase()}`);
    console.log(`   Role  : admin`);
    console.log('──────────────────────────────────────');
    console.log('   You can now log in at /login');
    console.log('');

  } catch (err) {
    console.error('❌  Seeding failed:', err.message);
    process.exit(1);
  } finally {
    if (db) await db.end();
  }
}

seed();
