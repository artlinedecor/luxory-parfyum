const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ljlwfzvathvltqxwqsxk.supabase.co';
const supabaseKey = 'sb_publishable_ZwLT9uvHxrG_v6FHGhmUfQ_ssqmznii';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: products } = await supabase.from('products').select('*');
  const { data: orders } = await supabase.from('orders').select('*');
  const { data: transactions } = await supabase.from('transactions').select('*');

  // page.tsx stats
  let totalStock = 0;
  let totalCostInvested = 0;
  let expectedRevenue = 0;
  let expectedProfit = 0;

  products.forEach((p) => {
    const stock = p.stock || 0;
    const price = p.price_usd || 0;
    const costPrice = p.cost_price_usd || 0;

    totalStock += stock;
    totalCostInvested += stock * costPrice;
    expectedRevenue += stock * price;
  });

  expectedProfit = expectedRevenue - totalCostInvested;

  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === "pending").length;

  let totalSoldRevenue = 0;
  let totalSoldCOGS = 0;

  const costPriceMap = {};
  products.forEach(p => {
    costPriceMap[p.id] = p.cost_price_usd || 0;
  });

  orders.forEach(o => {
    if (o.status === "delivered" && o.items && Array.isArray(o.items)) {
      o.items.forEach(item => {
        totalSoldRevenue += item.price_at_purchase * item.quantity;
        totalSoldCOGS += (costPriceMap[item.product_id] || 0) * item.quantity;
      });
    }
  });

  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const capitalExpenses = transactions
    .filter(t => t.type === "expense" && t.description && /tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod/i.test(t.description))
    .reduce((s, t) => s + Number(t.amount), 0);

  const operatingExpenses = totalExpenses - capitalExpenses;
  const netProfit = totalSoldRevenue - totalSoldCOGS - operatingExpenses;

  console.log('--- DASHBOARD STATS ---');
  console.log('totalSoldRevenue:', totalSoldRevenue);
  console.log('totalSoldCOGS:', totalSoldCOGS);
  console.log('totalExpenses:', totalExpenses);
  console.log('capitalExpenses:', capitalExpenses);
  console.log('operatingExpenses:', operatingExpenses);
  console.log('netProfit (Sof Foyda):', netProfit);
}

check();
