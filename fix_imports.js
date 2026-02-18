const fs = require('fs');
const path = require('path');

const frontendDir = `c:\\Users\\mateu\\OneDrive\\Área de Trabalho\\Stoq+\\frontend\\src`;

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.relative(frontendDir, fullPath);
    const depth = relativePath.split(path.sep).length - 1; // -1 for the filename itself
    
    if (file.isDirectory()) {
      walk(fullPath);
    } else if (file.name.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Calculate relative path from this file to lib/api
      const fileDir = path.dirname(fullPath);
      const libPath = path.join(frontendDir, 'lib', 'api');
      const relPath = path.relative(fileDir, libPath);
      
      // Replace the import statement
      content = content.replace(
        /import\s+\{\s*API_URL\s*\}\s+from\s+['"][^'"]+['"];?/,
        `import { API_URL } from '${relPath}';\n`
      );
      
      fs.writeFileSync(fullPath, content);
      if (content.includes('API_URL')) {
        console.log(`✓ ${file.name}: ${relPath}`);
      }
    }
  });
}

walk(frontendDir);
console.log('Done!');
