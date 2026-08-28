const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const srcDir = 'C:\\Users\\ELYOR\\Desktop\\Atirlar_Rasmlari';

// Get Windows Desktop via registry query or environment
let desktopPaths = [];

try {
  // Query user shell folders in registry for Desktop
  const regOut = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders" /v Desktop', { encoding: 'utf8' });
  const match = regOut.match(/Desktop\s+REG_\w+\s+(.*)/i);
  if (match && match[1]) {
    let rawPath = match[1].trim();
    // Expand %USERPROFILE% if present
    rawPath = rawPath.replace(/%USERPROFILE%/i, os.homedir());
    desktopPaths.push(rawPath);
  }
} catch (e) {
  console.log('Reg query error:', e.message);
}

// Add common Desktop folders on system
const candidates = [
  'C:\\Users\\ELYOR\\Desktop',
  'C:\\Users\\ELYOR\\OneDrive\\Desktop',
  'C:\\Users\\ELYOR\\OneDrive\\Рабочий стол',
  'E:\\Рабочий стол',
  'E:\\Рабочий стол\\OneDrive\\Рабочий стол',
  'E:\\OneDrive\\Рабочий стол',
  'E:\\Desktop',
  path.join(os.homedir(), 'Desktop'),
  path.join(os.homedir(), 'OneDrive', 'Desktop'),
];

for (const c of candidates) {
  if (fs.existsSync(c) && !desktopPaths.includes(c)) {
    desktopPaths.push(c);
  }
}

console.log('Discovered Desktop locations:');
console.log(desktopPaths);

function copyFolderRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (const d of desktopPaths) {
  if (fs.existsSync(d)) {
    const targetFolder = path.join(d, 'Atirlar_Rasmlari');
    try {
      copyFolderRecursive(srcDir, targetFolder);
      console.log(`Successfully copied to: ${targetFolder}`);
    } catch (err) {
      console.error(`Failed to copy to ${targetFolder}:`, err.message);
    }
  }
}
