# Deploy Guide — UHS Health OS / Rhema Care Flow

> **Canonical repository:** `JoaoRG-lab/rhema-care-flow` · branch `main`

## Quick reference

| Tool | Setting | Value |
|------|---------|-------|
| GitHub repo | owner/repo | `JoaoRG-lab/rhema-care-flow` |
| Branch | production | `main` (lowercase) |
| Framework | preset | `Vite` |
| Install | command | `npm install` |
| Build | command | `npm run build` |
| Output | directory | `dist` |

## Vercel Setup

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select **`JoaoRG-lab/rhema-care-flow`**
4. Set framework preset to **Vite**
5. Add environment variables:

```env
VITE_SUPABASE_URL=https://rfsaxstpfpigrjyiochi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your_anon_key>
```

6. Deploy

### ✅ Correct deploy metadata

```
githubOrg: JoaoRG-lab
githubRepo: rhema-care-flow
githubCommitRef: main
framework: vite
readyState: READY
```

### ❌ If you see any of these — it is WRONG

```
joaooz123-png          → wrong account
medconsult-os-starter  → legacy project, delete it
rhema-care-flow-*      → hash-suffixed clone, do not use
Mainn                  → wrong branch casing
nextjs                 → wrong framework
```

## Lovable Setup

1. Open Lovable project settings
2. Under **GitHub**, click **Change repository**
3. Select `JoaoRG-lab/rhema-care-flow`
4. Branch: `main`
5. Save

> If Lovable asks to create a new repo — **cancel** and choose "Connect existing repository" instead.

## Supabase

Project URL: `https://rfsaxstpfpigrjyiochi.supabase.co`

Never expose the `service_role` key on the frontend. Only use the `anon`/`publishable` key in `VITE_SUPABASE_PUBLISHABLE_KEY`.

## GitHub Actions

The workflow at `.github/workflows/deploy.yml` runs automatically on every push to `main`:
- TypeScript type-check
- ESLint
- Production build
- Verifies `dist/index.html` exists

Add these repository secrets in **Settings → Secrets → Actions**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

## Cleanup checklist

- [ ] Disconnect Lovable from `rhema-care-flow-e98622f0`
- [ ] Archive or delete `rhema-care-flow-e98622f0` (branch `Mainn`)
- [ ] Delete old Vercel projects: `medconsult-os-starter*`
- [ ] Confirm Vercel deploy shows `JoaoRG-lab/rhema-care-flow` in metadata
- [ ] Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to Vercel env vars
- [ ] Add same secrets to GitHub Actions (Settings → Secrets)
