# Vercel Deployment Guide

## Overview

This project is set up for deployment on Vercel with separate services:
- **Frontend**: React/Vite → Vercel (static hosting)
- **Backend**: NestJS → Separate service (Railway, Render, or Heroku)

## Frontend Deployment (Vercel)

### 1. Prerequisites
- GitHub account with your repo pushed
- Vercel account (free tier available)

### 2. Deploy Frontend to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
npm install -g vercel
vercel
```

Follow the prompts:
- Connect GitHub account
- Select `milano-enterprise` project
- Framework preset: `Vite`
- Root directory: `.`
- Build command: `npm run build --workspace=frontend`
- Output directory: `frontend/dist`

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Set these build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build --workspace=frontend`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install`

### 3. Configure Environment Variables

1. In Vercel dashboard, go to your project
2. Settings → Environment Variables
3. Add:
   ```
   VITE_API_BASE_URL = https://your-backend-url.com
   ```
   (Replace with your actual backend URL once deployed)

### 4. Deploy

Your frontend will auto-deploy on every push to `main` branch.

---

## Backend Deployment (Recommended: Railway or Render)

Since Vercel is optimized for static/serverless, NestJS works better on platforms that support persistent node processes.

### Option 1: Railway.app (Recommended for NestJS)

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. Railway will auto-detect NestJS
5. Set environment variables:
   ```
   NODE_ENV = production
   DATABASE_URL = your-database-url
   ```
6. Deploy

Get your backend URL from Railway, then update Vercel's `VITE_API_BASE_URL` environment variable.

### Option 2: Render.com

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Build command: `npm install && npm run build --workspace=backend`
5. Start command: `npm run start --workspace=backend`
6. Add environment variables
7. Deploy

### Option 3: Heroku (Legacy but still works)

```bash
heroku create milano-backend
git push heroku main
heroku config:set NODE_ENV=production
```

---

## Database Configuration

For production, you'll need a PostgreSQL database. Options:

- **Railway**: Includes PostgreSQL (easiest)
- **Render**: Free PostgreSQL tier available
- **Supabase**: PostgreSQL + REST API (supabase.com)
- **Neon**: Serverless PostgreSQL (neon.tech)

Set your `DATABASE_URL` environment variable in your backend hosting service.

---

## Local Development

To test locally before deploying:

```bash
# Terminal 1: Backend
npm run backend:dev

# Terminal 2: Frontend
VITE_API_BASE_URL=http://localhost:3000 npm run frontend:dev
```

---

## Troubleshooting

### Frontend builds but shows "Cannot reach API"
- Check that `VITE_API_BASE_URL` is set in Vercel environment variables
- Verify backend URL is correct and accessible
- Check CORS settings in NestJS backend

### Backend deployment fails
- Verify all environment variables are set
- Check `npm run build --workspace=backend` works locally
- Ensure database connection string is correct

### API calls return 404
- Verify backend is running on the platform you deployed to
- Check that API routes match (e.g., `/menu`, `/orders`)
- Test with curl: `curl https://your-backend-url.com/menu`

---

## Git Workflow

1. Commit changes locally
2. Push to GitHub
3. Vercel auto-deploys frontend
4. If backend changes, redeploy manually on Railway/Render

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

---

## Next: Enterprise Upgrades

After deployment, we can add:
- Authentication (JWT)
- Authorization (roles/permissions)
- Advanced monitoring (Sentry)
- Performance optimization (Redis caching)
- CI/CD pipeline
- Security hardening
