# 🚀 MANUAL DEPLOYMENT GUIDE - Railway

## ✅ Railway Account Ready
You're logged into Railway as: amka0112@gmail.com
Project: Multitask (https://railway.com/project/101def77-787e-4881-8b4a-58d5aa9b1c47)

## 🎯 Step-by-Step Manual Deployment

### Step 1: Create Backend Service
1. Go to your Railway project: https://railway.com/project/101def77-787e-4881-8b4a-58d5aa9b1c47
2. Click **"New Service"**
3. Select **"GitHub Repo"**
4. Choose your repository (or upload files manually)
5. **Configure Backend:**
   ```
   Service Name: multitask-backend
   Root Directory: ./backend
   Build Command: npm install && npx prisma generate
   Start Command: npm start
   Node Version: 18
   ```

### Step 2: Create Database Service
1. Click **"New Service"**
2. Select **"MySQL"**
3. Choose **"Free"** tier
4. Name: `multitask-db`

### Step 3: Set Environment Variables
1. Go to your backend service
2. Click **"Variables"** tab
3. Add these variables:
   ```
   NODE_ENV=production
   DATABASE_URL=mysql://[get from MySQL service]
   JWT_SECRET=generate-secure-secret-here
   JWT_REFRESH_SECRET=generate-another-secret-here
   FRONTEND_URL=https://[your-frontend-url].railway.app
   ```

### Step 4: Run Database Migrations
1. Go to backend service
2. Click **"Shell"** tab
3. Run: `npx prisma migrate deploy`

### Step 5: Create Frontend Service
1. Click **"New Service"**
2. Select **"GitHub Repo"**
3. Choose your repository
4. **Configure Frontend:**
   ```
   Service Name: multitask-frontend
   Root Directory: ./frontend
   Build Command: npm run build
   Start Command: npm install -g serve && serve -s build -l 3000
   Node Version: 18
   ```

### Step 6: Set Frontend Environment Variables
1. Go to frontend service
2. Click **"Variables"** tab
3. Add:
   ```
   REACT_APP_API_URL=https://[your-backend-url].railway.app/api
   ```

### Step 7: Test Everything
1. **Backend Health Check**: Visit `[backend-url]/api/health`
2. **Frontend**: Visit `[frontend-url].railway.app`
3. **Test Registration**: Create a new account
4. **Test Company Creation**: Create a company
5. **Test Dashboard**: Check if metrics load

## 🔧 Generate Secure Secrets
Run these commands to generate secure secrets:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32
```

## 📊 Railway Free Tier Limits
- **Backend**: 500 hours/month
- **Database**: Free MySQL with 256MB storage
- **Frontend**: 500 hours/month
- **Bandwidth**: 100GB/month

## 🎉 Success!
Your MultiTask SaaS application will be live at:
- Backend: `https://multitask-backend-[random].railway.app`
- Frontend: `https://multitask-frontend-[random].railway.app`

## 🚨 Troubleshooting
If deployment fails:
1. Check build logs in Railway dashboard
2. Ensure all dependencies are in package.json
3. Verify DATABASE_URL format
4. Check if migrations ran successfully

## 📱 What Users Get
- ✅ User registration and login
- ✅ Company creation with unique names
- ✅ Role-based access control
- ✅ Dashboard with metrics
- ✅ Task and project management
- ✅ Custom toast notifications
- ✅ Admin-only settings

**Your MultiTask SaaS is ready for production users! 🎉**
