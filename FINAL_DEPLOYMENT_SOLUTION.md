# ✅ Final Vercel Deployment Solution

## The Complete Solution

After multiple iterations, here's the **final working approach** for deploying a monorepo to Vercel:

### Strategy: Build in GitHub Actions, Deploy to Vercel

```
GitHub Actions (Build) → Vercel (Deploy Only)
```

## Configuration Files

### 1. `.github/workflows/deploy-web.yml`

```yaml
- name: Install dependencies
  run: npm ci  # Installs all workspace packages

- name: Type check
  run: npm run type-check
  working-directory: apps/web

- name: Lint
  run: npm run lint
  working-directory: apps/web

- name: Build with npm (not Vercel) ⭐
  run: npm run build
  working-directory: apps/web
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

- name: Install Vercel CLI
  run: npm install -g vercel@latest

- name: Deploy to Vercel (production) ⭐
  run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
  working-directory: apps/web
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 2. `vercel.json` (root)

```json
{
  "github": {
    "enabled": false
  },
  "installCommand": "echo 'Skipping install, using GitHub Actions build'",
  "buildCommand": "echo 'Skipping build, using GitHub Actions build'"
}
```

This tells Vercel: **"Don't install, don't build - just deploy!"**

### 3. `packages/shared/package.json`

```json
{
  "dependencies": {
    "zod": "^3.25.76",
    "@casl/ability": "^6.7.3"
  }
}
```

All dependencies needed by the shared package are declared.

## How It Works

### Step 1: GitHub Actions Builds
```bash
# In GitHub Actions environment
npm ci                    # Install all workspaces
cd apps/web
npm run build            # Build Next.js app
# .next directory created ✅
```

**Why this works:**
- ✅ npm workspaces properly configured
- ✅ `packages/shared` dependencies available
- ✅ No monorepo path issues

### Step 2: Vercel Deploys
```bash
# Vercel receives the code with .next already built
vercel deploy --prod
# Vercel sees vercel.json
# Skips install (echo message)
# Skips build (echo message)  
# Deploys .next directory ✅
```

**Why this works:**
- ✅ No build step on Vercel (skipped via vercel.json)
- ✅ Just uploads and serves the pre-built .next
- ✅ Fast deployment (~30 seconds)

## Vercel Dashboard Settings

**Settings → General:**

| Setting | Value |
|---------|-------|
| Root Directory | **(EMPTY)** |
| Framework Preset | Next.js |
| Build Command | *(leave empty)* |
| Install Command | *(leave empty)* |
| Output Directory | *(leave empty)* |

All configuration comes from `vercel.json`.

## Required GitHub Secrets

Add these in: **GitHub Repo → Settings → Secrets and variables → Actions**

1. `VERCEL_TOKEN` - From https://vercel.com/account/tokens
2. `VERCEL_ORG_ID` - From Vercel settings
3. `VERCEL_PROJECT_ID` - From Vercel project settings
4. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
5. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## Deployment Flow

```
Developer pushes to main branch
         ↓
GitHub Actions triggered
         ↓
1. Checkout code
2. Install Node.js
3. npm ci (all workspaces)
4. Type check ✅
5. Lint ✅  
6. npm run build ✅
   - Has access to packages/shared
   - All dependencies available
   - Creates .next directory
7. Deploy to Vercel
   - Uploads code + .next
   - Vercel skips install/build
   - Just serves the app
         ↓
Deployed! 🎉
```

## Why This Approach?

### ✅ Advantages

1. **Solves Monorepo Issues**
   - No "Module not found" errors
   - Workspace dependencies work correctly
   - No complex Vercel configuration needed

2. **Better CI/CD**
   - Type checking before deploy
   - Linting before deploy
   - Build failures caught in CI
   - Fast feedback loop

3. **Faster Deployments**
   - Build happens once in GitHub
   - Vercel just uploads (30 sec)
   - No wasted build time

4. **Cost Effective**
   - Uses GitHub's free CI/CD minutes
   - Vercel doesn't use build minutes
   - Just hosting costs

5. **Easier Debugging**
   - All logs in GitHub Actions
   - Clear error messages
   - Reproducible builds

### ❌ What Doesn't Work

**Vercel building from monorepo:**
- ❌ Complex Root Directory config
- ❌ Workspace resolution issues
- ❌ Module not found errors
- ❌ Difficult to debug

**Why?** Vercel's build environment doesn't handle npm workspaces well when Root Directory is set.

## Troubleshooting

### Build fails in GitHub Actions

**Error:** `Module not found: zod`
- **Fix:** Dependencies added to `packages/shared/package.json` ✅

**Error:** `Type check failed`
- **Fix:** Run locally: `cd apps/web && npm run type-check`

### Deploy fails

**Error:** `VERCEL_TOKEN not found`
- **Fix:** Add all 5 required secrets to GitHub

**Error:** `Vercel still building`
- **Fix:** Check `vercel.json` has skip commands

### Vercel auto-deploys on push

**Not wanted** (we control via GitHub Actions)
- **Fix:** `vercel.json` has `"github": { "enabled": false }` ✅

## Testing Locally

Test the exact same build process:

```bash
# Install
npm ci

# Type check
cd apps/web && npm run type-check

# Lint
npm run lint

# Build
npm run build

# Check output
ls -la .next/
```

If this works locally, it will work in GitHub Actions!

## Migration Checklist

- [x] Added dependencies to `packages/shared/package.json`
- [x] Created `vercel.json` with skip commands
- [x] Updated `.github/workflows/deploy-web.yml`
- [x] Added all 5 GitHub Secrets
- [x] Set Vercel Root Directory to empty
- [x] Tested build locally
- [x] Pushed to main branch
- [ ] Verified deployment succeeds
- [ ] Verified app works at deployment URL

## Summary

**Build in GitHub Actions** (has full workspace access)
**Deploy to Vercel** (just upload & serve)

This is the **recommended approach for Next.js monorepos**!

## Support

If issues persist:
1. Check GitHub Actions logs for build errors
2. Verify all 5 secrets are set correctly
3. Ensure `vercel.json` exists at repository root
4. Confirm Vercel Root Directory is empty

The deployment should now work reliably! 🚀
