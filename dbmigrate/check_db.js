const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:KBK517CA@db.bikzgydopwirwnacmmxg.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check role constraint on profiles
    const { rows } = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) AS def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'profiles';
    `);
    
    console.log('Constraints on profiles:', rows);
    
    // Check trigger function
    const triggers = await client.query(`
      SELECT p.proname, p.prosrc 
      FROM pg_proc p 
      WHERE p.proname = 'handle_new_user';
    `);
    
    if (triggers.rows.length > 0) {
      console.log('Trigger source:', triggers.rows[0].prosrc);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
