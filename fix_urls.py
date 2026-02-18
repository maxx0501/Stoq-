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
      
      // Add import if needed
      if (!content.includes("import { API_URL } from") && content.includes("http://localhost:3333")) {
        const importMatch = content.match(/import\s+.*\s+from\s+['"][^'"]+['"];?\n/);
        if (importMatch) {
          const pos = content.indexOf(importMatch[0]) + importMatch[0].length;
          content = content.slice(0, pos) + "import { API_URL } from '../lib/api';\n" + content.slice(pos);
        }
      }
      
      // Replace all URLs
      content = content.replace(/http:\/\/localhost:3333/g, "`${API_URL}`");
      
      fs.writeFileSync(fullPath, content);
      console.log(`✓ ${file.name}`);
    }
  });
}

walk(frontendDir);
console.log('Done!');

