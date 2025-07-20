@echo off
echo 🔧 Setting up Git hooks for better development workflow...

REM Create .git/hooks directory if it doesn't exist
if not exist ".git\hooks" mkdir ".git\hooks"

REM Create pre-commit hook
(
echo #!/bin/bash
echo.
echo echo "🔍 Running pre-commit checks..."
echo.
echo # Check if there are any staged files
echo if git diff --cached --name-only ^| grep -E '\.\(ts^|tsx^|js^|jsx\)$' ^> /dev/null; then
echo     echo "📋 Checking TypeScript files..."
echo.    
echo     # Run TypeScript check
echo     npm run type-check
echo     if [ $? -ne 0 ]; then
echo         echo "❌ TypeScript check failed. Commit aborted."
echo         exit 1
echo     fi
echo.    
echo     # Run ESLint check
echo     echo "🔍 Running ESLint..."
echo     npm run lint:check
echo     if [ $? -ne 0 ]; then
echo         echo "❌ ESLint check failed. Commit aborted."
echo         echo "💡 Try running 'npm run lint:fix' to auto-fix issues."
echo         exit 1
echo     fi
echo.    
echo     # Run import checker
echo     echo "📦 Checking imports..."
echo     node scripts/check-imports.js
echo     if [ $? -ne 0 ]; then
echo         echo "⚠️ Import issues found. Review before committing."
echo         # Don't fail the commit for import warnings, just notify
echo     fi
echo.    
echo     echo "✅ All checks passed!"
echo else
echo     echo "ℹ️ No TypeScript/JavaScript files to check."
echo fi
echo.
echo exit 0
) > ".git\hooks\pre-commit"

REM Create pre-push hook
(
echo #!/bin/bash
echo.
echo echo "🚀 Running pre-push checks..."
echo.
echo # Run a full build test
echo echo "🏗️ Testing build..."
echo npm run build:safe
echo if [ $? -ne 0 ]; then
echo     echo "❌ Build failed. Push aborted."
echo     exit 1
echo fi
echo.
echo echo "✅ Build successful! Proceeding with push."
echo exit 0
) > ".git\hooks\pre-push"

echo ✅ Git hooks set up successfully!
echo.
echo 📋 Hooks installed:
echo   • pre-commit: TypeScript check, ESLint, Import checker
echo   • pre-push: Full build test
echo.
echo 💡 To bypass hooks temporarily, use:
echo   git commit --no-verify
echo   git push --no-verify

pause