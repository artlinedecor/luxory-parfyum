require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function getUzDesc(title) {
  return `${title} - o'ziga xos tarovat va mukammallikni mujassam etgan noyob atir. Uzoq muddatli va yoqimli ifori bilan kuningizga maxsus joziba bag'ishlaydi. Asl sifat va yuqori darajadagi dizayn uyg'unligi bitta flakonda. Har qanday vaziyatda o'ziga ishonganlar uchun ajoyib tanlov.`;
}

function getRuDesc(title) {
  return `${title} - уникальный парфюм, воплощающий в себе шарм и совершенство. Стойкий и приятный шлейф придаст вашему дню особенное настроение. Идеальное сочетание оригинального качества и премиального дизайна в одном флаконе. Отличный выбор для уверенных в себе людей в любой ситуации.`;
}

async function main() {
  console.log("Fetching all products...");
  const { data: products, error } = await supabase.from('products').select('id, title, product_type');
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }
  
  console.log(`Found ${products.length} products to update.`);
  
  let luxFixedCount = 0;
  let descUpdatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let newTitle = p.title;
    
    // 1. Fix 200 ml for Lux Premium
    if (p.product_type === 'lux_copy' && newTitle.includes('200')) {
      newTitle = newTitle.replace('200 ml', '100 ml').replace('200ml', '100ml').replace('200 ML', '100 ML');
      if (newTitle !== p.title) {
        luxFixedCount++;
      }
    }
    
    // 2. Generate descriptions
    const descUz = getUzDesc(newTitle);
    const descRu = getRuDesc(newTitle);
    
    // 3. Update DB
    const { error: updateErr } = await supabase
      .from('products')
      .update({
        title: newTitle,
        description: descUz,
        description_ru: descRu
      })
      .eq('id', p.id);
      
    if (updateErr) {
      console.error(`Failed to update product ${p.id}:`, updateErr.message);
    } else {
      descUpdatedCount++;
      process.stdout.write(`\rUpdated ${descUpdatedCount}/${products.length}...`);
    }
  }
  
  console.log(`\nDONE!`);
  console.log(`- Fixed 200ml -> 100ml for ${luxFixedCount} Lux Premium products.`);
  console.log(`- Added UZ & RU descriptions to ${descUpdatedCount} products.`);
}

main();
