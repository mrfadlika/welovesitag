require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || !databaseUrl.startsWith('file:')) {
    throw new Error('DATABASE_URL harus menggunakan format file: untuk SQLite');
  }

  const relativePath = databaseUrl.slice('file:'.length);
  return path.resolve(__dirname, relativePath);
}

function getMigrationDirectories(migrationsRoot) {
  if (!fs.existsSync(migrationsRoot)) {
    return [];
  }

  return fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function main() {
  const databasePath = resolveDatabasePath();
  const migrationsRoot = path.join(__dirname, 'migrations');

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new DatabaseSync(databasePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS "_manual_migrations" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedMigrations = new Set(
    db.prepare('SELECT name FROM "_manual_migrations"').all().map((row) => row.name)
  );

  const migrationDirectories = getMigrationDirectories(migrationsRoot);

  for (const migrationName of migrationDirectories) {
    if (appliedMigrations.has(migrationName)) {
      continue;
    }

    const migrationFile = path.join(migrationsRoot, migrationName, 'migration.sql');

    if (!fs.existsSync(migrationFile)) {
      throw new Error(`File migrasi tidak ditemukan: ${migrationFile}`);
    }

    const migrationSql = fs.readFileSync(migrationFile, 'utf8');

    db.exec('BEGIN');
    try {
      db.exec(migrationSql);
      db.prepare(
        'INSERT INTO "_manual_migrations" ("name") VALUES (?)'
      ).run(migrationName);
      db.exec('COMMIT');
      console.log(`Applied migration: ${migrationName}`);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  db.close();
}

main();
