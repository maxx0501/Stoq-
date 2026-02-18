const fs = require('fs');
const path = require('path');

function fixApiUrls(dir) {
  const files = fs.readdirSync(dir, { recursive: true });
  
  files.forEach(file => {
    if (!file.endsWith('.tsx')) return;
    
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix: fetch(${API_URL} → fetch(`${API_URL}`
    content = content.replace(/fetch\(\$\{API_URL\}/g, 'fetch(`${API_URL}`');
    
    // Fix closing quotes: '/... → '/...` (some might have mixed quotes)
    content = content.replace(/(\`\$\{API_URL\}[^`]*)'([,)])/g, '$1`$2');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${path.basename(filePath)}`);
  });
}

fixApiUrls('c:\\Users\\mateu\\OneDrive\\Área de Trabalho\\Stoq+\\frontend\\src');
console.log('Done!');
