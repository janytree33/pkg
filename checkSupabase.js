import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabase() {
  const { data, error } = await supabase.from('company_info').select('logo');
  if (data && data.length > 0) {
    console.log('logo length:', data[0].logo ? data[0].logo.length : 0);
  }
}

checkSupabase();
