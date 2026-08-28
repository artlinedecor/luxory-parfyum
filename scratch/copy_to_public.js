const fs = require('fs');
fs.copyFileSync('scratch/all_variants.html', 'public/variants.html');
console.log('Copied to public/variants.html');
