const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/packs',
  method: 'GET'
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Packs trouvés:', json.length);
      if (json.length > 0) {
        console.log('Premier pack:', JSON.stringify(json[0], null, 2));
      }
    } catch (e) {
      console.log('Erreur:', e.message);
    }
  });
});
req.on('error', (e) => {
  console.log('Erreur connexion:', e.message);
});
req.end();
