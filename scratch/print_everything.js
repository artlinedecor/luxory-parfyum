const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ljlwfzvathvltqxwqsxk.supabase.co';
const supabaseKey = 'sb_publishable_ZwLT9uvHxrG_v6FHGhmUfQ_ssqmznii';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: products } = await supabase.from('products').select('*');
  const { data: orders } = await supabase.from('orders').select('*');
  const { data: transactions } = await supabase.from('transactions').select('*');

  // Stats calculation
  let totalStock = 0;
  let totalCostInvested = 0;
  let expectedRevenue = 0;

  products.forEach((p) => {
    totalStock += (p.stock || 0);
    totalCostInvested += (p.stock || 0) * (p.cost_price_usd || 0);
    expectedRevenue += (p.stock || 0) * (p.price_usd || 0);
  });

  const expectedProfit = expectedRevenue - totalCostInvested;
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

  const kassaIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const kassaExpense = totalExpenses;
  const kassaBalance = kassaIncome - kassaExpense;
  const savdoQoldiq = kassaIncome - totalExpenses;

  console.log('--- ALL CALCULATIONS ---');
  console.log('totalStock:', totalStock);
  console.log('totalCostInvested:', totalCostInvested);
  console.log('expectedRevenue:', expectedRevenue);
  console.log('expectedProfit:', expectedProfit);
  console.log('totalSoldRevenue:', totalSoldRevenue);
  console.log('totalSoldCOGS:', totalSoldCOGS);
  console.log('totalExpenses:', totalExpenses);
  console.log('capitalExpenses:', capitalExpenses);
  console.log('operatingExpenses:', operatingExpenses);
  console.log('netProfit (Sof Foyda):', netProfit);
  console.log('kassaIncome:', kassaIncome);
  console.log('kassaExpense:', kassaExpense);
  console.log('kassaBalance:', kassaBalance);
  console.log('savdoQoldiq:', savdoQoldiq);
}

check();
