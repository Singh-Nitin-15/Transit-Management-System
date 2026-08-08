/**
 * migrate.js — Creates admin_invites table
 * Run once: node migrate.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  let db;
  try {
    db = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'bus_management',
    });
    console.log('✅  Connected to MySQL');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_invites (
        invite_id   INT          AUTO_INCREMENT PRIMARY KEY,
        email       VARCHAR(150) NOT NULL,
        token       VARCHAR(64)  NOT NULL UNIQUE,
        used        TINYINT(1)   NOT NULL DEFAULT 0,
        expires_at  DATETIME     NOT NULL,
        created_by  INT          NOT NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    console.log('🎉  admin_invites table created (or already exists)');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (db) await db.end();
  }
}

migrate();
