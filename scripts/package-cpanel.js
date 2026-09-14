import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const tempDir = path.join(rootDir, 'temp_cpanel');
const zipFile = path.join(rootDir, 'cpanel-deploy.zip');

console.log('📦 Preparing cPanel deployment package...');

// 1. Clean previous temp and zip
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
if (fs.existsSync(zipFile)) fs.rmSync(zipFile, { force: true });

fs.mkdirSync(tempDir, { recursive: true });

// 2. Copy root files
const rootFiles = ['app.js', 'package.json', 'package-lock.json', '.env.example'];
for (const file of rootFiles) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(tempDir, file));
  }
}
// Copy .htaccess to root for cPanel Apache rewrite
if (fs.existsSync(path.join(rootDir, 'public', '.htaccess'))) {
  fs.copyFileSync(path.join(rootDir, 'public', '.htaccess'), path.join(tempDir, '.htaccess'));
}

// 3. Copy dist
function copyDirSync(src, dest, filterFn = null) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (filterFn && !filterFn(entry.name, srcPath)) continue;
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, filterFn);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(path.join(rootDir, 'dist'))) {
  copyDirSync(path.join(rootDir, 'dist'), path.join(tempDir, 'dist'));
}

// 4. Copy server (exclude *.db and *.db-journal)
if (fs.existsSync(path.join(rootDir, 'server'))) {
  copyDirSync(
    path.join(rootDir, 'server'),
    path.join(tempDir, 'server'),
    (name) => !name.endsWith('.db') && !name.endsWith('.db-journal')
  );
}

// 5. Copy public if present
if (fs.existsSync(path.join(rootDir, 'public'))) {
  copyDirSync(path.join(rootDir, 'public'), path.join(tempDir, 'public'));
}

// 6. Create zip using PowerShell Compress-Archive
console.log('🗜️ Compressing files into cpanel-deploy.zip...');
try {
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}/*' -DestinationPath '${zipFile}' -Force"`, {
    stdio: 'inherit'
  });

  const stats = fs.statSync(zipFile);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ cpanel-deploy.zip created successfully! (${sizeMb} MB)`);
} finally {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
