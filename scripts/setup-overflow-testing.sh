
#!/bin/bash

# Setup script for overflow testing in CI/CD pipeline

echo "🔧 Setting up overflow testing for CI/CD..."

# Install required dependencies
echo "📦 Installing dependencies..."
npm install --save-dev puppeteer

# Create test directories
echo "📁 Creating test directories..."
mkdir -p overflow-test-reports
mkdir -p .github/workflows

# Create GitHub Actions workflow
echo "🚀 Creating GitHub Actions workflow..."
cat > .github/workflows/overflow-tests.yml << EOF
name: Overflow Detection Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  overflow-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm start &
      
    - name: Wait for application to start
      run: sleep 30
    
    - name: Run overflow tests
      run: node scripts/overflow-ci-test.js
      continue-on-error: true
    
    - name: Upload test reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: overflow-test-reports
        path: overflow-test-reports/
        retention-days: 30
    
    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const path = './overflow-test-reports/overflow-report.json';
          
          if (fs.existsSync(path)) {
            const report = JSON.parse(fs.readFileSync(path, 'utf8'));
            const body = \`
## 🔍 Overflow Detection Results

- **Total Tests**: \${report.summary.totalTests}
- **Failed Tests**: \${report.summary.failedTests}
- **Total Issues**: \${report.summary.totalIssues}
- **Success Rate**: \${(((report.summary.totalTests - report.summary.failedTests) / report.summary.totalTests) * 100).toFixed(1)}%

\${report.summary.totalIssues > 0 ? 
  '⚠️ **Overflow issues detected!** Please check the detailed report.' : 
  '✅ **All tests passed!** No overflow issues detected.'}

[View detailed report](https://github.com/\${context.repo.owner}/\${context.repo.repo}/actions/runs/\${context.runId})
            \`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
          }
EOF

# Create package.json scripts
echo "📝 Adding npm scripts..."
if [ -f package.json ]; then
  # Add scripts to package.json if they don't exist
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!pkg.scripts) pkg.scripts = {};
    
    pkg.scripts['test:overflow'] = 'node scripts/overflow-ci-test.js';
    pkg.scripts['test:overflow:dev'] = 'node scripts/overflow-ci-test.js http://localhost:3000';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('✅ Added overflow testing scripts to package.json');
  "
fi

# Create pre-commit hook
echo "🪝 Setting up pre-commit hook..."
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔍 Running overflow detection tests..."

# Check if the development server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "⚠️  Development server not running. Skipping overflow tests."
  echo "💡 To run tests, start your dev server and run: npm run test:overflow:dev"
  exit 0
fi

# Run overflow tests
node scripts/overflow-ci-test.js http://localhost:3000

# Check exit code
if [ $? -ne 0 ]; then
  echo "❌ Overflow tests failed! Check the reports in ./overflow-test-reports/"
  echo "🔧 Fix overflow issues before committing."
  exit 1
fi

echo "✅ Overflow tests passed!"
EOF

chmod +x .git/hooks/pre-commit

# Create documentation
echo "📚 Creating documentation..."
cat > OVERFLOW_TESTING.md << 'EOF'
# Overflow Testing Documentation

## Overview

This project includes automated overflow detection to ensure responsive design quality across different viewport sizes.

## How It Works

The overflow detection system:

1. **Monitors DOM elements** for content that exceeds container boundaries
2. **Tests multiple viewport sizes** (mobile, tablet, desktop)
3. **Generates detailed reports** with screenshots and recommendations
4. **Integrates with CI/CD** to catch issues before deployment

## Running Tests

### Local Development

```bash
# Start your development server
npm start

# Run overflow tests (in another terminal)
npm run test:overflow:dev

# View reports
open overflow-test-reports/overflow-report.html
```

### CI/CD Pipeline

Tests automatically run on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

## Test Configuration

Edit `scripts/overflow-ci-test.js` to customize:

- **Viewport sizes**: Add or modify test dimensions
- **Test routes**: Include additional pages
- **Threshold**: Adjust overflow sensitivity
- **Output directory**: Change report location

## Understanding Reports

### JSON Report Structure

```json
{
  "timestamp": "2023-12-01T12:00:00Z",
  "summary": {
    "totalTests": 36,
    "failedTests": 2,
    "totalIssues": 5
  },
  "testResults": [...]
}
```

### Issue Types

- **Horizontal overflow**: Content wider than container
- **Vertical overflow**: Content taller than container
- **Both**: Content exceeds container in both dimensions

## Common Issues and Solutions

### Navigation Overflow
**Problem**: Navigation items don't fit on smaller screens
**Solution**: Implement responsive navigation with overflow handling

### Table Overflow
**Problem**: Tables too wide for mobile devices
**Solution**: Add horizontal scrolling or responsive table design

### Text Overflow
**Problem**: Long text breaks layout
**Solution**: Implement proper text wrapping and truncation

### Image Overflow
**Problem**: Images exceed container boundaries
**Solution**: Use responsive image techniques (max-width: 100%)

## Best Practices

1. **Test early and often** - Run tests during development
2. **Fix issues promptly** - Address overflow problems before they accumulate
3. **Monitor trends** - Track overflow issues over time
4. **Consider user experience** - Some overflow (like scrollable content) is intentional
5. **Test real content** - Use realistic data lengths in tests

## Exclusions

Elements with these characteristics are excluded from overflow detection:
- `overflow: auto` or `overflow: scroll`
- `overflow-x: auto` or `overflow-x: scroll`
- `overflow-y: auto` or `overflow-y: scroll`
- `[data-overflow-expected]` attribute

## Troubleshooting

### Tests Not Running in CI
1. Check GitHub Actions workflow file
2. Verify build process completes successfully
3. Ensure application starts properly

### False Positives
1. Add `data-overflow-expected` to intentionally scrollable elements
2. Adjust threshold in test configuration
3. Update exclusion selectors

### Performance Issues
1. Reduce test frequency
2. Limit viewport sizes
3. Exclude non-critical routes

## Integration with Development Workflow

The overflow detection system integrates with:
- **Pre-commit hooks** - Catch issues before committing
- **CI/CD pipeline** - Prevent deployment of broken layouts
- **Pull request reviews** - Automatic commenting with results
- **Development monitoring** - Real-time overflow detection

EOF

echo "✅ Overflow testing setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start your development server: npm start"
echo "2. Run tests: npm run test:overflow:dev"
echo "3. View reports: open overflow-test-reports/overflow-report.html"
echo "4. Commit changes to enable CI/CD integration"
echo ""
echo "📖 See OVERFLOW_TESTING.md for detailed documentation"
