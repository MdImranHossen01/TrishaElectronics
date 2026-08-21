const fs = require('fs');
const path = require('path');

const replacements = [
  ['x Apparels Atelier', 'Trishna Electronics Atelier'],
  ['x Apparels Boutique', 'Trishna Electronics Boutique'],
  ['x Apparels Curators', 'Trishna Electronics Curators'],
  ['x Apparels Intelligence', 'Trishna Electronics Intelligence'],
  ['x Apparels Editorial', 'Trishna Electronics Editorial'],
  ['x Apparels Assistant', 'Trishna Electronics Assistant'],
  ['x Apparels CO.', 'Trishna Electronics CO.'],
  ['x Apparels Team', 'Trishna Electronics Team'],
  ['x Apparels AI', 'Trishna Electronics AI'],
  ['x Apparelsr', 'Trishna Electronics'],  // typo fix in manifest.ts
  ['x Apparels', 'Trishna Electronics'],
  ['xApparels', 'TrishnaElectronics'],
  ['xapparels.com', 'trishnaelectronics.com'],
  ['xapparels', 'trishnaelectronics'],
];

const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
      walkDir(fullPath);
    } else if (stat.isFile() && extensions.includes(path.extname(file))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath.replace(process.cwd() + path.sep, ''));
      }
    }
  });
}

walkDir(path.join(process.cwd(), 'src'));
console.log('\nDone! All branding updated.');
