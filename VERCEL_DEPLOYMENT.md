# Vercel Deployment Guide

This guide explains how to deploy the Restaurant Inventory Management System to Vercel.

## Prerequisites

1. A Vercel account (https://vercel.com)
2. A Supabase project with the database already set up
3. Git repository connected to Vercel

## Step 1: Prepare Your Repository

Ensure your code is pushed to GitHub/GitLab/Bitbucket:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## Step 2: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Select the repository: `restaurant-nextgen`

## Step 3: Configure Build Settings

Vercel should auto-detect Next.js. Configure these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web` ⚠️ **IMPORTANT: Set this to `apps/web`**
- **Build Command**: Leave empty or `npm run build`
- **Output Directory**: Leave empty or `.next`
- **Install Command**: Leave empty or `npm install`

> **Note**: The `vercel.json` file in `apps/web` will automatically configure the build settings.

## Step 4: Set Environment Variables

This is the **most important step**. In the Vercel project settings:

1. Navigate to **Settings → Environment Variables**
2. Add the following variables:

### Required Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Production, Preview, Development |
| `NEXT_PUBLIC_DEMO_MODE` | `false` | Production, Preview, Development |

### How to Get Supabase Credentials

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Settings → API**
4. Copy:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → anon/public** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Setting Variables in Vercel

For each variable:

1. Click **"Add New"**
2. Enter the **Key** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter the **Value** (your actual Supabase URL)
4. Select environments: Check all three:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Once complete, you'll get a deployment URL like: `https://your-app.vercel.app`

## Step 6: Verify Deployment

1. Visit your deployment URL
2. Test the following:
   - ✅ Can access the login page
   - ✅ Can log in with existing credentials
   - ✅ Can view inventory items
   - ✅ Database operations work (CRUD)
   - ✅ No console errors

## Step 7: Configure Custom Domain (Optional)

1. In Vercel, go to **Settings → Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

## Troubleshooting

### Build Fails

**Error**: `cd: apps/web: No such file or directory`
- **Cause**: Root Directory is set to `apps/web` but build command tries to `cd apps/web` again
- **Solution**:
  1. In Vercel project settings → **General**
  2. Set **Root Directory** to `apps/web`
  3. Leave **Build Command** empty (uses `vercel.json`)
  4. Redeploy

**Error**: `Environment variable not found`
- **Solution**: Double-check all environment variables are set in Vercel dashboard

**Error**: `Module not found`
- **Solution**: Ensure `package-lock.json` is committed to git

### Runtime Errors

**Error**: `Failed to fetch` or `Network error`
- **Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` is correct and includes `https://`

**Error**: `Invalid API key`
- **Solution**: Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the **anon/public** key, not the service role key

**Error**: `Row Level Security policy violation`
- **Solution**: Check that RLS policies are correctly set up in Supabase

### Check Deployment Logs

1. Go to your Vercel project
2. Click on the deployment
3. View **"Build Logs"** or **"Function Logs"**

## Environment-Specific Deployments

### Production
- Main branch deploys to production
- Uses production environment variables

### Preview
- Pull requests create preview deployments
- Uses preview environment variables
- URL: `https://your-app-git-branch-name.vercel.app`

### Development
- Local development with `vercel dev`
- Uses development environment variables

## Continuous Deployment

Vercel automatically deploys when you push to your repository:

```bash
git add .
git commit -m "Update feature X"
git push origin main
# Vercel automatically builds and deploys
```

## Security Notes

⚠️ **Important Security Practices:**

1. ✅ **Never** commit `.env.local` to git (already in `.gitignore`)
2. ✅ Use environment variables in Vercel dashboard for all secrets
3. ✅ The `NEXT_PUBLIC_` prefix means the variable is exposed to the browser
4. ✅ For server-side secrets, omit the `NEXT_PUBLIC_` prefix
5. ✅ Use Supabase Row Level Security (RLS) policies to protect data
6. ✅ The anon key is safe to expose (it's protected by RLS)

## Local Development vs Vercel

| Aspect | Local Development | Vercel Deployment |
|--------|------------------|-------------------|
| Environment File | `.env.local` | Vercel Dashboard Variables |
| File Location | `apps/web/.env.local` | Settings → Environment Variables |
| Committed to Git | ❌ No (in `.gitignore`) | N/A |
| How Code Reads It | `process.env.NEXT_PUBLIC_*` | `process.env.NEXT_PUBLIC_*` |

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Documentation](https://supabase.com/docs)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test locally first with `npm run build && npm start`
4. Check Supabase dashboard for API status
