import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking profiles table...');
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
       console.log('Profiles table or column might be missing.');
    }
    console.error('Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Available columns in profiles:', Object.keys(data[0]));
  } else {
    // If empty, try to get column info from information_schema if allowed, 
    // but usually select * limit 0 works if data is empty.
    const { data: cols, error: colError } = await supabase.from('profiles').select().limit(0);
    if (colError) console.error('Col error:', colError.message);
    else console.log('Profiles table exists but is empty.');
  }
}

checkSchema();
