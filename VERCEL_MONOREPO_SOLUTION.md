# Vercel Monorepo Deployment - Final Solution

## Problem

Vercel's Git integration auto-deploy **cannot properly build npm workspace monorepos** when:
- Root Directory is set to project root (empty)
- The project uses npm workspaces (`packages/shared` referenced by `apps/web`)
- Workspace packages are not published to npm registry

**Error**: `Module not found: Can't resolve '@restaurant-inventory/shared'`

## Root Cause

When Vercel's Git integration deploys:
1. It uploads repository files to build environment
2. Runs `npm install` which should create workspace symlinks
3. **BUT** Next.js/Webpack cannot resolve the `@restaurant-inventory/shared` package even with:
   - `transpilePackages` configuration
   - Webpack alias configuration
   - TypeScript path mapping

The workspace resolution works locally and in GitHub Actions, but **not in Vercel's auto-deploy environment**.

## Solution: Use GitHub Actions Deployment Only

### Step 1: Disconnect Vercel Git Integration

**Go to Vercel Dashboard:**
1. Navigate to your project
2. **Settings → Git**
3. Click **"Disconnect"** to remove the Git integration
4. This stops Vercel from auto-deploying on every push

### Step 2: Verify GitHub Actions Deployment

The GitHub Actions workflow (`.github/workflows/deploy-web.yml`) is already configured to:

1. **Build in GitHub Actions** with full workspace support:
   ```yaml
   - npm ci                    # Install all workspaces
   - npm run type-check        # Type check
   - npm run lint              # Lint
   - npm run build             # Build (works with workspaces)
   ```

2. **Deploy built app to Vercel**:
   ```yaml
   - vercel deploy --prod      # Deploy using CLI
   ```

### Step 3: Trigger Deployment

After disconnecting Git integration:
- Push to `main` branch
- GitHub Actions will automatically:
  - Build the app
  - Deploy to Vercel
  - Provide deployment URL

## Why This Works

- **GitHub Actions**: Full control over build environment, npm workspaces work perfectly
- **Vercel CLI**: Accepts pre-built applications without rebuild
- **No auto-deploy**: Avoids Vercel's problematic Git integration

## Monitoring Deployments

**GitHub Actions**:
- Go to your repository
- Click "Actions" tab
- View "Deploy Web App" workflow runs

**Vercel Dashboard**:
- View deployments (will show "CLI" as source instead of "Git")
- Deployments will succeed because app is pre-built

## Alternative Solution (Not Recommended)

If you must keep Git integration, you would need to:
1. Publish `@restaurant-inventory/shared` to npm registry (private package)
2. OR restructure to avoid workspace dependencies
3. OR copy shared code into apps/web (code duplication)

**Recommended**: Disconnect Git integration and use GitHub Actions deployment.
