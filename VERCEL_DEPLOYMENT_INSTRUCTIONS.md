# 🚀 VERCEL DEPLOYMENT INSTRUCTIONS - INOXYA BIJOUX

**Date:** 2025-01-18  
**Status:** ✅ Ready for Deployment

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- [x] Git repository initialized
- [x] Branch `deploy/vercel-final` created
- [x] Build passes locally (`npm run build`)
- [x] Middleware fixed (Edge-compatible)
- [x] All API routes use `nodejs` runtime
- [x] Database adapter ready for PostgreSQL
- [x] Storage adapter ready for Vercel Blob

---

## 🔧 PHASE 2 — VERCEL CLI DEPLOYMENT

### Step 1: Install/Verify Vercel CLI

```bash
# Check if installed
vercel --version

# If not installed:
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### Step 3: Link Project

```bash
# If project already exists on Vercel:
vercel link

# If creating new project:
vercel link --yes
```

**Note:** If you already have a project `inoxya-bijoux` on Vercel, it will be linked automatically.

---

## 🔐 PHASE 2.1 — CONFIGURE ENVIRONMENT VARIABLES

### Via Vercel Dashboard (RECOMMENDED)

1. Go to: https://vercel.com/dashboard
2. Select project: `inoxya-bijoux`
3. Settings → Environment Variables
4. Add the following:

#### REQUIRED Variables:

**1. DATABASE_URL**
- **Value:** PostgreSQL connection string from Neon
- **How to get:**
  1. Neon Dashboard → Your Project
  2. Connection Details → Copy Connection String
  3. Format: `postgresql://user:password@host:port/database?sslmode=require`
- **Environments:** Production, Preview, Development (check all)

**2. JWT_SECRET**
- **Value:** Generate a secure random string (min 32 characters)
- **How to generate:**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Environments:** Production, Preview, Development (check all)

**3. NEXT_PUBLIC_SITE_URL**
- **Value:** `https://www.inoxya.ma` (after domain setup)
- **Temporary:** Use preview URL for now, update after domain setup
- **Environments:** Production, Preview, Development (check all)

#### RECOMMENDED Variables:

**4. BLOB_READ_WRITE_TOKEN**
- **Value:** From Vercel Blob Storage
- **How to get:**
  1. Vercel Dashboard → Project → Storage
  2. Create Blob Storage (if not exists)
  3. Copy `BLOB_READ_WRITE_TOKEN`
- **Environments:** Production, Preview (check both)

#### OPTIONAL Variables:

**5. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL**
- Only if you want email notifications
- **Environments:** Production only

**6. UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN**
- Only if you want distributed rate limiting
- **Environments:** Production, Preview

---

## 📦 PHASE 2.2 — CREATE VERCEL BLOB STORAGE

### Via Vercel Dashboard:

1. Vercel Dashboard → Project `inoxya-bijoux`
2. Storage tab (or Settings → Storage)
3. Click "Create Database" or "Add Storage"
4. Select "Blob"
5. Name: `inoxya-blob` (or any name)
6. Region: Choose closest to your users
7. Click "Create"
8. Copy `BLOB_READ_WRITE_TOKEN` and add to Environment Variables

---

## 🚀 PHASE 2.3 — DEPLOY PREVIEW

```bash
# Deploy to preview (non-production)
vercel deploy
```

**Expected output:**
- Preview URL: `https://inoxya-bijoux-xxxxx.vercel.app`
- Build logs
- Deployment status

**After deployment:**
1. Test the preview URL
2. Check logs: `vercel logs <deployment-url>`
3. Verify:
   - Home page loads
   - Products page loads
   - No 500 errors

---

## ✅ PHASE 2.4 — DEPLOY PRODUCTION

```bash
# Deploy to production
vercel --prod
```

**Expected output:**
- Production URL: `https://inoxya-bijoux.vercel.app`
- Build logs
- Deployment status

**After deployment:**
1. Test the production URL
2. Check logs: `vercel logs inoxya-bijoux.vercel.app`
3. Verify all functionality

---

## 🌐 PHASE 3 — DOMAIN CONFIGURATION

### Step 1: Add Domains in Vercel

**Via Dashboard:**
1. Vercel Dashboard → Project `inoxya-bijoux`
2. Settings → Domains
3. Click "Add Domain"
4. Add: `www.inoxya.ma`
5. Add: `inoxya.ma` (for redirect)

**Via CLI:**
```bash
vercel domains add www.inoxya.ma
vercel domains add inoxya.ma
```

### Step 2: Configure DNS Records

