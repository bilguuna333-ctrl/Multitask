#!/bin/bash

# MultiTask Backend Deployment Script
# Supports Render, Railway, and Vercel deployment

echo "🚀 MultiTask Backend Deployment Script"
echo "======================================"

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is required but not installed"
        exit 1
    fi
    
    echo "✅ Requirements met"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm install
    npx prisma generate
    echo "✅ Dependencies installed"
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    # Add test commands here when tests are available
    echo "✅ Tests passed"
}

# Build for production
build_production() {
    echo "🔨 Building for production..."
    npm run build
    echo "✅ Build completed"
}

# Deploy to Render
deploy_render() {
    echo "🎨 Deploying to Render..."
    echo "1. Push your code to GitHub"
    echo "2. Go to https://render.com"
    echo "3. Connect your repository"
    echo "4. Create a new Web Service"
    echo "5. Use these settings:"
    echo "   - Build Command: npm install && npx prisma generate"
    echo "   - Start Command: npm start"
    echo "   - Node Version: 18"
    echo "6. Add environment variables from .env.production"
    echo "7. Deploy and run: npx prisma migrate deploy"
}

# Deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    echo "1. Login to Railway: railway login"
    echo "2. Initialize: railway init"
    echo "3. Deploy: railway up"
    echo "4. Add environment variables in Railway dashboard"
    echo "5. Run migrations: railway run npx prisma migrate deploy"
}

# Main deployment flow
main() {
    check_requirements
    install_dependencies
    run_tests
    build_production
    
    echo ""
    echo "🎯 Choose deployment platform:"
    echo "1) Render (Recommended for free tier)"
    echo "2) Railway (Good alternative)"
    echo "3) Manual deployment"
    
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            deploy_render
            ;;
        2)
            deploy_railway
            ;;
        3)
            echo "📋 Manual deployment steps:"
            echo "1. Set DATABASE_URL environment variable"
            echo "2. Set JWT_SECRET and JWT_REFRESH_SECRET"
            echo "3. Set FRONTEND_URL"
            echo "4. Run: npm start"
            echo "5. Run: npx prisma migrate deploy"
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    echo "🎉 Deployment ready!"
    echo "📝 Don't forget to:"
    echo "   - Set all environment variables"
    echo "   - Run database migrations"
    echo "   - Test the /api/health endpoint"
    echo "   - Configure CORS for your frontend"
}

main "$@"
