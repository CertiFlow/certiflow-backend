const fs = require('fs');
const path = require('path');

const folders = [
  '.',
  './migrations',
  './db',
  './uploads',
  './routes'
];

folders.forEach((folder) => {
  console.log(`\n📂 ${folder}`);
  try {
    const files = fs.readdirSync(path.resolve(__dirname, folder));
    files.forEach(file => {
      const fullPath = path.join(folder, file);
      const stat = fs.statSync(fullPath);
      const icon = stat.isDirectory() ? '📁' : '📄';
      console.log(`  ${icon} ${file}`);
    });
  } catch (err) {
    console.log(`  ⚠️  Cannot access ${folder}`);
  }
});
