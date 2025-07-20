#!/bin/bash

# Setup Git Hooks for DFS Manager Portal
echo "🔧 Setting up Git hooks for better development workflow..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Check if there are any staged files
if git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx)$' > /dev/null; then
    echo "📋 Checking TypeScript files..."
    
    # Run TypeScript check
    npm run type-check
    if [ $? -ne 0 ]; then
        echo "❌ TypeScript check failed. Commit aborted."
        exit 1
    fi
    
    # Run ESLint check
    echo "🔍 Running ESLint..."
    npm run lint:check
    if [ $? -ne 0 ]; then
        echo "❌ ESLint check failed. Commit aborted."
        echo "💡 Try running 'npm run lint:fix' to auto-fix issues."
        exit 1
    fi
    
    # Run import checker
    echo "📦 Checking imports..."
    node scripts/check-imports.js
    if [ $? -ne 0 ]; then
        echo "⚠️ Import issues found. Review before committing."
        # Don't fail the commit for import warnings, just notify
    fi
    
    echo "✅ All checks passed!"
else
    echo "ℹ️ No TypeScript/JavaScript files to check."
fi

exit 0
EOF

# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "🚀 Running pre-push checks..."

# Run a full build test
echo "🏗️ Testing build..."
npm run build:safe
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Push aborted."
    exit 1
fi

echo "✅ Build successful! Proceeding with push."
exit 0
EOF

# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push

echo "✅ Git hooks set up successfully!"
echo ""
echo "📋 Hooks installed:"
echo "  • pre-commit: TypeScript check, ESLint, Import checker"
echo "  • pre-push: Full build test"
echo ""
echo "💡 To bypass hooks temporarily, use:"
echo "  git commit --no-verify"
echo "  git push --no-verify"