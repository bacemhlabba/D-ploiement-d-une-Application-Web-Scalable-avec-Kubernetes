const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..'); // Assumes scripts is one level down from project root
const nextDir = path.join(projectRoot, '.next');
const nodeModulesDir = path.join(projectRoot, 'node_modules');

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Removing directory: ${dirPath}...`);
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`Successfully removed ${dirPath}.`);
  } else {
    console.log(`Directory not found, skipping removal: ${dirPath}`);
  }
}

console.log('Starting Next.js project reset...');

// 1. Remove .next directory
removeDir(nextDir);

// 2. Remove node_modules directory
removeDir(nodeModulesDir);

// 3. Reinstall dependencies
try {
  console.log('Reinstalling dependencies (npm install)...');
  execSync('npm install', { stdio: 'inherit', cwd: projectRoot });
  console.log('Dependencies reinstalled successfully.');
} catch (error) {
  console.error('Failed to reinstall dependencies:', error.message);
  process.exit(1);
}

console.log('Next.js project reset complete!');