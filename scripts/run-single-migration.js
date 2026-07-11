#!/usr/bin/env node
/**
 * Run one migration file and record it in SequelizeMeta.
 * Use when db:migrate cannot run all pending files (e.g. legacy tables already exist).
 *
 * Usage: node scripts/run-single-migration.js 20250707150000-rental-store-foundation.js
 */
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../src/config/config.json');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-single-migration.js <migration-filename.js>');
  process.exit(1);
}

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];
if (!dbConfig) {
  console.error(`No config for NODE_ENV=${env}`);
  process.exit(1);
}

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect || 'mysql',
  logging: console.log,
});

async function main() {
  const migrationPath = path.resolve(__dirname, '../src/migrations', file);
  const migration = require(migrationPath);
  const queryInterface = sequelize.getQueryInterface();

  const [existing] = await sequelize.query(
    'SELECT name FROM SequelizeMeta WHERE name = :name',
    { replacements: { name: file } }
  );
  if (existing.length) {
    console.log(`Already applied: ${file}`);
    await sequelize.close();
    return;
  }

  console.log(`Running migration: ${file}`);
  await migration.up(queryInterface, Sequelize);
  await sequelize.query('INSERT INTO SequelizeMeta (name) VALUES (:name)', {
    replacements: { name: file },
  });
  console.log(`Done: ${file}`);
  await sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await sequelize.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
