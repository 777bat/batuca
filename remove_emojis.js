const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}]/gu;

function scan(dir) {
  const files = fs.readdirSync(dir);
  for(const f of files) {
    const p = path.join(dir, f);
    if(fs.statSync(p).isDirectory()) {
      scan(p);
    } else if(p.endsWith('.tsx') || p.endsWith('.ts')) {
      let content = fs.readFileSync(p, 'utf-8');
      if (emojiRegex.test(content)) {
        content = content.replace(emojiRegex, '');

        // Cleanup empty spaces if they look weird
        content = content.replace(/,\s*\{\s*icon:\s*['"]\s*['"]\s*\}/g, '');
        content = content.replace(/icon:\s*['"]\s*['"],\s*/g, '');

        fs.writeFileSync(p, content, 'utf-8');
        console.log('Cleaned:', p);
      }
    }
  }
}

scan('./src');
