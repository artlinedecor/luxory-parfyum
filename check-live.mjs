import https from 'https';

https.get('https://parfumelux.uz', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status code:", res.statusCode);
    if (data.includes('BU BO\\'LIMDA')) {
      console.log("Empty catalog message FOUND in HTML.");
    } else {
      console.log("Empty catalog message NOT found in HTML.");
    }
  });
}).on('error', err => {
  console.log("Error:", err.message);
});
