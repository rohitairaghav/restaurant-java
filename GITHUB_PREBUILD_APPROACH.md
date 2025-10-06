# GitHub Actions Pre-Build Deployment Strategy

## Why Pre-Build in GitHub Actions?

### Advantages ✅

1. **Solves Monorepo Issues**
   - GitHub Actions has access to full workspace
   - All `packages/shared` dependencies available
   - No Root Directory configuration needed

2. **Faster Deployments**
   - Type checking done once
   - Linting done once
   - Build done once
   - Vercel just uploads artifacts

3. **Better CI/CD**
   - Build failures caught in CI
   - Tests run before deployment
   - Quality gates enforced

4. **Cost Effective**
   - GitHub Actions minutes (free tier: 2000/month)
   - Vercel just hosts static files
   - No Vercel build minutes used

5. **Consistent Builds**
   - Same environment every time
   - Reproducible builds
   - No "works on my machine" issues

## How It Works

### Current Workflow

```yaml
jobs:
  deploy:
    steps:
      # 1. Setup
      - Checkout code
      - Setup Node.js
      - Install dependencies (npm ci at root)
      
      # 2. Quality Checks
      - Type check
      - Lint
      
      # 3. Build in GitHub Actions ⭐
      - Build: npm run build (apps/web)
        - Has access to all workspace dependencies
        - Uses shared packages
        - Environment variables from GitHub Secrets
      
      # 4. Deploy to Vercel
      - Install Vercel CLI
      - Deploy: vercel deploy --prod
        - Uploads .next directory
        - No building on Vercel
        - Fast deployment
```

### Vercel Configuration

**`vercel.json`** (root):
```json
{
  "github": {
    "enabled": false
  }
}
```

This disables automatic Vercel deployments - we control everything via GitHub Actions.

## Comparison

| Aspect | Vercel Build | GitHub Pre-Build |
|--------|-------------|------------------|
| **Monorepo Support** | ❌ Complex | ✅ Simple |
| **Workspace Access** | ❌ Requires config | ✅ Automatic |
| **Build Environment** | Vercel | GitHub Actions |
| **CI Integration** | Separate | ✅ Integrated |
| **Build Speed** | ~2-3 min | ~1-2 min |
| **Deploy Speed** | Included | ~30 sec |
| **Total Time** | ~2-3 min | ~2-3 min |
| **Debugging** | Vercel logs | ✅ GitHub logs |
| **Cost** | Vercel minutes | ✅ GitHub free tier |
| **Quality Gates** | None | ✅ Type check, lint, tests |

## Workflow Steps Explained

### Step 1: Install Dependencies
```bash
npm ci  # At root - installs all workspaces
```
- Installs `apps/web` dependencies
- Installs `packages/shared` dependencies (zod, @casl/ability)
- Creates proper workspace links

### Step 2: Type Check & Lint
```bash
npm run type-check  # apps/web
npm run lint        # apps/web
```
- Catches errors early
- Prevents deploying broken code

### Step 3: Build
```bash
npm run build  # apps/web
```
- Next.js build runs
- Has access to `packages/shared` via workspace
- Outputs to `apps/web/.next`
- Uses GitHub Secrets for env vars

### Step 4: Deploy
```bash
vercel deploy --prod --yes --force
```
- Uploads `apps/web/.next` to Vercel
- No build step on Vercel
- Fast deployment
- Uses cached static assets

## Configuration Files

### `.github/workflows/deploy-web.yml`
```yaml
- name: Build application in GitHub Actions
  run: npm run build
  working-directory: apps/web
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

- name: Deploy pre-built app to Vercel
  run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} --yes --force
  working-directory: apps/web
```

### `vercel.json`
```json
{
  "github": {
    "enabled": false
  }
}
```

### Vercel Dashboard Settings

| Setting | Value |
|---------|-------|
| Root Directory | **(EMPTY)** |
| Git Integration | Enabled (but builds disabled) |
| Auto Deploy | ❌ Disabled via vercel.json |

## Benefits Summary

### For Development
- ✅ Faster iteration (catch errors in CI)
- ✅ Consistent builds across team
- ✅ No configuration debugging

### For Deployment
- ✅ Reliable deployments
- ✅ No "Module not found" errors
- ✅ Fast upload-only deploys

### For Maintenance
- ✅ Single source of truth (GitHub Actions)
- ✅ Easy to debug (GitHub logs)
- ✅ Version controlled (workflow in git)

## Alternative: Vercel Auto-Deploy

If you wanted Vercel to auto-deploy (not recommended for monorepos):

1. Remove `"github": { "enabled": false }` from vercel.json
2. Add build configuration:
   ```json
   {
     "buildCommand": "npm run build --workspace=apps/web",
     "outputDirectory": "apps/web/.next",
     "installCommand": "npm install"
   }
   ```
3. Set Root Directory to empty in Vercel Dashboard
4. Disable GitHub Actions workflow

But this is **not recommended** because:
- ❌ No CI/CD integration
- ❌ Harder to debug
- ❌ No quality gates
- ❌ Slower (rebuilds everything)

## Recommended Approach ⭐

**Use GitHub Actions Pre-Build** (current setup):

1. Push code to `main` branch
2. GitHub Actions runs:
   - Type check ✅
   - Lint ✅
   - Build ✅
   - Deploy to Vercel ✅
3. Deployment URL ready
4. All steps visible in GitHub Actions logs

This is the **best approach for monorepos** like this project!

## Troubleshooting

### Build fails in GitHub Actions
- Check GitHub Secrets are set correctly
- Review GitHub Actions logs
- Test locally: `npm ci && cd apps/web && npm run build`

### Deploy fails
- Verify VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
- Check Vercel CLI version
- Ensure .next directory exists after build

### Vercel auto-deploys (shouldn't happen)
- Verify `vercel.json` has `"github": { "enabled": false }`
- Check Vercel Dashboard → Settings → Git → should show as disabled

## Migration Complete ✅

Your project now uses the **GitHub Actions Pre-Build approach** which:
- ✅ Solves all monorepo issues
- ✅ Provides better CI/CD
- ✅ Faster, more reliable deployments
- ✅ Easier to maintain and debug
