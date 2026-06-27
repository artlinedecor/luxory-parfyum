const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ljlwfzvathvltqxwqsxk.supabase.co';
const supabaseKey = 'sb_publishable_ZwLT9uvHxrG_v6FHGhmUfQ_ssqmznii';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: transactions } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  console.log('--- ALL TRANSACTIONS WITH DATES ---');
  transactions.forEach((t, i) => {
    console.log(`${i+1}. Type: ${t.type}, Amount: ${t.amount}, Desc: ${t.description}, Created At: ${t.created_at}`);
  });
}

check();
