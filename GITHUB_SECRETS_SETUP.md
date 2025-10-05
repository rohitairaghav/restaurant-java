# GitHub Secrets Setup for Vercel Deployment

This guide explains how to configure GitHub repository secrets for automatic Vercel deployment via GitHub Actions.

## Required Secrets

Your GitHub repository needs these 5 secrets:

| Secret Name | Purpose | Where to Get It |
|------------|---------|-----------------|
| `VERCEL_TOKEN` | Authenticates GitHub Actions with Vercel | Vercel Account Settings |
| `VERCEL_ORG_ID` | Your Vercel organization/user ID | Vercel Settings |
| `VERCEL_PROJECT_ID` | Your specific project ID | Vercel Project Settings |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase database URL | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public API key | Supabase Dashboard |

## Step-by-Step Setup

### 1. Get VERCEL_TOKEN

1. Go to https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Enter a descriptive name: `GitHub Actions Deployment`
4. Scope: Select "Full Account"
5. Expiration: Choose based on your needs:
   - **No Expiration** - Recommended for production (requires manual rotation)
   - **Custom** - Good for testing
6. Click **"Create"**
7. **Copy the token immediately** (you won't see it again!)

### 2. Get VERCEL_ORG_ID

**Method 1: Via Vercel Dashboard**
1. Go to https://vercel.com/account
2. Scroll to find your **User ID** (personal account)
3. Or for teams: https://vercel.com/teams/[your-team]/settings → **Team ID**

**Method 2: Via Vercel CLI**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login and get your ID
vercel whoami
# This shows your username and team info
```

**Method 3: Check .vercel directory (if you've deployed before)**
```bash
cat apps/web/.vercel/project.json
# Look for "orgId"
```

### 3. Get VERCEL_PROJECT_ID

**Method 1: Via Vercel Dashboard**
1. Go to your Vercel project
2. Click **Settings** in the top navigation
3. Go to **General** tab
4. Scroll down to find **Project ID**
5. Click the copy icon

**Method 2: Via .vercel directory**
```bash
cat apps/web/.vercel/project.json
# Look for "projectId"
```

### 4. Get Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon/public** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Important**: Use the `anon` key, NOT the `service_role` key!

### 5. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. In the left sidebar, expand **Secrets and variables**
4. Click **Actions**
5. Click **"New repository secret"**

For each secret:

1. Enter the **Name** exactly as shown below (case-sensitive):
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Paste the **Secret** value

3. Click **"Add secret"**

4. Repeat for all 5 secrets

### 6. Verify Setup

After adding all secrets, your Actions secrets page should show:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY    ••••••••    Updated X ago
NEXT_PUBLIC_SUPABASE_URL         ••••••••    Updated X ago
VERCEL_ORG_ID                    ••••••••    Updated X ago
VERCEL_PROJECT_ID                ••••••••    Updated X ago
VERCEL_TOKEN                     ••••••••    Updated X ago
```

### 7. Test the Workflow

1. Make a small change to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test GitHub Actions deployment"
   git push origin main
   ```
3. Go to your GitHub repository → **Actions** tab
4. Watch the workflow run
5. If successful, your app is deployed!

## Security Best Practices

✅ **DO:**
- Use the `anon` key for Supabase (it's safe, protected by RLS)
- Rotate `VERCEL_TOKEN` periodically
- Use different Supabase projects for dev/staging/production
- Review which GitHub users have access to your repository

❌ **DON'T:**
- Share your `VERCEL_TOKEN` or commit it to code
- Use the Supabase `service_role` key in frontend/GitHub Actions
- Give `VERCEL_TOKEN` more permissions than needed
- Commit `.vercel/` directory to git

## Troubleshooting

### Secret not found error
- Double-check secret names are spelled exactly right (case-sensitive)
- Ensure you added secrets to the correct repository
- Secrets are available immediately after adding (no delay)

### Invalid token error
- Regenerate the `VERCEL_TOKEN` in Vercel
- Make sure you copied the entire token
- Check token hasn't expired

### Wrong org/project ID
- Verify IDs match your actual Vercel project
- Use `vercel whoami` to confirm your org ID
- Check `.vercel/project.json` for correct IDs

### Deployment succeeds but app doesn't work
- Check you're using the `anon` key, not `service_role`
- Verify Supabase URL includes `https://`
- Check Vercel deployment logs for errors

## Alternative: Skip GitHub Actions

If you prefer to deploy directly through Vercel (not GitHub Actions):

1. Connect your GitHub repo to Vercel directly
2. Vercel will automatically deploy on every push
3. You only need to set environment variables in Vercel Dashboard
4. You can optionally disable the `.github/workflows/deploy-web.yml` workflow

## Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
