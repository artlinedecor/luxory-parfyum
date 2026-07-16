require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  // 1. Get all product_ids from orders
  const { data: orders, error: ordersErr } = await supabase.from('orders').select('items');
  if (ordersErr) throw ordersErr;

  const usedProductIds = new Set();
  orders.forEach(o => {
    if (o.items) {
      o.items.forEach(i => usedProductIds.add(i.product_id));
    }
  });

  console.log(`Found ${usedProductIds.size} unique product_ids in historical orders.`);

  // 2. Read old_products_backup.json
  const oldProducts = JSON.parse(fs.readFileSync('./scratch/old_products_backup.json', 'utf8'));
  console.log(`Loaded ${oldProducts.length} old products from backup.`);

  // 3. Find the products to restore
  const productsToRestore = oldProducts.filter(p => usedProductIds.has(p.id));
  console.log(`Found ${productsToRestore.length} historical products to restore.`);

  // 4. Prepare them for insertion (stock = 0, is_available = false)
  const preparedProducts = productsToRestore.map(p => ({
    ...p,
    stock: 0,
    is_available: false
  }));

  // 5. Insert them back into the products table
  let inserted = 0;
  for (const p of preparedProducts) {
    const { error } = await supabase.from('products').insert([p]);
    if (error) {
      if (error.code === '23505') { // unique violation
        console.log(`Product ${p.id} already exists, skipping.`);
      } else {
        console.error(`Error inserting ${p.id}:`, error.message);
      }
    } else {
      inserted++;
      console.log(`Restored historical product: ${p.title}`);
    }
  }

  console.log(`Successfully restored ${inserted} historical products.`);
}

main().catch(console.error);
