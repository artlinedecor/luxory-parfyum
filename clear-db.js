const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ljlwfzvathvltqxwqsxk.supabase.co';
const supabaseKey = 'sb_publishable_ZwLT9uvHxrG_v6FHGhmUfQ_ssqmznii';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  console.log("Clearing orders...");
  const { data: orders, error: oErr1 } = await supabase.from('orders').select('id');
  if (oErr1) console.error("Error fetching orders:", oErr1);
  if (orders && orders.length > 0) {
      for (const order of orders) {
          await supabase.from('orders').delete().eq('id', order.id);
      }
      console.log(`Deleted ${orders.length} orders.`);
  } else {
      console.log("No orders to delete.");
  }

  console.log("Clearing transactions...");
  const { data: txs, error: tErr1 } = await supabase.from('transactions').select('id');
  if (tErr1) console.error("Error fetching transactions:", tErr1);
  
  if (txs && txs.length > 0) {
      for (const tx of txs) {
          await supabase.from('transactions').delete().eq('id', tx.id);
      }
      console.log(`Deleted ${txs.length} transactions.`);
  } else {
      console.log("No transactions to delete.");
  }
}

clearData();
