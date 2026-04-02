#!/bin/bash

# MultiTask - Quick Deployment Script
echo "🚀 MultiTask Quick Deployment"
echo "==========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Preparing for deployment..."

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo ""
echo "📋 Step 2: Checking deployment readiness..."

# Check for required files
if [ ! -f "backend/.env.production" ]; then
    echo "⚠️  Warning: backend/.env.production not found"
    echo "   You'll need to set environment variables in your deployment platform"
fi

if [ ! -f "backend/Procfile" ]; then
    echo "⚠️  Warning: backend/Procfile not found"
    echo "   Creating one now..."
    echo "web: npm start" > backend/Procfile
fi

echo ""
echo "📋 Step 3: Deployment Options"
echo ""
echo "🎨 RENDER DEPLOYMENT (Recommended):"
echo "-----------------------------------"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push origin main"
echo ""
echo "2. Go to https://render.com"
echo "3. Connect your GitHub repository"
echo "4. Create two Web Services:"
echo ""
echo "   🔹 Backend Service:"
echo "   - Root Directory: ./backend"
echo "   - Build Command: npm install && npx prisma generate"
echo "   - Start Command: npm start"
echo "   - Node Version: 18"
echo ""
echo "   🔹 Frontend Service:"
echo "   - Root Directory: ./frontend"
echo "   - Build Command: npm run build"
echo "   - Start Command: npm install -g serve && serve -s build -l 3000"
echo "   - Node Version: 18"
echo ""
echo "5. Add Environment Variables (in Render dashboard):"
echo "   - DATABASE_URL (MySQL connection string)"
echo "   - JWT_SECRET (32+ character secure string)"
echo "   - JWT_REFRESH_SECRET (32+ character secure string)"
echo "   - FRONTEND_URL (your frontend URL)"
echo ""
echo "6. Deploy and run migrations:"
echo "   After deployment, run: npx prisma migrate deploy"
echo ""

echo "🚂 RAILWAY DEPLOYMENT:"
echo "----------------------"
echo "1. Install Railway CLI: npm install -g @railway/cli"
echo "2. Login: railway login"
echo "3. Deploy: railway up"
echo "4. Set environment variables in Railway dashboard"
echo "5. Run migrations: railway run npx prisma migrate deploy"
echo ""

echo "🖥️  MANUAL DEPLOYMENT:"
echo "---------------------"
echo "1. Set up server with Node.js 18+ and MySQL"
echo "2. Copy backend/.env.production and set environment variables"
echo "3. Run: cd backend && npm install && npx prisma migrate deploy && npm start"
echo "4. Run: cd frontend && npm install && npm run build && npx serve -s build -l 3000"
echo "5. Set up reverse proxy (nginx) if needed"
echo ""

echo "📝 Important Notes:"
echo "- Use MySQL database (Render provides free MySQL)"
echo "- Generate secure JWT secrets: openssl rand -base64 32"
echo "- Test /api/health endpoint after deployment"
echo "- Set CORS to your frontend domain"
echo ""

echo "🎉 Your MultiTask application is ready for deployment!"
echo "📚 See DEPLOYMENT_PACKAGE.md for detailed instructions"
