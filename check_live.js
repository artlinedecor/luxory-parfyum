const https = require('https');

https.get('https://parfumelux.uz/catalog', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Contains 'Error fetching':", data.includes("Error fetching database products"));
    console.log("Contains 'BU BO\\'LIMDA':", data.includes("BU BO'LIMDA"));
    console.log("Contains 'SUPER KLONLAR':", data.includes("SUPER KLONLAR"));
    console.log("Contains 'MONTBLANC SIGNATURE 90ML':", data.includes("MONTBLANC SIGNATURE 90ML"));
  });
}).on('error', (err) => {
  console.log("Error:", err.message);
});
