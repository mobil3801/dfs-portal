#!/usr/bin/env node

/**
 * Import Checker Script
 * Scans TypeScript/TSX files for import issues and potential problems
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImportChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.scannedFiles = 0;
    this.srcPath = path.join(__dirname, '../src');
  }

  scanDirectory(dirPath = this.srcPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !['node_modules', 'dist', '.git'].includes(file)) {
        this.scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx)$/)) {
        this.checkFile(filePath);
      }
    });
  }

  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      this.scannedFiles++;

      // Check for import issues
      this.checkImportSyntax(content, relativePath);
      this.checkMissingImports(content, relativePath);
      this.checkUnusedImports(content, relativePath);
      this.checkCircularImports(content, relativePath);
      this.checkDeprecatedImports(content, relativePath);

    } catch (error) {
      this.errors.push({
        file: filePath,
        type: 'FILE_READ_ERROR',
        message: `Failed to read file: ${error.message}`
      });
    }
  }

  checkImportSyntax(content, filePath) {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for incomplete import statements
      if (line.trim().startsWith('import') && !line.includes(';') && !line.includes('from')) {
        this.errors.push({
          file: filePath,
          line: lineNumber,
          type: 'INCOMPLETE_IMPORT',
          message: `Incomplete import statement: ${line.trim()}`
        });
      }

      // Check for incorrect import paths
      const importMatch = line.match(/from ['"`]([^'"`]+)['"`]/);
      if (importMatch) {
        const importPath = importMatch[1];

        // Check for missing file extensions in relative imports
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          if (!importPath.match(/\.(ts|tsx|js|jsx|css|scss)$/)) {
            // Check if the file exists without extension
            const resolvedPath = path.resolve(path.dirname(filePath), importPath);
            const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx'];
            const existsWithExtension = possibleExtensions.some((ext) =>
            fs.existsSync(resolvedPath + ext)
            );

            if (!existsWithExtension && !fs.existsSync(resolvedPath + '/index.ts') && !fs.existsSync(resolvedPath + '/index.tsx')) {
              this.warnings.push({
                file: filePath,
                line: lineNumber,
                type: 'MISSING_FILE',
                message: `Import path may not exist: ${importPath}`
              });
            }
          }
        }
      }
    });
  }

  checkMissingImports(content, filePath) {
    // Check for common patterns that might indicate missing imports
    const patterns = [
    { pattern: /React\./g, import: 'react' },
    { pattern: /useState|useEffect|useMemo|useCallback/g, import: 'react' },
    { pattern: /motion\./g, import: 'motion/react' },
    { pattern: /toast\(/g, import: '@/hooks/use-toast' },
    { pattern: /cn\(/g, import: '@/lib/utils' },
    { pattern: /Button|Card|Input|Label/g, import: '@/components/ui/*' }];


    patterns.forEach(({ pattern, import: expectedImport }) => {
      if (pattern.test(content) && !content.includes(`from "${expectedImport}"`)) {
        this.warnings.push({
          file: filePath,
          type: 'POTENTIALLY_MISSING_IMPORT',
          message: `File uses patterns that may require import from: ${expectedImport}`
        });
      }
    });
  }

  checkUnusedImports(content, filePath) {
    const importMatches = content.match(/import\s+{([^}]+)}\s+from/g);

    if (importMatches) {
      importMatches.forEach((importStatement) => {
        const namedImports = importStatement.match(/{([^}]+)}/)[1].
        split(',').
        map((imp) => imp.trim().split(' as ')[0].trim());

        namedImports.forEach((importName) => {
          // Simple check - could be enhanced with AST parsing
          const usagePattern = new RegExp(`\\b${importName}\\b`, 'g');
          const matches = content.match(usagePattern);

          // If only found in import statement (should be at least 2 occurrences)
          if (matches && matches.length < 2) {
            this.warnings.push({
              file: filePath,
              type: 'POTENTIALLY_UNUSED_IMPORT',
              message: `Import '${importName}' appears to be unused`
            });
          }
        });
      });
    }
  }

  checkCircularImports(content, filePath) {
    // This would require a more sophisticated analysis
    // For now, just flag potential issues
    const importPaths = [];
    const importMatches = content.match(/from ['"`]([^'"`]+)['"`]/g);

    if (importMatches) {
      importMatches.forEach((match) => {
        const path = match.match(/from ['"`]([^'"`]+)['"`]/)[1];
        if (path.startsWith('./') || path.startsWith('../')) {
          importPaths.push(path);
        }
      });

      // Simple heuristic: warn if there are many relative imports
      if (importPaths.length > 10) {
        this.warnings.push({
          file: filePath,
          type: 'COMPLEX_IMPORT_STRUCTURE',
          message: `File has ${importPaths.length} relative imports - check for circular dependencies`
        });
      }
    }
  }

  checkDeprecatedImports(content, filePath) {
    const deprecatedPatterns = [
    { pattern: /from ['"`]react-router['"`]/, message: 'Use react-router-dom instead of react-router' },
    { pattern: /import.*\*.*as React.*from ['"`]react['"`]/, message: 'Consider using named imports for better tree-shaking' }];


    deprecatedPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        this.warnings.push({
          file: filePath,
          type: 'DEPRECATED_IMPORT',
          message
        });
      }
    });
  }

  generateReport() {
    console.log('\n🔍 Import Checker Report');
    console.log('========================\n');

    console.log(`📊 Scanned ${this.scannedFiles} files\n`);

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ No import issues found!\n');
      return true;
    }

    if (this.errors.length > 0) {
      console.log(`❌ Errors (${this.errors.length}):`);
      this.errors.forEach((error) => {
        console.log(`  ${error.file}${error.line ? `:${error.line}` : ''}`);
        console.log(`    ${error.type}: ${error.message}\n`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach((warning) => {
        console.log(`  ${warning.file}${warning.line ? `:${warning.line}` : ''}`);
        console.log(`    ${warning.type}: ${warning.message}\n`);
      });
    }

    console.log('💡 Suggestions:');
    console.log('  - Run "npm run lint:fix" to auto-fix some issues');
    console.log('  - Check import paths and ensure all dependencies are installed');
    console.log('  - Consider using absolute imports (@/...) for better maintainability\n');

    return this.errors.length === 0;
  }

  run() {
    console.log('🔍 Checking imports...\n');
    this.scanDirectory();
    return this.generateReport();
  }
}

// Run the checker
const checker = new ImportChecker();
const success = checker.run();

process.exit(success ? 0 : 1);