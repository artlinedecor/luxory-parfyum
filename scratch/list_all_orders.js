const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ljlwfzvathvltqxwqsxk.supabase.co';
const supabaseKey = 'sb_publishable_ZwLT9uvHxrG_v6FHGhmUfQ_ssqmznii';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  console.log('--- ALL ORDERS ---');
  orders.forEach((o, index) => {
    const qty = o.items ? o.items.reduce((s, i) => s + i.quantity, 0) : 0;
    console.log(`${index + 1}. Client: ${o.client_name}, Phone: ${o.client_phone}, Status: ${o.status}, Items Qty: ${qty}, Created: ${o.created_at}`);
  });
}

check();
