const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const fileSql = fs.readFileSync('scripts/migration-rbac-agency-fixed.sql', 'utf8');

  // URL encode the password because it contains '@'
  const client = new Client({
    connectionString: 'postgresql://postgres:KBK517c%40APP@db.bikzgydopwirwnacmmxg.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected! Executing FIXED migration script...');

    await client.query(fileSql);
    console.log('Migration executed successfully!');
    
    // Explicitly force PostgREST to reload (already in script but double check)
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Schema cache reloaded!');

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
