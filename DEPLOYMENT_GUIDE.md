# 🚀 FREE DEPLOYMENT GUIDE
# Hotel Management System - Zero Cost Deployment

## 📋 PREREQUISITES
1. GitHub account
2. Push your code to GitHub repository
3. Create accounts on:
   - Railway.app (for backend + database)
   - Vercel.com (for frontend)

## 🚂 PART 1: DEPLOY BACKEND TO RAILWAY

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Deploy Backend
1. Click "New Project" → "Deploy from GitHub repo"
2. Select your `hotel-management-system` repository
3. Choose "Deploy Backend" or create new service
4. Set Root Directory: `/backend`
5. Railway will auto-detect it's a Node.js app

### Step 3: Add Database Services
1. In your Railway project dashboard:
   - Click "New" → "Database" → "Add MongoDB"
   - Click "New" → "Database" → "Add Redis"
2. Railway will provide connection strings automatically

### Step 4: Set Environment Variables
In Railway dashboard, go to your backend service → Variables:
```bash
NODE_ENV=production
PORT=${{PORT}}
MONGODB_URI=${{MongoDB.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 5: Deploy & Get URL
1. Railway will auto-deploy
2. Get your backend URL from Railway dashboard
3. Test: https://your-backend.up.railway.app/health

## 🔥 PART 2: DEPLOY FRONTEND TO VERCEL

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your repository

### Step 2: Configure Deployment
1. Framework Preset: Next.js
2. Root Directory: `/frontend`
3. Build Command: `pnpm build` (or `npm run build`)
4. Output Directory: `.next`

### Step 3: Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```
(Replace with your actual Railway backend URL)

### Step 4: Deploy
1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Get your frontend URL: https://your-app.vercel.app

## 🎉 PART 3: FINAL SETUP

### Step 1: Update CORS in Backend
Add your Vercel domain to CORS origins in Railway environment:
```bash
CORS_ORIGIN=https://your-app.vercel.app
```

### Step 2: Seed Database
1. In Railway dashboard, open your backend service terminal
2. Run: `npm run seed`
3. Or use the Railway CLI: `railway run npm run seed`

### Step 3: Test Everything
1. Visit your Vercel frontend URL
2. Check connection status (should show green dot)
3. Test room management, guest management
4. Verify data loads from Railway backend

## 💰 FREE TIER LIMITS
- **Railway**: 512MB RAM, 1GB storage, $5 credit/month
- **Vercel**: 100GB bandwidth, 6000 serverless function hours
- **MongoDB on Railway**: 512MB storage (upgrade to MongoDB Atlas if needed)

## 🔧 TROUBLESHOOTING

### Backend not starting?
1. Check Railway logs in dashboard
2. Verify all environment variables are set
3. Make sure PORT is set to ${{PORT}}

### Frontend can't connect to backend?
1. Verify NEXT_PUBLIC_API_URL is correct
2. Check CORS settings in backend
3. Test backend URL directly: /health endpoint

### Database connection issues?
1. Verify MongoDB service is running in Railway
2. Check DATABASE_URL format
3. Restart backend service if needed

## 🚀 QUICK DEPLOYMENT COMMANDS

If you have CLIs installed:

### Railway Backend:
```bash
cd backend
railway login
railway init
railway up
```

### Vercel Frontend:
```bash
cd frontend
vercel login
vercel --prod
```

## 🎯 RESULT
- ✅ Backend API: https://your-backend.up.railway.app
- ✅ Frontend App: https://your-app.vercel.app  
- ✅ Database: MongoDB on Railway
- ✅ Cache: Redis on Railway
- ✅ SSL: Automatic on both platforms
- ✅ Auto-deploy: On git push

Total Cost: **$0/month** 🎉