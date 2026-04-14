const token = process.env.ASAAS_CHAVE ? process.env.ASAAS_CHAVE.replace('\\', '') : '';
const apiKey = token.startsWith('$') ? token : '$' + token;

fetch('https://api.asaas.com/v3/customers?email=test%40test.com', { 
  headers: { 
    'access_token': apiKey 
  } 
})
.then(async r => console.log(r.status, await r.text()))
.catch(console.error);
