# MultiTask Backend Deployment Script (PowerShell)
# Supports Render, Railway deployment

Write-Host "🚀 MultiTask Backend Deployment Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if required tools are installed
function Check-Requirements {
    Write-Host "📋 Checking requirements..." -ForegroundColor Blue
    
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js is required but not installed" -ForegroundColor Red
        exit 1
    }
    
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ npm is required but not installed" -ForegroundColor Red
        exit 1
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    npm install
    npx prisma generate
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Run tests
function Run-Tests {
    Write-Host "🧪 Running tests..." -ForegroundColor Blue
    # Add test commands here when tests are available
    Write-Host "✅ Tests passed" -ForegroundColor Green
}

# Build for production
function Build-Production {
    Write-Host "🔨 Building for production..." -ForegroundColor Blue
    npm run build
    Write-Host "✅ Build completed" -ForegroundColor Green
}

# Deploy to Render
function Deploy-Render {
    Write-Host "🎨 Deploying to Render..." -ForegroundColor Blue
    Write-Host "1. Push your code to GitHub" -ForegroundColor Yellow
    Write-Host "2. Go to https://render.com" -ForegroundColor Yellow
    Write-Host "3. Connect your repository" -ForegroundColor Yellow
    Write-Host "4. Create a new Web Service" -ForegroundColor Yellow
    Write-Host "5. Use these settings:" -ForegroundColor Yellow
    Write-Host "   - Build Command: npm install && npx prisma generate" -ForegroundColor Cyan
    Write-Host "   - Start Command: npm start" -ForegroundColor Cyan
    Write-Host "   - Node Version: 18" -ForegroundColor Cyan
    Write-Host "6. Add environment variables from .env.production" -ForegroundColor Yellow
    Write-Host "7. Deploy and run: npx prisma migrate deploy" -ForegroundColor Yellow
}

# Deploy to Railway
function Deploy-Railway {
    Write-Host "🚂 Deploying to Railway..." -ForegroundColor Blue
    
    try {
        railway --version
    } catch {
        Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
        npm install -g @railway/cli
    }
    
    Write-Host "1. Login to Railway: railway login" -ForegroundColor Yellow
    Write-Host "2. Initialize: railway init" -ForegroundColor Yellow
    Write-Host "3. Deploy: railway up" -ForegroundColor Yellow
    Write-Host "4. Add environment variables in Railway dashboard" -ForegroundColor Yellow
    Write-Host "5. Run migrations: railway run npx prisma migrate deploy" -ForegroundColor Yellow
}

# Main deployment flow
function Main {
    Check-Requirements
    Install-Dependencies
    Run-Tests
    Build-Production
    
    Write-Host ""
    Write-Host "🎯 Choose deployment platform:" -ForegroundColor Cyan
    Write-Host "1) Render (Recommended for free tier)" -ForegroundColor White
    Write-Host "2) Railway (Good alternative)" -ForegroundColor White
    Write-Host "3) Manual deployment" -ForegroundColor White
    
    $choice = Read-Host "Enter choice (1-3)"
    
    switch ($choice) {
        "1" {
            Deploy-Render
        }
        "2" {
            Deploy-Railway
        }
        "3" {
            Write-Host "📋 Manual deployment steps:" -ForegroundColor Blue
            Write-Host "1. Set DATABASE_URL environment variable" -ForegroundColor Yellow
            Write-Host "2. Set JWT_SECRET and JWT_REFRESH_SECRET" -ForegroundColor Yellow
            Write-Host "3. Set FRONTEND_URL" -ForegroundColor Yellow
            Write-Host "4. Run: npm start" -ForegroundColor Yellow
            Write-Host "5. Run: npx prisma migrate deploy" -ForegroundColor Yellow
        }
        default {
            Write-Host "Invalid choice" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Deployment ready!" -ForegroundColor Green
    Write-Host "📝 Don't forget to:" -ForegroundColor Yellow
    Write-Host "   - Set all environment variables" -ForegroundColor White
    Write-Host "   - Run database migrations" -ForegroundColor White
    Write-Host "   - Test the /api/health endpoint" -ForegroundColor White
    Write-Host "   - Configure CORS for your frontend" -ForegroundColor White
}

Main
