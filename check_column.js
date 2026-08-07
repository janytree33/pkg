import { supabase } from './src/lib/supabase.js';

async function addEvalTypeColumn() {
  try {
    // We can't use ALTER TABLE directly with supabase.from()
    // Let's check if eval_type exists by trying to select it
    const { data, error } = await supabase.from('packaging_components').select('eval_type').limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('Column eval_type does not exist. We need to create a migration and apply it.');
    } else if (error) {
      console.error('Error:', error);
    } else {
      console.log('Column eval_type exists!');
    }
  } catch (err) {
    console.error(err);
  }
}

addEvalTypeColumn();
