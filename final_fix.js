const fs = require('fs');
const path = require('path');

const srcDir = `c:\\Users\\mateu\\OneDrive\\Área de Trabalho\\Stoq+\\frontend\\src`;

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const hasAPI_URL = content.includes('http://localhost:3333');
  
  if (!hasAPI_URL) return;
  
  // Get depth: how many directories deep from src
  const relative = path.relative(srcDir, filePath);
  const depth = relative.split(path.sep).length - 1;
  
  // Create relative path to lib/api
  const upDirs = '../'.repeat(depth);
  const importPath = `${upDirs}lib/api`;
  
  // Add import at the top if not present
  if (!content.includes(`from '${importPath}'`)) {
    const lines = content.split('\n');
    let insertAfter = 0;
   
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import')) {
        insertAfter = i + 1;
      } else if (lines[i].trim().length > 0 && !lines[i].startsWith('//')) {
        break;
      }
    }
    
    lines.splice(insertAfter, 0, `import { API_URL } from '${importPath}';`);
    content = lines.join('\n');
  }
  
  // Replace URLs
  content = content.replace(/http:\/\/localhost:3333/g, "`${API_URL}`");
  
  fs.writeFileSync(filePath, content);
  console.log(`✓ ${path.basename(filePath)}`);
}

function walkDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  });
}

walkDir(srcDir);
console.log('✓ Done!');
