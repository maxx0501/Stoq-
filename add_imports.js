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
      
      // If file uses API_URL and doesn't have import, add it
      if (content.includes('${API_URL}') && !content.includes("from '../lib/api'")) {
        // Find the first import statement
        const match = content.match(/import\s+[^;]*;/);
        if (match) {
          const firstImport = match[0];
          const insertPos = content.indexOf(firstImport) + firstImport.length;
          content = content.slice(0, insertPos) + "\nimport { API_URL } from '../lib/api';" + content.slice(insertPos);
        }
      }
      
      fs.writeFileSync(fullPath, content);
      if (content.includes('${API_URL}')) {
        console.log(`✓ ${file.name}`);
      }
    }
  });
}

walk(frontendDir);
console.log('Done!');
