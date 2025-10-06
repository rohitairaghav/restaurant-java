# CRITICAL FIX: Vercel Monorepo Deployment

## The Problem

Vercel can't find `zod` and `@casl/ability` even though they're in `packages/shared/package.json`:

```
Module not found: Can't resolve '@casl/ability'
Module not found: Can't resolve 'zod'
```

## Root Cause

When Vercel's **Root Directory** is set to `apps/web`, it:
1. Only installs dependencies from `apps/web/package.json`
2. Ignores the workspace structure
3. Doesn't install `packages/shared` dependencies

## Solution: Remove Root Directory Setting

### Step 1: Update Vercel Project Settings

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. Click **Edit**
5. **Clear the field completely** (remove `apps/web`)
6. Leave it **EMPTY**
7. Click **Save**

### Step 2: Verify Other Settings

In Settings → General, ensure:

| Setting | Value |
|---------|-------|
| **Root Directory** | **(EMPTY)** ⚠️ CRITICAL |
| **Framework Preset** | Other |
| **Build Command** | (empty - uses vercel.json) |
| **Output Directory** | (empty - uses vercel.json) |
| **Install Command** | (empty - uses vercel.json) |

### Step 3: Configuration Files

The root `vercel.json` now handles everything:

```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install",
  "framework": null
}
```

This tells Vercel to:
- Run `npm install` at the ROOT (installs all workspaces)
- Build from `apps/web` directory
- Output is in `apps/web/.next`

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Find latest deployment
3. Click **"..."** menu → **Redeploy**
4. ✅ Should now work!

## Why This Works

```
Root of repo
├── package.json (workspace root)
├── package-lock.json (contains ALL dependencies)
├── vercel.json (build configuration)
├── node_modules/ (contains zod, @casl/ability, etc.)
├── packages/
│   └── shared/
│       ├── package.json (depends on zod, @casl/ability)
│       └── abilities.ts (imports @casl/ability)
└── apps/
    └── web/
        ├── package.json
        ├── .next/ (build output)
        └── components/ (imports from ../../packages/shared)
```

When Vercel runs from the root:
1. ✅ `npm install` installs all workspace dependencies
2. ✅ `apps/web` can access `packages/shared` via npm workspaces
3. ✅ `packages/shared` has its dependencies (`zod`, `@casl/ability`)
4. ✅ Build succeeds

When Vercel runs from `apps/web` (with Root Directory set):
1. ❌ Only installs `apps/web/package.json` dependencies
2. ❌ Can't access `packages/shared` dependencies
3. ❌ Build fails with "Module not found"

## Verification Checklist

After redeploying:

- [ ] Build logs show: `Running "install" command: npm install` (at root)
- [ ] No "Module not found" errors for `zod` or `@casl/ability`
- [ ] Build completes successfully
- [ ] Deployment succeeds
- [ ] App works at deployment URL

## Alternative: GitHub Actions Only

If you want to deploy ONLY via GitHub Actions (not Vercel auto-deploy):

1. Keep Root Directory empty in Vercel
2. Disable automatic Git deployments:
   - Settings → Git → **Ignored Build Step** → Return exit code `1`
3. Only deploy via GitHub Actions workflow

The GitHub Actions workflow already works correctly because it:
- Runs `npm ci` at root
- Builds from `apps/web` with workspace access
- Deploys via Vercel CLI

## Files Updated

- ✅ `vercel.json` (root) - Monorepo build configuration
- ✅ `packages/shared/package.json` - Added dependencies
- ✅ `.github/workflows/deploy-web.yml` - Proper workflow

## Next Steps

1. **Clear Root Directory in Vercel Dashboard** (most important!)
2. Commit and push changes:
   ```bash
   git add .
   git commit -m "Fix Vercel monorepo deployment configuration"
   git push origin main
   ```
3. Redeploy from Vercel Dashboard
4. Verify deployment succeeds

## Support

If still failing, check:
- Root Directory is truly empty (not `apps/web`)
- `vercel.json` exists at repository root
- Build Command/Install Command fields are empty (using vercel.json)
