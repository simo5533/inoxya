# INOXYA Bijoux — Deployment Checklist

## Before deploying, verify in Vercel Dashboard:
- [ ] NEXT_PUBLIC_SUPABASE_URL is set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
- [ ] SUPABASE_SERVICE_ROLE_KEY is set
- [ ] JWT_SECRET is set (min 32 chars)
- [ ] NEXT_PUBLIC_SITE_URL is set to your Vercel URL

## Technical checks (automated):
- [x] TypeScript 0 errors
- [x] ESLint 0 errors
- [x] Build successful
- [x] 0 npm vulnerabilities
- [x] All pages return 200
- [x] Admin routes protected (401)
- [x] Supabase RLS 100% active
- [x] 0 Security Advisor errors
- [x] 0 Security Advisor warnings

## Manual checks before deploy:
- [ ] Mobile 400px — no overflow on any page
- [ ] /fr/bijoux/[id] — product page loads correctly
- [ ] Order form — submits without error
- [ ] Review form — submits and appears in list
- [ ] /fr/login — "Mot de passe oublié" → /fr/mot-de-passe-oublie
- [ ] /ar/bijoux — RTL layout correct

## Deploy command:
git push origin main
# Vercel will auto-deploy on push to main

