const fs = require('fs');
const path = './package.json';
try {
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.homepage = 'https://lizaelf.github.io/sommi-ai/client';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
  console.log('✅ Set homepage in package.json to: ' + pkg.homepage);
} catch (err) {
  console.error('❌ Error updating package.json:', err.message);
}
