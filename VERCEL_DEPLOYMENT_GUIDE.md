# Vercel Deployment Guide

This guide will walk you through deploying your AI chatbot to Vercel with all required services: Postgres, Blob Storage, KV Redis, and OpenAI integration.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. An [OpenAI API key](https://platform.openai.com/account/api-keys)
3. [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
4. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Import Your Project**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js configuration

2. **Configure Environment Variables**
   - During import, add these environment variables:
   
   ```bash
   # Required: OpenAI API Key
   OPENAI_API_KEY=sk-... # Get from https://platform.openai.com/account/api-keys
   
   # Required: Auth Secret (generate a random 32-character string)
   AUTH_SECRET=... # Generate at https://generate-secret.vercel.app/32
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete

### Option B: Deploy via CLI

```bash
# Navigate to your project directory
cd /path/to/windsurf-dd-demo

# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel --prod
```

After deployment, you'll need to add environment variables via the dashboard or CLI.

## Step 2: Add Vercel Storage Services

### 2.1 Create Vercel Postgres Database

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a database name (e.g., `ai-chatbot-db`)
6. Select a region (choose one close to your users)
7. Click **Create**

**Result**: Vercel will automatically add these environment variables to your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 2.2 Create Vercel Blob Storage

1. In your project's **Storage** tab
2. Click **Create Database** (or **Add Store** if you already have databases)
3. Select **Blob**
4. Choose a store name (e.g., `ai-chatbot-blob`)
5. Click **Create**

**Result**: Vercel will automatically add:
- `BLOB_READ_WRITE_TOKEN`

### 2.3 Create Vercel KV Redis (Optional but Recommended)

Redis is used for resumable streams functionality. It's optional but enhances the user experience.

1. In your project's **Storage** tab
2. Click **Create Database**
3. Select **KV**
4. Choose a store name (e.g., `ai-chatbot-kv`)
5. Select a region (same as your Postgres for best performance)
6. Click **Create**

**Result**: Vercel will automatically add:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Note**: The app uses `REDIS_URL` instead of `KV_URL`. After creation, you need to:
1. Go to **Settings** → **Environment Variables**
2. Find `KV_URL`
3. Add a new variable `REDIS_URL` with the same value as `KV_URL`

Or via CLI:
```bash
vercel env add REDIS_URL production
# Paste the value from KV_URL when prompted
```

## Step 3: Verify Environment Variables

Go to **Settings** → **Environment Variables** and confirm you have:

### Required Variables:
- ✅ `OPENAI_API_KEY` - Your OpenAI API key
- ✅ `AUTH_SECRET` - Random secret for authentication
- ✅ `POSTGRES_URL` - Auto-added by Vercel Postgres
- ✅ `BLOB_READ_WRITE_TOKEN` - Auto-added by Vercel Blob

### Optional Variables:
- `REDIS_URL` - For resumable streams (copy value from `KV_URL`)

## Step 4: Trigger a Redeployment

After adding all environment variables and storage services:

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the three dots (...) menu
4. Click **Redeploy**
5. Check "Use existing Build Cache"
6. Click **Redeploy**

This ensures your app runs with all the new environment variables and storage connections.

## Step 5: Initialize the Database

The app uses Drizzle ORM and will automatically run migrations on first build. The build command includes:

```bash
tsx lib/db/migrate && next build
```

This will:
1. Run database migrations
2. Create necessary tables
3. Build your Next.js application

## Step 6: Test Your Deployment

1. Visit your deployment URL (e.g., `https://your-app.vercel.app`)
2. Create an account / Sign in
3. Start a chat conversation
4. Upload a file to test Blob storage
5. Verify everything works correctly

## Local Development Setup

To develop locally with the production services:

### 1. Link Your Local Project to Vercel

```bash
cd /path/to/windsurf-dd-demo
vercel link
```

Follow the prompts to link to your Vercel project.

### 2. Pull Environment Variables

```bash
vercel env pull .env.local
```

This downloads all environment variables from Vercel to your local `.env.local` file.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Development Server

```bash
pnpm dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

### 5. Database Migrations (if needed)

If you make changes to the database schema:

```bash
# Generate migration
pnpm db:generate

# Run migration locally
pnpm db:migrate

# Or push schema directly (development only)
pnpm db:push
```

## Environment Variables Reference

Here's a complete reference of all environment variables:

```bash
# Authentication
AUTH_SECRET=your-random-secret-here

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Vercel Postgres (Auto-added)
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...

# Vercel Blob (Auto-added)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Vercel KV Redis (Auto-added, then copy to REDIS_URL)
KV_URL=redis://...
REDIS_URL=redis://...  # Copy from KV_URL
```

## Troubleshooting

### Database Connection Issues

**Error**: `Failed to connect to Postgres`

**Solution**: 
- Verify `POSTGRES_URL` is set correctly
- Check database region matches your deployment region
- Ensure database is not paused (free tier databases may pause)

### OpenAI API Errors

**Error**: `Invalid API key`

**Solution**:
- Verify your OpenAI API key is correct
- Check you have credits in your OpenAI account
- Ensure the key has proper permissions

### Blob Upload Failures

**Error**: `Failed to upload to Blob storage`

**Solution**:
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Blob store is created and active
- Ensure file size is within limits (5MB default)

### Redis Connection Issues

**Error**: `REDIS_URL not found` (Warning in logs)

**Solution**:
- Redis is optional for resumable streams
- If you want to use it, copy `KV_URL` value to `REDIS_URL`
- Or leave it disabled - the app will work without it

### Build Failures

**Error**: Database migration fails during build

**Solution**:
- Ensure Postgres database is created before deploying
- Check `POSTGRES_URL` is available during build time
- Try redeploying after database is fully initialized

## Cost Considerations

### Vercel Storage Pricing

- **Postgres**: Free tier includes 60 compute hours/month, 256MB storage
- **Blob**: Free tier includes 1GB storage, 100GB bandwidth
- **KV Redis**: Free tier includes 256MB storage, 30GB bandwidth

### OpenAI Pricing

- **GPT-4o**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- **o1-mini**: Check current pricing at [openai.com/pricing](https://openai.com/pricing)
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens

Monitor your usage in both platforms to avoid unexpected costs.

## Next Steps

1. ✅ Customize the chatbot UI in `/components`
2. ✅ Add custom tools in `/lib/ai/tools`
3. ✅ Configure AI model parameters in `/lib/ai/providers.ts`
4. ✅ Set up custom domain in Vercel Dashboard
5. ✅ Configure analytics and monitoring

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **OpenAI Support**: [help.openai.com](https://help.openai.com)
- **Project Issues**: Open an issue in your Git repository
