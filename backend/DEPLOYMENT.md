# Deploy on Render

## Prerequisites
- Node.js 18+
- MySQL database
- Google OAuth credentials (optional)

## Environment Variables Required

### Database
- `DATABASE_URL` - MySQL connection string

### JWT
- `JWT_SECRET` - Secure random string (min 32 chars)
- `JWT_REFRESH_SECRET` - Secure random string (min 32 chars)

### OAuth (Optional)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Email (Optional)
- `SMTP_HOST` - SMTP server
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM` - From email address

### Other
- `FRONTEND_URL` - Your deployed frontend URL
- `NODE_ENV` - Set to "production"

## Deployment Steps

### 1. Prepare Database
1. Create a MySQL database on Render or external provider
2. Get the connection string
3. Update `DATABASE_URL` environment variable

### 2. Deploy Backend
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install && npx prisma generate`
4. Set start command: `npm start`
5. Add all environment variables
6. Deploy

### 3. Run Migrations
After deployment, run: `npx prisma migrate deploy`

### 4. Test
- Check health endpoint: `https://your-app-url/api/health`
- Test registration and login

## Free Tier Considerations
- Render free tier: 750 hours/month
- MySQL free tier: 90 days
- Consider using Railway or PlanetScale for database
- Set up proper CORS for your frontend domain
