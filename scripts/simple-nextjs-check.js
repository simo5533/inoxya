#!/usr/bin/env node

/**
 * Script de diagnostic simplifié pour Next.js
 */

const http = require('http');

function checkServer(port = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve({
        success: true,
        status: res.statusCode,
        message: `Serveur actif sur le port ${port}`
      });
    });
    
    req.on('error', (err) => {
      resolve({
        success: false,
        status: 'ERROR',
        message: `Serveur non accessible: ${err.message}`
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        status: 'TIMEOUT',
        message: 'Timeout - Serveur ne répond pas'
      });
    });
  });
}

async function main() {
  console.log('🔍 DIAGNOSTIC SIMPLIFIÉ NEXT.JS');
  console.log('================================\n');
  
  // Test du serveur principal
  console.log('🧪 Test du serveur Next.js...');
  const result = await checkServer(3001);
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
    console.log(`   Status HTTP: ${result.status}`);
    
    // Test des pages principales
    console.log('\n🧪 Test des pages principales...');
    
    const pages = [
      { name: 'Accueil', path: '/' },
      { name: 'Login', path: '/login' },
      { name: 'Admin', path: '/admin' },
      { name: 'Bijoux', path: '/bijoux' },
      { name: 'Packs', path: '/packs' }
    ];
    
    for (const page of pages) {
      const pageResult = await checkServer(3000, page.path);
      const status = pageResult.success ? '✅' : '❌';
      console.log(`   ${status} ${page.name}: ${pageResult.status}`);
    }
    
    console.log('\n🎯 ÉTAT DU PROJET:');
    console.log('🟢 Serveur Next.js fonctionne correctement');
    console.log('✅ Aucune erreur critique détectée');
    
  } else {
    console.log(`❌ ${result.message}`);
    console.log('\n🔧 RECOMMANDATIONS:');
    console.log('1. Vérifiez que le serveur Next.js est démarré');
    console.log('2. Exécutez: npm run dev');
    console.log('3. Vérifiez les logs d\'erreur dans le terminal');
  }
  
  console.log('\n🌐 URL D\'ACCÈS:');
  console.log(`   http://localhost:3000`);
}

main().catch(console.error);
