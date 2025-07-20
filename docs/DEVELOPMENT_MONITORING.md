# Development Monitoring Guide

## 🔍 Code Quality & Import Monitoring

This guide covers the monitoring setup for the DFS Manager Portal to catch import issues, lint problems, and maintain code quality during development.

## 📋 Available Scripts

### Linting & Type Checking
```bash
# Run ESLint check
npm run lint

# Fix auto-fixable ESLint issues
npm run lint:fix

# Strict lint check (fails on warnings)
npm run lint:check

# TypeScript type checking
npm run type-check

# Import analysis
npm run check-imports

# Complete quality check
npm run quality-check
```

### Safe Development
```bash
# Development with pre-checks
npm run dev:safe

# Build with pre-checks
npm run build:safe
```

### Git Hooks Setup
```bash
# Install Git hooks (Linux/Mac)
npm run setup-hooks

# Windows
.\scripts\setup-git-hooks.bat
```

## 🛠️ Monitoring Features

### 1. Import Checker (`scripts/check-imports.js`)

Automatically scans for:
- ✅ Incomplete import statements
- ✅ Missing file paths
- ✅ Potentially unused imports
- ✅ Complex import structures (circular dependency hints)
- ✅ Deprecated import patterns
- ✅ Missing common imports (React hooks, utilities, etc.)

### 2. Enhanced ESLint Configuration

Catches:
- ✅ Missing imports/exports
- ✅ Unused variables (with TypeScript support)
- ✅ React-specific issues
- ✅ Performance problems
- ✅ Code quality issues
- ✅ TypeScript best practices

### 3. Git Hooks

**Pre-commit:**
- TypeScript compilation check
- ESLint validation
- Import analysis
- Prevents commits with critical issues

**Pre-push:**
- Full build test
- Ensures deployment-ready code

### 4. VS Code Integration

Automatic setup includes:
- Auto-import suggestions
- Real-time linting
- Format on save
- Import organization
- Path intellisense

## 🚨 Common Import Issues & Solutions

### Missing Import Error
```typescript
// ❌ Problem
const data = useMemo(() => {}, []); // Error: 'useMemo' is not defined

// ✅ Solution
import { useMemo } from 'react';
const data = useMemo(() => {}, []);
```

### Incorrect Path Import
```typescript
// ❌ Problem
import Button from './components/Button'; // File not found

// ✅ Solution
import Button from '@/components/ui/button';
// or
import Button from './components/ui/button';
```

### Circular Dependencies
```typescript
// ❌ Problem
// file1.ts imports file2.ts
// file2.ts imports file1.ts

// ✅ Solution
// Extract shared code to a third file
// Use dependency injection
// Restructure component hierarchy
```

### Missing Default Export
```typescript
// ❌ Problem
import Component from './MyComponent'; // No default export

// ✅ Solution
import { Component } from './MyComponent';
// or add default export to MyComponent
```

## 📊 Monitoring Reports

### Import Checker Report Example
```
🔍 Import Checker Report
========================

📊 Scanned 127 files

⚠️  Warnings (3):
  src/components/SalesChart.tsx:15
    POTENTIALLY_UNUSED_IMPORT: Import 'useMemo' appears to be unused

  src/pages/Dashboard.tsx:8
    POTENTIALLY_MISSING_IMPORT: File uses patterns that may require import from: @/hooks/use-toast

💡 Suggestions:
  - Run "npm run lint:fix" to auto-fix some issues
  - Check import paths and ensure all dependencies are installed
  - Consider using absolute imports (@/...) for better maintainability
```

### ESLint Integration
The ESLint configuration will show real-time errors in VS Code and during builds:

```
❌ Error: 'React' must be in scope when using JSX
❌ Error: 'toast' is not defined
⚠️  Warning: 'useEffect' is defined but never used
```

## 🔧 Customization

### Adding New Import Patterns
Edit `scripts/check-imports.js` to add new patterns:

```javascript
const patterns = [
  { pattern: /YourPattern/g, import: 'your-library' },
  // Add your patterns here
];
```

### ESLint Rules
Modify `eslint.config.js` to adjust rules:

```javascript
rules: {
  // Add or modify rules
  "your-rule": "error"
}
```

## 🚀 Best Practices

1. **Use Absolute Imports**: Prefer `@/components/...` over `../../../components/...`

2. **Import Organization**: Group imports logically:
   ```typescript
   // 1. React and external libraries
   import React from 'react';
   import { motion } from 'motion/react';
   
   // 2. Internal utilities and hooks
   import { cn } from '@/lib/utils';
   import { useToast } from '@/hooks/use-toast';
   
   // 3. UI components
   import { Button } from '@/components/ui/button';
   
   // 4. Local components
   import { CustomComponent } from './CustomComponent';
   ```

3. **Type-only Imports**: Use when importing only for types:
   ```typescript
   import type { ComponentProps } from 'react';
   ```

4. **Lazy Loading**: For large components:
   ```typescript
   const LazyComponent = React.lazy(() => import('./HeavyComponent'));
   ```

## 🎯 Monitoring Workflow

### Daily Development
1. Start development: `npm run dev:safe`
2. VS Code will show real-time issues
3. Fix issues as they appear
4. Commit triggers automatic checks

### Before Deployment
1. Run: `npm run quality-check`
2. Review and fix any issues
3. Test build: `npm run build:safe`
4. Deploy with confidence

### Weekly Maintenance
1. Run full import analysis: `npm run check-imports`
2. Review unused imports and dependencies
3. Update import patterns if needed
4. Check for circular dependencies

## 🆘 Troubleshooting

### Hook Installation Issues
```bash
# If hooks don't work, check permissions
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push

# Verify hook content
cat .git/hooks/pre-commit
```

### ESLint Cache Issues
```bash
# Clear ESLint cache
npx eslint --cache-location .eslintcache --cache .
rm .eslintcache
```

### TypeScript Issues
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npx tsc --build --clean
```

This monitoring setup ensures code quality and prevents import-related issues from reaching production.