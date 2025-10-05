# GitHub Actions Vercel Deployment - Monorepo Fix

## Problem
Getting error: `The specified Root Directory "apps/web" does not exist`

This happens because the `amondnet/vercel-action` GitHub Action doesn't handle monorepos well.

## Solution Applied ✅

The `.github/workflows/deploy-web.yml` has been updated to use **Vercel CLI directly** instead of the GitHub Action.

### What Changed

**Before (Broken):**
```yaml
- uses: amondnet/vercel-action@v25.2.0
  with:
    working-directory: apps/web
    vercel-args: '--prod --cwd apps/web'
```
This tried to look for `apps/web/apps/web` ❌

**After (Fixed):**
```yaml
- name: Deploy to Vercel
  run: |
    vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
    vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
    vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
  working-directory: apps/web
```
This runs from inside `apps/web` directory ✅

## How It Works Now

1. **Checkout code** - Gets your repository
2. **Setup Node** - Installs Node.js 18
3. **Install dependencies** - Runs `npm ci` at root
4. **Type check** - Runs from `apps/web`
5. **Lint** - Runs from `apps/web`
6. **Install Vercel CLI** - Gets latest Vercel CLI
7. **Deploy**:
   - `vercel pull` - Gets project configuration from Vercel
   - `vercel build` - Builds the project
   - `vercel deploy --prebuilt` - Deploys the pre-built artifacts

All Vercel commands run with `working-directory: apps/web`, so they execute from inside the web app directory.

## Required GitHub Secrets

Make sure these are set in your GitHub repository:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Your Vercel authentication token |
| `VERCEL_ORG_ID` | Your Vercel organization/user ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Vercel Project Settings

For GitHub Actions deployment, you **don't need** to set a Root Directory in Vercel Dashboard.

However, if you want to also enable automatic Vercel deployments (bypassing GitHub Actions):

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Set **Root Directory**: `apps/web`
3. Set **Build Command**: `npm run build`
4. Set **Install Command**: `npm install`

## Testing the Fix

1. Commit the updated workflow:
   ```bash
   git add .github/workflows/deploy-web.yml
   git commit -m "Fix Vercel deployment for monorepo"
   git push origin main
   ```

2. Check GitHub Actions:
   - Go to your repo → **Actions** tab
   - Watch the "Deploy Web App" workflow
   - Should complete successfully ✅

3. Verify deployment:
   - Check the Vercel URL from the workflow output
   - Test the deployed app

## Advantages of This Approach

✅ **Works with monorepos** - Properly handles `apps/web` structure
✅ **More control** - Direct Vercel CLI gives you full control
✅ **Better debugging** - Clearer error messages
✅ **Consistent** - Same commands work locally and in CI
✅ **Type checking** - Runs type check before deploying
✅ **Linting** - Runs linting before deploying

## Rollback (if needed)

If you need to revert to manual Vercel deployments:

1. Go to Vercel Dashboard
2. Connect your GitHub repository
3. Vercel will auto-deploy on every push to `main`
4. You can disable the GitHub Actions workflow

## Local Testing

You can test the same commands locally:

```bash
cd apps/web

# Login to Vercel
vercel login

# Pull project configuration
vercel pull --yes --environment=production

# Build
vercel build --prod

# Deploy
vercel deploy --prebuilt --prod
```

## Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
