require('dotenv').config({ path: '.env.production.local' });
const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  const sql = fs.readFileSync('scripts/migration-refactor-modules.sql', 'utf8');
  await client.query(sql);
  await client.end();
  console.log('Migration completed successfully.');
}
run().catch(console.error);
