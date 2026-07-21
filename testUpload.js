import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  console.log("Updating logo...");
  const { data: fetch1 } = await supabase.from('company_info').select('id').limit(1).maybeSingle();
  if (fetch1) {
    const { error } = await supabase.from('company_info').update({ logo: dummyBase64 }).eq('id', fetch1.id);
    if (error) {
      console.error("Update error:", error);
    } else {
      console.log("Update success!");
      const { data: fetch2 } = await supabase.from('company_info').select('logo').eq('id', fetch1.id).maybeSingle();
      console.log("Fetched logo length:", fetch2?.logo?.length);
    }
  } else {
    console.log("No row found to update");
  }
}

testUpload();
