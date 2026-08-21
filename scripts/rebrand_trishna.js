const fs = require('fs');
const path = require('path');

const replacements = [
  // Emails & Domains
  ['concierge@trishnaelectronics.com', 'concierge@trishnaelectronics.com'],
  ['support@trishnaelectronics.com', 'support@trishnaelectronics.com'],
  ['info@trishnaelectronics.com', 'info@trishnaelectronics.com'],
  ['TrishnaElectronics.com', 'TrishnaElectronics.com'],
  ['trishnaelectronics.com', 'trishnaelectronics.com'],
  
  // Specific case-sensitive matches
  ['Trishna Electronics', 'Trishna Electronics'],
  ['trishna electronics', 'trishna electronics'],
  ['TrishnaElectronics', 'TrishnaElectronics'],
  ['TRISHNA ELECTRONICS', 'TRISHNA ELECTRONICS'],
  ['trishnaelectronics-app', 'trishnaelectronics-app'],
  ['trishna-electronics', 'trishna-electronics'],
  ['trishnaelectronics', 'trishnaelectronics'],
];

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.md', '.css', '.html', '.env', '.local', '.dockerignore'];
const fileNames = ['Dockerfile', 'docker-compose.yml', '.env.local'];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      return; // ignore broken symlinks or errors
    }
    
    // Skip version control and build folders
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== '.agents') {
        walkDir(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      const isTargetFile = extensions.includes(ext) || fileNames.includes(file);
      
      // Specifically skip bd-locations.ts to avoid renaming geographic "Ruma"
      if (file === 'bd-locations.ts') {
        return;
      }
      
      // Skip binary/lock files
      if (file === 'package-lock.json') {
        return;
      }
      
      if (isTargetFile) {
        let content;
        try {
          content = fs.readFileSync(fullPath, 'utf8');
        } catch (e) {
          return;
        }
        let original = content;
        for (const [from, to] of replacements) {
          content = content.split(from).join(to);
        }
        if (content !== original) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log('Updated:', fullPath.replace(process.cwd() + path.sep, ''));
        }
      }
    }
  });
}

console.log('Starting rebranding to Trishna Electronics...');
walkDir(process.cwd());
console.log('\nDone! All branding updated.');
