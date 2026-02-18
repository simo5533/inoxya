#!/bin/bash
# Script de déploiement rapide sur Vercel pour www.inoxya.ma
# Usage: bash deploy-vercel.sh

echo "🚀 DÉPLOIEMENT VERCEL - www.inoxya.ma"
echo "======================================"
echo ""

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "   Installation: npm i -g vercel"
    exit 1
fi

# Vérifier que le build fonctionne
echo "📦 Vérification du build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Le build a échoué. Corrigez les erreurs avant de continuer."
    exit 1
fi

echo "✅ Build réussi!"
echo ""

# Vérifier les variables d'environnement
echo "🔐 Vérification des variables d'environnement..."
echo ""
echo "Variables requises:"
echo "  - NEXT_PUBLIC_SITE_URL=https://www.inoxya.ma"
echo "  - JWT_SECRET=<secret-généré>"
echo "  - NODE_ENV=production"
echo ""
read -p "Les variables sont-elles configurées dans Vercel? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Configurez d'abord les variables dans Vercel Dashboard"
    echo "   Settings → Environment Variables"
    exit 1
fi

# Déployer
echo "🚀 Déploiement en production..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DÉPLOIEMENT RÉUSSI!"
    echo ""
    echo "🌐 Vérifiez votre site sur:"
    echo "   - https://www.inoxya.ma"
    echo ""
    echo "📊 Dashboard Vercel:"
    echo "   https://vercel.com/dashboard"
else
    echo ""
    echo "❌ Le déploiement a échoué"
    echo "   Vérifiez les logs ci-dessus"
    exit 1
fi

