# ⚡ QUICK START - DEPLOY TO VERCEL NOW

## 🚀 3 SIMPLE STEPS

### 1️⃣ Login & Link

```bash
vercel login
vercel link
```

**If asked:**
- "Set up and deploy?" → **Yes**
- "Which scope?" → Select your account
- "Link to existing project?" → **Yes** (if you have `inoxya-bijoux` project) OR **No** (to create new)

### 2️⃣ Configure Environment Variables

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Add these 3 REQUIRED:**
1. `DATABASE_URL` = Your Neon PostgreSQL connection string
2. `JWT_SECRET` = Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. `NEXT_PUBLIC_SITE_URL` = `https://www.inoxya.ma` (or preview URL for now)

**Add this RECOMMENDED:**
4. `BLOB_READ_WRITE_TOKEN` = From Vercel Blob Storage (create in Storage tab)

### 3️⃣ Deploy

```bash
# Preview first
vercel deploy

# Then production
vercel --prod
```

---

## ✅ DONE!

Your site will be live at: `https://inoxya-bijoux.vercel.app`

**Next:** Configure domain www.inoxya.ma (see VERCEL_DEPLOYMENT_INSTRUCTIONS.md)

---

**That's it! 🎉**

