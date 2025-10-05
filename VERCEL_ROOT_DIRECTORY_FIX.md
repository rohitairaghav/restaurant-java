# Fix: Vercel Root Directory Error

## Error Message
```
The specified Root Directory "apps/mobile" does not exist.
Please update your Project Settings.
```

## Problem
Your Vercel project is configured to deploy the **mobile app** (`apps/mobile`) instead of the **web app** (`apps/web`).

## Solution: Update Vercel Project Settings

### Step-by-Step Fix

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click on your project

2. **Open Settings**
   - Click **Settings** in the top navigation bar

3. **Navigate to General**
   - In the left sidebar, ensure you're on **General**

4. **Find Root Directory Setting**
   - Scroll down to the **Root Directory** section
   - You'll see it's currently set to: `apps/mobile`

5. **Edit the Root Directory**
   - Click the **Edit** button next to Root Directory
   - Clear the current value: `apps/mobile`
   - Enter the correct value: `apps/web`

6. **Save Changes**
   - Click **Save** button

7. **Verify Other Settings**
   
   While you're in Settings → General, verify these are correct:
   
   | Setting | Correct Value |
   |---------|---------------|
   | **Framework Preset** | Next.js |
   | **Root Directory** | `apps/web` ✅ |
   | **Build Command** | (leave empty or `npm run build`) |
   | **Output Directory** | (leave empty or `.next`) |
   | **Install Command** | (leave empty or `npm install`) |

8. **Redeploy**
   - Go to **Deployments** tab
   - Find the latest deployment
   - Click the three dots menu (`...`)
   - Click **Redeploy**
   - ✅ Deployment should now succeed!

## Why This Happened

You likely have both `apps/web` and `apps/mobile` in your repository (monorepo structure). When creating the Vercel project, you might have:

- Selected the wrong directory during initial setup, OR
- Had a previous project configuration for mobile

## Verification

After redeploying, check:

1. ✅ Build succeeds without "directory not found" errors
2. ✅ You can access your web app at the deployment URL
3. ✅ The app shows the web interface (not mobile)

## Alternative: Create New Vercel Project

If you prefer a clean start:

1. Delete the existing Vercel project (Settings → General → Delete Project)
2. Import the repository again
3. When prompted for Root Directory, enter: `apps/web`
4. Set environment variables
5. Deploy

## For GitHub Actions Deployment

If deploying via GitHub Actions, ensure your `VERCEL_PROJECT_ID` secret matches the **web project**, not the mobile project. Check:

```bash
# In GitHub repository settings
Settings → Secrets and variables → Actions

Verify VERCEL_PROJECT_ID is for the WEB project, not mobile
```

## Related Documentation

- See `VERCEL_DEPLOYMENT.md` for complete deployment guide
- See `GITHUB_SECRETS_SETUP.md` for GitHub Actions configuration
