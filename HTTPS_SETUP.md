# 🔒 Configuration HTTPS - INOXYA BIJOUX

## 📋 Vue d'ensemble

Ce projet est configuré pour fonctionner **uniquement en HTTPS** pour garantir la sécurité des données et des communications.

---

## 🚀 Démarrage rapide

### 1. Générer les certificats SSL (première fois)

```bash
npm run ssl:generate
```

### 2. Démarrer le serveur HTTPS

```bash
npm run dev:https
```

Le serveur sera accessible sur: **https://localhost:3443**

---

## 🔧 Configuration

### Développement local

Le projet utilise des **certificats SSL auto-signés** pour le développement local.

**Port HTTPS:** `3443` (configurable via `HTTPS_PORT`)

**Certificats:** Stockés dans `./certs/`
- `localhost-key.pem` - Clé privée
- `localhost.pem` - Certificat

### Production

En production, HTTPS est géré par:
- **Vercel**: HTTPS automatique avec certificats Let's Encrypt
- **Autres plateformes**: Configurez votre reverse proxy (Nginx, Apache) avec certificats SSL

---

## 🛡️ Sécurité HTTPS

### Headers de sécurité activés

- ✅ **Strict-Transport-Security (HSTS)**: Force HTTPS pendant 1 an
- ✅ **X-Content-Type-Options**: Empêche le MIME-sniffing
- ✅ **X-Frame-Options**: Protection contre le clickjacking
- ✅ **X-XSS-Protection**: Protection XSS
- ✅ **Referrer-Policy**: Contrôle des référents
- ✅ **Permissions-Policy**: Restrictions des fonctionnalités

### Redirection automatique

Le middleware Next.js redirige automatiquement toutes les requêtes HTTP vers HTTPS en production.

---

## 📝 Variables d'environnement

```env
# Port HTTPS (développement)
HTTPS_PORT=3443

# Hostname (développement)
HOSTNAME=localhost

# Environnement
NODE_ENV=production
```

---

## ⚠️ Avertissement navigateur (développement)

Les certificats auto-signés génèrent un avertissement de sécurité dans le navigateur. C'est **normal** pour le développement local.

**Pour continuer:**
1. Cliquez sur "Avancé" ou "Advanced"
2. Cliquez sur "Continuer vers localhost" ou "Proceed to localhost"

---

## 🔍 Vérification HTTPS

### Vérifier que HTTPS est actif

1. Ouvrez les outils de développement (F12)
2. Onglet "Network" ou "Réseau"
3. Vérifiez que toutes les requêtes utilisent `https://`

### Vérifier les headers de sécurité

```bash
curl -I https://localhost:3443
```

Vous devriez voir:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- Etc.

---

## 🐛 Dépannage

### Erreur: "Certificats SSL non trouvés"

**Solution:** Exécutez `npm run ssl:generate`

### Erreur: "OpenSSL n'est pas installé"

**Windows:**
- Téléchargez depuis: https://slproweb.com/products/Win32OpenSSL.html
- Ajoutez OpenSSL au PATH

**macOS:**
```bash
brew install openssl
```

**Linux:**
```bash
sudo apt-get install openssl
```

### Le navigateur bloque le certificat

C'est normal avec des certificats auto-signés. Cliquez sur "Avancé" puis "Continuer".

### Port déjà utilisé

Changez le port dans `.env.local`:
```env
HTTPS_PORT=3444
```

---

## 📚 Ressources

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Strict Transport Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OpenSSL Documentation](https://www.openssl.org/docs/)

---

**Dernière mise à jour:** ${new Date().toLocaleDateString('fr-FR')}

