# Supabase Integration Guide

## ✅ Current Status

Your **rhema-care-flow** project is already integrated with Supabase with:
- ✅ TypeScript client configured (`src/integrations/supabase/client.ts`)
- ✅ Database types generated (`src/integrations/supabase/types.ts`)
- ✅ Edge Functions for AI workflows
- ✅ Row-Level Security (RLS) for patient data privacy
- ✅ Migrations infrastructure

## 🚀 Quick Setup

### 1. Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project (or use existing)
2. In your project dashboard, go to **Settings → API**
3. Copy:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGci...`)

> ⚠️ **SECURITY**: Never use the Service Role Key in the frontend. Use only the Public/Anon key.

### 2. Configure Environment Variables

Create `.env.local` in your project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Verify Setup

```bash
npm install  # Already has @supabase/supabase-js@^2.94.1
npm run dev
```

Visit `http://localhost:5173` and check browser console for errors.

## 🔐 Security Best Practices

### Don't Do This ❌
```typescript
// ❌ WRONG: Exposing secrets in code
const token = "sbp_3b0fc88a7dbfa5d5887919c90e70a7e19d6f5dda";
const supabase = createClient(URL, token);
```

### Do This Instead ✅
```typescript
// ✅ CORRECT: Use environment variables
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

### GitHub Secrets for CI/CD
If you use GitHub Actions, add secrets in **Settings → Secrets and variables → Actions**:
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY  # Only for backend/migrations
```

## 📊 Database Schema

Your database includes tables for:
- **Patient Management**: `patient_cards`, `patient_cards_secure`
- **Clinical Data**: `score_entries`, `infusion_events`, `consultation_sessions`
- **Research**: `ai_research_pipeline`, `knowledge_contributions`
- **Security**: `audit_logs`, `custody_audit_log`
- **Learning**: `case_studies`, `education_content`
- **Productivity**: `tasks`, `focus_sessions`

All clinical tables have **Row-Level Security (RLS)** enabled.

## 📦 Deploy to Production

### Vercel
1. Add environment variables in **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Deploy normally

### Netlify
1. Go to **Site settings → Build & deploy → Environment**
2. Add the same variables
3. Deploy

### Docker/Self-hosted
```bash
docker build -t rhema-care-flow .
docker run -e VITE_SUPABASE_URL=... -e VITE_SUPABASE_PUBLISHABLE_KEY=... rhema-care-flow
```

## 🔧 Local Development with Supabase CLI

For local database development:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize (if not already done)
supabase init

# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Stop
supabase stop
```

Then update `.env.local`:
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚨 If Your Token Leaks

**IMMEDIATELY:**
1. Go to Supabase Dashboard → Settings → API Keys
2. Delete/regenerate the compromised key
3. Update `.env.local` with the new key
4. If exposed to GitHub, you can use `git-filter-branch` to remove from history
5. Rotate Supabase encryption keys if applicable

## 📚 Useful Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Database Best Practices](https://supabase.com/docs/guides/database/best-practices)

## ❓ Troubleshooting

### "VITE_SUPABASE_URL is undefined"
→ Check `.env.local` exists and reload dev server

### "Unauthorized (401)"
→ Check you're using Anon key, not Service Role key

### "RLS policy violation"
→ Check audit logs and RLS policies in Supabase Dashboard

### "Connection timeout"
→ Check project is active, or use local Supabase (`supabase start`)

## 🆘 Need Help?

- Check [GitHub Issues](https://github.com/JoaoRG-lab/rhema-care-flow/issues)
- [Supabase Support](https://supabase.com/support)
- [Project README](../README.md)
