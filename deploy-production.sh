#!/bin/bash

# MultiTask Production Deployment Script
echo "🚀 MultiTask Production Deployment"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

echo "📋 Pre-deployment checklist..."

# Backend checks
echo "🔧 Checking backend..."
cd backend

# Check if backend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check Prisma
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Prisma schema not found"
    exit 1
fi

echo "✅ Backend ready"

# Frontend checks
cd ../frontend

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "✅ Frontend ready"

# Build frontend
echo "🔨 Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo ""
echo "🎯 Deployment Options:"
echo "1) Render (Recommended - Free tier available)"
echo "2) Railway (Alternative - Free tier available)"
echo "3) Manual (VPS/Dedicated server)"

read -p "Choose deployment option (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🎨 Render Deployment Instructions:"
        echo "-----------------------------------"
        echo "1. Push your code to GitHub:"
        echo "   git add ."
        echo "   git commit -m 'Production ready deployment'"
        echo "   git push origin main"
        echo ""
        echo "2. Go to https://render.com"
        echo "3. Connect your GitHub repository"
        echo "4. Create two Web Services:"
        echo "   - Backend: Root directory, Build: 'npm install && npx prisma generate', Start: 'npm start'"
        echo "   - Frontend: frontend directory, Build: 'npm run build', Start: 'serve -s build -l 3000'"
        echo "5. Add environment variables (see .env.production)"
        echo "6. Deploy!"
        ;;
    2)
        echo ""
        echo "🚂 Railway Deployment Instructions:"
        echo "----------------------------------"
        echo "1. Install Railway CLI: npm install -g @railway/cli"
        echo "2. Login: railway login"
        echo "3. Deploy: railway up"
        echo "4. Add environment variables in Railway dashboard"
        echo "5. Run migrations: railway run npx prisma migrate deploy"
        ;;
    3)
        echo ""
        echo "🖥️ Manual Deployment Instructions:"
        echo "----------------------------------"
        echo "1. Set up server with Node.js 18+"
        echo "2. Install MySQL database"
        echo "3. Copy .env.production and set environment variables"
        echo "4. Run migrations: cd backend && npx prisma migrate deploy"
        echo "5. Start backend: cd backend && npm start"
        echo "6. Serve frontend: cd frontend && npx serve -s build -l 3000"
        echo "7. Set up reverse proxy (nginx/apache) if needed"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📝 Important Notes:"
echo "- Set DATABASE_URL to your MySQL connection string"
echo "- Set JWT_SECRET to a secure 32+ character string"
echo "- Set FRONTEND_URL to your deployed frontend URL"
echo "- Run database migrations before starting the app"
echo "- Test /api/health endpoint after deployment"

echo ""
echo "🎉 Your MultiTask application is ready for deployment!"
echo "📚 See DEPLOYMENT_PACKAGE.md for detailed instructions"
