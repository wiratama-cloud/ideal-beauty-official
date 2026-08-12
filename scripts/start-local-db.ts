import EmbeddedPostgres from 'embedded-postgres';
import { execSync } from 'child_process';
import pg from 'pg';

async function main() {
  const pgServer = new EmbeddedPostgres({
    port: 5432,
    databaseDir: './.pg_data',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await pgServer.initialise();
  } catch (err) {
    // Already initialized
  }

  console.log('Starting local PostgreSQL database on port 5432...');
  await pgServer.start();

  const client = new pg.Client('postgresql://postgres:postgres@localhost:5432/postgres');
  await client.connect();
  const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'idealbeauty'");
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE idealbeauty');
    console.log('Created database idealbeauty');
  }
  await client.end();

  console.log('Running prisma db push...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('Running seed script...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

  console.log('\nPostgreSQL database is ready and seeded on port 5432!');
}

main().catch((err) => {
  console.error('Error starting database:', err);
  process.exit(1);
});
