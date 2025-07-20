@echo off
title DFS Manager Portal - Hosting Setup

echo 🚀 DFS Manager Portal - Hosting Setup
echo ======================================

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install Node.js and npm first.
    pause
    exit /b 1
)

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ git is not installed. Please install git first.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install

echo 🔨 Building the application...
call npm run build

if errorlevel 1 (
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
) else (
    echo ✅ Build successful!
)

echo.
echo 🌐 Choose your hosting platform:
echo 1. Netlify (Recommended)
echo 2. Vercel
echo 3. GitHub Pages
echo 4. Docker
echo 5. Manual deployment

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo 🌐 Setting up Netlify deployment...
    netlify --version >nul 2>&1
    if errorlevel 1 (
        echo 📦 Installing Netlify CLI...
        call npm install -g netlify-cli
    ) else (
        echo ✅ Netlify CLI is already installed
    )
    echo 🚀 Deploying to Netlify...
    call netlify deploy --prod --dir=dist
    echo ✅ Deployment complete! Check your Netlify dashboard for the URL.
) else if "%choice%"=="2" (
    echo ▲ Setting up Vercel deployment...
    vercel --version >nul 2>&1
    if errorlevel 1 (
        echo 📦 Installing Vercel CLI...
        call npm install -g vercel
    ) else (
        echo ✅ Vercel CLI is already installed
    )
    echo 🚀 Deploying to Vercel...
    call vercel --prod
    echo ✅ Deployment complete! Check your Vercel dashboard for the URL.
) else if "%choice%"=="3" (
    echo 🐙 Setting up GitHub Pages...
    echo 📝 Please follow these steps:
    echo 1. Push your code to GitHub
    echo 2. Go to your repository settings
    echo 3. Enable GitHub Pages
    echo 4. The GitHub Action will automatically deploy your site
    echo ✅ GitHub Actions workflow is already configured!
) else if "%choice%"=="4" (
    echo 🐳 Setting up Docker deployment...
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker is not installed. Please install Docker first.
        echo 📖 Visit: https://docs.docker.com/get-docker/
    ) else (
        echo ✅ Docker is installed
        echo 🏗️ Building Docker image...
        call docker build -t dfs-manager-portal .
        echo 🚀 Running Docker container...
        call docker run -d -p 80:80 --name dfs-manager-portal dfs-manager-portal
        echo ✅ Application is running at http://localhost
    )
) else if "%choice%"=="5" (
    echo 📁 Manual deployment setup...
    echo ✅ Your build files are in the 'dist' folder
    echo 📝 Upload the contents of the 'dist' folder to your web server
    echo 🔧 Make sure your server is configured to serve index.html for all routes
    echo 📖 See DEPLOYMENT.md for detailed instructions
) else (
    echo ❌ Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo 📋 Post-deployment checklist:
echo ✅ Test all application features
echo ✅ Verify database connections
echo ✅ Check authentication system
echo ✅ Test mobile responsiveness
echo ✅ Verify SSL certificate
echo ✅ Test visual edit mode

echo.
echo 🆘 Need help? Check the DEPLOYMENT.md file for detailed instructions.
echo 🎉 Happy hosting!
pause