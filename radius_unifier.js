const fs = require('fs');
const path = require('path');

const roundedRegex = /\brounded-(none|sm|md|lg|xl|2xl)\b/g;

function scan(dir) {
  const files = fs.readdirSync(dir);
  for(const f of files) {
    const p = path.join(dir, f);
    if(fs.statSync(p).isDirectory()) {
      scan(p);
    } else if(p.endsWith('.tsx') || p.endsWith('.ts')) {
      let content = fs.readFileSync(p, 'utf-8');
      if (roundedRegex.test(content)) {
        content = content.replace(roundedRegex, 'rounded-3xl');
        // also catch raw 'rounded ' which means default rounded
        content = content.replace(/\brounded\s/g, 'rounded-3xl ');
        content = content.replace(/\brounded"/g, 'rounded-3xl"');
        content = content.replace(/\brounded`/g, 'rounded-3xl`');
        content = content.replace(/\brounded'/g, "rounded-3xl'");
        fs.writeFileSync(p, content, 'utf-8');
        console.log('Corner radius normalized:', p);
      }
    }
  }
}

scan('./src');