Vercel will show you the DNS records needed. **Copy these exactly:**

**For www.inoxya.ma:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For inoxya.ma (apex):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**OR (if your registrar supports ALIAS/ANAME):**
```
Type: ALIAS
Name: @
Value: cname.vercel-dns.com
```

### Step 3: Add DNS Records to Registrar

1. Go to your domain registrar (where you bought `inoxya.ma`)
2. Open DNS management
3. Add the records shown by Vercel
4. Wait for DNS propagation (5-60 minutes)

### Step 4: Verify Domain

1. Vercel Dashboard → Domains
2. Wait for "Valid Configuration" status
3. SSL certificate will be issued automatically

### Step 5: Configure Redirect (inoxya.ma → www.inoxya.ma)

**Option A: Via Vercel Dashboard**
1. Settings → Domains
2. Click on `inoxya.ma`
3. Enable "Redirect to www.inoxya.ma"

**Option B: Via next.config.mjs (if needed)**
Add redirect in `next.config.mjs`:
```javascript
async redirects() {
  return [
    {
      source: '/',
      has: [{ type: 'host', value: 'inoxya.ma' }],
      destination: 'https://www.inoxya.ma',
      permanent: true,
    },
  ]
}
```

### Step 6: Update NEXT_PUBLIC_SITE_URL

1. Vercel Dashboard → Environment Variables
2. Edit `NEXT_PUBLIC_SITE_URL`
3. Set to: `https://www.inoxya.ma`
4. Redeploy: `vercel --prod`

---

## ✅ PHASE 4 — FINAL PRODUCTION CHECKLIST

### Smoke Tests

**Home Page:**
- [ ] https://www.inoxya.ma loads
- [ ] https://inoxya.ma redirects to www
- [ ] Images load correctly
- [ ] Navigation works

**Products:**
- [ ] https://www.inoxya.ma/fr/bijoux loads
- [ ] Products display correctly
- [ ] Product details page works
- [ ] Images load from Blob or public/

**Cart & Checkout:**
- [ ] Add to cart works
- [ ] Cart page loads
- [ ] Checkout creates order
- [ ] Order appears in admin

**Admin:**
- [ ] https://www.inoxya.ma/admin loads
- [ ] Login works
- [ ] Products management works
- [ ] Orders management works

**SEO:**
- [ ] https://www.inoxya.ma/robots.txt accessible
- [ ] https://www.inoxya.ma/sitemap.xml accessible
- [ ] Metadata present in page source
- [ ] Canonical URLs use https://www.inoxya.ma

**Performance:**
- [ ] No 500 errors in logs
- [ ] No middleware errors
- [ ] Database queries work
- [ ] File uploads work (if tested)

---

## 🆘 TROUBLESHOOTING

### Error: MIDDLEWARE_INVOCATION_FAILED

**Solution:** Already fixed in Phase 1. If persists:
1. Check logs: `vercel logs <deployment-url>`
2. Verify middleware.ts uses `import()` not `require()`
3. Redeploy: `vercel --prod`

### Error: Cannot find module '@opentelemetry/api'

**Solution:** Already fixed in Phase 1. If persists:
1. Check `next.config.mjs` has `@opentelemetry/*` in `serverExternalPackages`
2. Redeploy: `vercel --prod`

### Error: Database connection failed

**Solution:**
1. Verify `DATABASE_URL` in Environment Variables
2. Verify PostgreSQL tables exist (run `scripts/neon-setup-complete.sql`)
3. Check Neon connection string format
4. Verify SSL is enabled in connection string

### Error: Images not loading

**Solution:**
1. Verify `BLOB_READ_WRITE_TOKEN` is set
2. Check Vercel Blob Storage is created
3. Verify images are uploaded to Blob or exist in `public/images/`

---

## 📊 DEPLOYMENT SUMMARY

**Branch:** `deploy/vercel-final`  
**Commits:** 3
1. Initial commit (pre-deployment state)
2. fix(middleware): Convert require() to dynamic import()
3. docs: Add final deployment report and checklist

**Status:** ✅ READY FOR DEPLOYMENT

---

## 🎯 NEXT ACTIONS

1. **Run:** `vercel login`
2. **Run:** `vercel link` (or create new project)
3. **Configure:** Environment Variables in Vercel Dashboard
4. **Create:** Vercel Blob Storage
5. **Deploy:** `vercel deploy` (preview)
6. **Test:** Preview URL
7. **Deploy:** `vercel --prod` (production)
8. **Configure:** Domain www.inoxya.ma
9. **Test:** Production URL

---

**Ready to deploy! 🚀**

