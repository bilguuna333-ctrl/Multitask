# Railway Deployment

## Quick Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd backend
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Add Environment Variables**
   - DATABASE_URL (MySQL connection string)
   - JWT_SECRET (secure random string)
   - JWT_REFRESH_SECRET (secure random string)
   - FRONTEND_URL (your frontend URL)
   - Optional: GOOGLE_CLIENT_ID, SMTP settings

6. **Run Migrations**
   ```bash
   railway run npx prisma migrate deploy
   ```

## Free Tier Benefits
- Free: 500 hours/month execution time
- Free: 100GB data transfer
- Built-in MySQL database available
- Automatic HTTPS
- Custom domains on paid plans

## Database Options
1. **Railway MySQL** - Easiest, built-in
2. **PlanetScale** - MySQL-compatible, generous free tier
3. **Supabase** - PostgreSQL, good free tier
4. **Render** - Separate MySQL service
