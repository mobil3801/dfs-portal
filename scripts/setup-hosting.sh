#!/bin/bash

# DFS Manager Portal - Hosting Setup Script
# This script helps you quickly set up hosting for your application

echo "🚀 DFS Manager Portal - Hosting Setup"
echo "======================================"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ git is not installed. Please install git first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🌐 Choose your hosting platform:"
echo "1. Netlify (Recommended)"
echo "2. Vercel"
echo "3. GitHub Pages"
echo "4. Docker"
echo "5. Manual deployment"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🌐 Setting up Netlify deployment..."
        if command -v netlify &> /dev/null; then
            echo "✅ Netlify CLI is already installed"
        else
            echo "📦 Installing Netlify CLI..."
            npm install -g netlify-cli
        fi
        echo "🚀 Deploying to Netlify..."
        netlify deploy --prod --dir=dist
        echo "✅ Deployment complete! Check your Netlify dashboard for the URL."
        ;;
    2)
        echo "▲ Setting up Vercel deployment..."
        if command -v vercel &> /dev/null; then
            echo "✅ Vercel CLI is already installed"
        else
            echo "📦 Installing Vercel CLI..."
            npm install -g vercel
        fi
        echo "🚀 Deploying to Vercel..."
        vercel --prod
        echo "✅ Deployment complete! Check your Vercel dashboard for the URL."
        ;;
    3)
        echo "🐙 Setting up GitHub Pages..."
        echo "📝 Please follow these steps:"
        echo "1. Push your code to GitHub"
        echo "2. Go to your repository settings"
        echo "3. Enable GitHub Pages"
        echo "4. The GitHub Action will automatically deploy your site"
        echo "✅ GitHub Actions workflow is already configured!"
        ;;
    4)
        echo "🐳 Setting up Docker deployment..."
        if command -v docker &> /dev/null; then
            echo "✅ Docker is installed"
            echo "🏗️ Building Docker image..."
            docker build -t dfs-manager-portal .
            echo "🚀 Running Docker container..."
            docker run -d -p 80:80 --name dfs-manager-portal dfs-manager-portal
            echo "✅ Application is running at http://localhost"
        else
            echo "❌ Docker is not installed. Please install Docker first."
            echo "📖 Visit: https://docs.docker.com/get-docker/"
        fi
        ;;
    5)
        echo "📁 Manual deployment setup..."
        echo "✅ Your build files are in the 'dist' folder"
        echo "📝 Upload the contents of the 'dist' folder to your web server"
        echo "🔧 Make sure your server is configured to serve index.html for all routes"
        echo "📖 See DEPLOYMENT.md for detailed instructions"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📋 Post-deployment checklist:"
echo "✅ Test all application features"
echo "✅ Verify database connections"
echo "✅ Check authentication system"
echo "✅ Test mobile responsiveness"
echo "✅ Verify SSL certificate"
echo "✅ Test visual edit mode"

echo ""
echo "🆘 Need help? Check the DEPLOYMENT.md file for detailed instructions."
echo "🎉 Happy hosting!"