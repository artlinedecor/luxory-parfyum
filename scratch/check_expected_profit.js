const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ljlwfzvathvltqxwqsxk.supabase.co';
const supabaseKey = 'sb_publishable_ZwLT9uvHxrG_v6FHGhmUfQ_ssqmznii';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: products } = await supabase.from('products').select('*');
  
  let totalStock = 0;
  let totalCostInvested = 0;
  let expectedRevenue = 0;

  products.forEach((p) => {
    const stock = p.stock || 0;
    const price = p.price_usd || 0;
    const costPrice = p.cost_price_usd || 0;

    totalStock += stock;
    totalCostInvested += stock * costPrice;
    expectedRevenue += stock * price;
  });

  const expectedProfit = expectedRevenue - totalCostInvested;

  console.log('--- EXPECTED STATS ---');
  console.log('totalStock:', totalStock);
  console.log('totalCostInvested:', totalCostInvested);
  console.log('expectedRevenue:', expectedRevenue);
  console.log('expectedProfit:', expectedProfit);
}

check();
