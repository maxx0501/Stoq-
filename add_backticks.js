const fs = require('fs');
const path = require('path');

const frontendDir = `c:\\Users\\mateu\\OneDrive\\Área de Trabalho\\Stoq+\\frontend\\src`;

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      walk(fullPath);
    } else if (file.name.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace '${API_URL} with `${API_URL}`
      content = content.replace(/'\$\{API_URL\}([^']*)'/, "`${API_URL}$1`");
      
      fs.writeFileSync(fullPath, content);
      console.log(`✓ ${file.name}`);
    }
  });
}

walk(frontendDir);
console.log('Done!');
