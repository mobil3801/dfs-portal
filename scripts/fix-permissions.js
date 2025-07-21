#!/usr/bin/env node

/**
 * Fix file permissions for Vercel deployment
 * Addresses exit code 126 issues related to executable permissions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing file permissions for Vercel deployment...');

const nodeModulesBin = path.join(__dirname, '..', 'node_modules', '.bin');

try {
  // Check if node_modules/.bin exists
  if (fs.existsSync(nodeModulesBin)) {
    console.log('✅ Found node_modules/.bin directory');
    
    // Get all files in .bin directory
    const binFiles = fs.readdirSync(nodeModulesBin);
    
    binFiles.forEach(file => {
      const filePath = path.join(nodeModulesBin, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        try {
          // Make file executable (755 permissions)
          fs.chmodSync(filePath, 0o755);
          console.log(`✅ Set executable permissions for: ${file}`);
        } catch (error) {
          console.warn(`⚠️  Could not set permissions for ${file}:`, error.message);
        }
      }
    });
    
    console.log(`🎉 Processed ${binFiles.length} executable files`);
  } else {
    console.log('⚠️  node_modules/.bin directory not found - run npm install first');
  }
  
  // Verify package.json scripts
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('📋 Verifying build script...');
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log(`✅ Build script found: ${packageJson.scripts.build}`);
    } else {
      console.error('❌ No build script found in package.json');
      process.exit(1);
    }
    
    // Check engines
    if (packageJson.engines) {
      console.log('✅ Node.js version requirements specified:', packageJson.engines);
    } else {
      console.warn('⚠️  No engines specified in package.json');
    }
  }
  
  console.log('🎉 Permission fixes completed successfully!');
  
} catch (error) {
  console.error('❌ Error fixing permissions:', error.message);
  process.exit(1);
}