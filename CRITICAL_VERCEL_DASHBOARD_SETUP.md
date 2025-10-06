# ⚠️ CRITICAL: Vercel Dashboard Configuration Required

## The Problem

Vercel is **still running a build** even though we want to skip it. This is because the build/install skip commands in `vercel.json` are being ignored.

## REQUIRED: Manual Vercel Dashboard Configuration

You **MUST** go to Vercel Dashboard and configure these settings manually:

### Step-by-Step Instructions

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select project: `restaurant-nextgen-mobile` (or your web project)

2. **Navigate to Settings**
   - Click **Settings** in the top navigation

3. **Go to General Settings**
   - In left sidebar, click **General**

4. **Configure Build & Development Settings**

   Scroll down to **Build & Development Settings** and set:

   | Setting | Value | Why |
   |---------|-------|-----|
   | **Framework Preset** | `Other` or `Next.js` | Doesn't matter, we override |
   | **Root Directory** | **(LEAVE EMPTY)** | Critical! |
   | **Build Command** | `echo "Build done in CI"` | Skips build ⚠️ |
   | **Output Directory** | `.next` | Where Next.js outputs |
   | **Install Command** | `echo "Dependencies installed in CI"` | Skips npm install ⚠️ |

5. **Click Save**

6. **Verify the Override**
   - The settings should show **Override** badges next to them
   - This means Vercel will use these instead of auto-detection

### Why This Is Necessary

**`vercel.json` limitations:**
- The `buildCommand` and `installCommand` in `vercel.json` are meant for the Vercel Build Output API
- When using `vercel deploy` from CLI, these are sometimes ignored
- Dashboard settings take precedence

**What happens without this:**
- ❌ Vercel runs `npm install` from monorepo root
- ❌ Can't find workspace dependencies properly
- ❌ Build fails with "Module not found"

**What happens with this:**
- ✅ Vercel skips install (echoes message)
- ✅ Vercel skips build (echoes message)  
- ✅ Vercel deploys the `.next` folder GitHub built
- ✅ Deployment succeeds

## Alternative: Use Vercel's Ignored Build Step

If you prefer, you can also:

1. Go to **Settings → Git**
2. Find **Ignored Build Step**
3. Set to: `git diff HEAD^ HEAD --quiet . ':!*.md'`

This makes Vercel skip builds entirely and only deploy when you trigger it.

## Verification

After configuring, check the next deployment logs:

**Before (broken):**
```
Running "npm install"...
Running "npm run build"...
Error: Module not found: zod
```

**After (working):**
```
Running "echo 'Dependencies installed in CI'"
Running "echo 'Build done in CI'"
Deploying...
Success!
```

## Quick Reference

**Dashboard URL:** https://vercel.com/dashboard

**Settings to change:**
- Build Command: `echo "Build done in CI"`
- Install Command: `echo "Dependencies installed in CI"`
- Root Directory: **(empty)**

**After saving, redeploy from GitHub Actions**

---

## Why Can't We Fix This in Code?

Vercel CLI's `vercel deploy` command uses the **project settings from the dashboard**, not just `vercel.json`. The `vercel.json` file is primarily for:
- Routing rules
- Headers
- Redirects  
- Environment variables
- Build Output API configuration

But the actual build/install commands for CLI deployments come from the **dashboard settings**.

## Do This Now

1. Open Vercel Dashboard
2. Go to project Settings → General
3. Set Build Command to `echo "Build done in CI"`
4. Set Install Command to `echo "Dependencies installed in CI"`
5. Save
6. Push code to trigger GitHub Actions
7. ✅ Deployment will succeed

**This is the missing piece!** 🔑
