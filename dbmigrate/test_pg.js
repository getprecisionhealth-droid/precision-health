const { Client } = require('pg');

const run = async () => {
  const sql = `
DO $$ 
DECLARE
  con_name text;
BEGIN
  -- 1. Find the name of any check constraint on the role column
  SELECT conname INTO con_name
  FROM pg_constraint c
  JOIN pg_namespace n ON n.oid = c.connamespace
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'profiles' AND pg_get_constraintdef(c.oid) LIKE '%role%';

  -- 2. Drop the old constraint dynamically
  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || con_name;
  END IF;

  -- 3. Add the new expanded constraints
  ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'admin_trainer', 'trainer', 'client'));
END $$;
  `;

  // Try 1: postgres (direct IPv4/v6)
  const client1 = new Client({
    connectionString: 'postgresql://postgres:KBK517CA@db.bikzgydopwirwnacmmxg.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Attempting login with user: postgres');
    await client1.connect();
    await client1.query(sql);
    console.log('SUCCESS with user: postgres');
    process.exit(0);
  } catch (e) {
    console.log('Failed client 1:', e.message);
  } finally {
    await client1.end().catch(()=>{});
  }

  // Try 2: postgres.project_id (Pooler usually, but testing on db)
  const client2 = new Client({
    connectionString: 'postgresql://postgres.bikzgydopwirwnacmmxg:KBK517CA@db.bikzgydopwirwnacmmxg.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Attempting login with user: postgres.bikzgydopwirwnacmmxg');
    await client2.connect();
    await client2.query(sql);
    console.log('SUCCESS with user: postgres.bikzgydopwirwnacmmxg');
    process.exit(0);
  } catch (e) {
    console.log('Failed client 2:', e.message);
  } finally {
    await client2.end().catch(()=>{});
  }
};

run();
