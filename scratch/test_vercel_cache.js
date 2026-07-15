const https = require('https');
const http = require('http');

const oldUrl = 'https://ljlwfzvathvltqxwqsxk.supabase.co/storage/v1/object/public/product-images/public/0.19277199803852163.png';
const encodedUrl = encodeURIComponent(oldUrl);
const vercelUrl = `https://parfumelux.uz/_next/image?url=${encodedUrl}&w=1080&q=75`;

console.log("Fetching from Vercel Cache:", vercelUrl);

https.get(vercelUrl, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = [];
  res.on('data', chunk => {
    data.push(chunk);
  });
  
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    console.log('Downloaded size (bytes):', buffer.length);
    if (res.statusCode === 200 && buffer.length > 1000) {
      console.log('SUCCESS! We can extract images from Vercel Cache!');
    } else {
      console.log('FAILED. Vercel cache missed or forwarded the 402 error.');
      console.log('Body:', buffer.toString('utf8').substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
