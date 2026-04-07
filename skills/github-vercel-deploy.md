---
name: github-vercel-deploy
description: "Workflow completo para publicar um projeto web no GitHub e fazer deploy na Vercel. Use quando o usuário pedir para publicar, deployar, fazer go live ou hospedar um site."
---

# Publish to GitHub + Vercel Skill

End-to-end workflow for pushing a web project to GitHub and deploying it live on Vercel with zero hiccups. Incorporates all known gotchas and best practices.

---

## When to Use This Skill

- User asks to "publish", "deploy", "make live", or "push" a website
- User wants to create a GitHub repo for a project
- User wants to deploy to Vercel
- User says "go live", "host this", or "put it online"
- User wants to update an already-deployed site

## Prerequisites

### Required Tools

Verify these are installed and authenticated before starting:

```bash
# GitHub CLI
which gh && gh auth status 2>&1

# Vercel CLI
which vercel && vercel whoami 2>&1
```

### If GitHub CLI is NOT installed

```bash
brew install gh
gh auth login --web --git-protocol https
```

### If Vercel CLI is NOT installed or NOT authenticated

```bash
# Install
npm i -g vercel

# Authenticate (opens browser)
vercel login
```

---

## Workflow Checklist

```
- [ ] Step 1: Pre-flight checks (tools + auth)
- [ ] Step 2: Prepare project for deployment
- [ ] Step 3: Create GitHub repository
- [ ] Step 4: Commit and push code
- [ ] Step 5: Deploy to Vercel
- [ ] Step 6: Verify deployment
- [ ] Step 7: Report to user
```

---

## Instructions

### Step 1: Pre-Flight Checks

Run these checks BEFORE doing anything else:

```bash
# Check GitHub CLI auth
gh auth status 2>&1

# Check Vercel CLI auth
vercel whoami 2>&1
```

If either is not authenticated, follow the prerequisite steps above. **Do NOT proceed until both are authenticated.**

### Step 2: Prepare Project for Deployment

This is the **MOST CRITICAL STEP** — skipping this causes deployment failures.

#### 2a: Static Assets -> `public/` Directory (CRITICAL for Vite/React)

Static assets (images, logos, fonts, favicons) MUST be in the `public/` directory for Vite-based projects. Files in the project root are NOT served as static files in production.

```bash
# Create public directory if it doesn't exist
mkdir -p public

# Move/copy ALL static assets to public/
find . -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.svg" -o -name "*.gif" -o -name "*.ico" -o -name "*.webp" -o -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" \) ! -path "./node_modules/*" -exec cp {} public/ \;
```

**Check component references:** Verify that any `<img src="/filename.ext">` references have the corresponding file in `public/`.

#### 2b: Environment Variables

Check if the project uses environment variables:

```bash
grep -rn 'import.meta.env\|process.env\|VITE_' --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" . | grep -v node_modules | head -20
```

If env vars are found, note them — they'll need to be set in Vercel (Step 5b).

#### 2c: Build Test (Recommended)

```bash
npm run build 2>&1
```

If the build fails, fix errors before proceeding.

#### 2d: Verify `.gitignore`

Ensure these are in `.gitignore`:

```
node_modules/
dist/
.vercel/
.env
.env.local
.env.*.local
```

### Step 3: Create GitHub Repository

#### 3a: Check for existing git repo

```bash
git remote -v 2>&1
```

#### 3b: If NO git repo exists, initialize one

```bash
git init
git add -A
git commit -m "Initial commit"
```

#### 3c: Create the GitHub repo

```bash
# Public repo (recommended for Vercel free tier)
gh repo create my-project-name --public --source=. --push --description "My project description"
```

#### 3d: If repo already exists but remote is wrong (common with cloned projects)

```bash
# Create repo first (without --source and --push)
gh repo create my-project-name --public --description "My project description"

# Update the remote
git remote set-url origin https://github.com/USERNAME/my-project-name.git

# Push
git push -u origin main --force
```

### Step 4: Commit and Push Code

```bash
git add -A
git status  # Review what's being committed
git commit -m "feat: descriptive message about what changed"
git push origin main
```

### Step 5: Deploy to Vercel

#### 5a: Deploy with auto-detection

```bash
vercel --yes --prod 2>&1
```

#### 5b: Set environment variables (if needed)

```bash
vercel env add VARIABLE_NAME production
```

After adding env vars, trigger a redeploy:

```bash
vercel --prod 2>&1
```

### Step 6: Verify Deployment

Load the production URL in a browser and verify:

- [ ] Page loads without errors
- [ ] Images/logos display correctly
- [ ] No console errors
- [ ] Layout looks correct on mobile and desktop

### Step 7: Report to User

Provide a clean summary with Live URL, GitHub Repository, Deployment Status, Framework, and Auto-Deploy status.

---

## Updating an Already-Deployed Site

If the site is already on Vercel and connected to GitHub:

```bash
git add -A
git commit -m "fix: describe what changed"
git push origin main
```

Vercel will auto-redeploy within ~15 seconds.

---

## Error Handling

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Unable to add remote "origin"` | Cloned project already has `origin` | Use `git remote set-url origin NEW_URL` |
| Broken images on Vercel | Static files not in `public/` | Move all static assets to `public/` directory |
| `gh: not found` | GitHub CLI not installed | `brew install gh` |
| `vercel: command not found` | Vercel CLI not installed | `npm i -g vercel` |
| Build fails on Vercel | TypeScript/dependency errors | Run `npm run build` locally first and fix errors |
| 404 on page refresh (SPA) | Missing rewrite rules | Add `vercel.json` with rewrites |

### Vite-Specific Gotchas

1. **Static assets MUST be in `public/`** — This is the #1 deployment issue
2. **`base` in vite.config.ts** — Should be `'/'` for Vercel
3. **SPA routing** — Add `vercel.json` with rewrites if using client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Quick Reference: Full Deploy in 4 Commands

```bash
# 1. Create GitHub repo + push
gh repo create my-project-name --public --source=. --push --description "My project description"

# 2. Deploy to Vercel
vercel --yes --prod

# 3. Done! Future updates:
git add -A && git commit -m "update: description" && git push origin main
```
