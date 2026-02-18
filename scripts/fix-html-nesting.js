#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les erreurs d'imbrication HTML
 * Remplace les éléments <p> contenant des <div> par des <div>
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files = files.concat(findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixHTMLNesting(content) {
  let fixedContent = content;
  let changes = 0;
  
  // Détecter et corriger les éléments <p> contenant des <div>
  const pDivRegex = /<p([^>]*)>([\s\S]*?)<div([^>]*)>([\s\S]*?)<\/div>([\s\S]*?)<\/p>/g;
  
  fixedContent = fixedContent.replace(pDivRegex, (match, pAttrs, beforeDiv, divAttrs, divContent, afterDiv) => {
    changes++;
    // Remplacer <p> par <div> en gardant les attributs
    return `<div${pAttrs}>${beforeDiv}<div${divAttrs}>${divContent}</div>${afterDiv}</div>`;
  });
  
  // Détecter et corriger les éléments <p> contenant d'autres éléments de bloc
  const blockElements = ['section', 'article', 'header', 'footer', 'main', 'nav', 'aside'];
  
  for (const element of blockElements) {
    const regex = new RegExp(`<p([^>]*)>([\\s\\S]*?)<${element}([^>]*)>([\\s\\S]*?)<\\/${element}>([\\s\\S]*?)<\\/p>`, 'g');
    fixedContent = fixedContent.replace(regex, (match, pAttrs, beforeElement, elementAttrs, elementContent, afterElement) => {
      changes++;
      return `<div${pAttrs}>${beforeElement}<${element}${elementAttrs}>${elementContent}</${element}>${afterElement}</div>`;
    });
  }
  
  // Corriger les cas plus complexes avec des éléments imbriqués
  // Pattern pour <p> contenant des éléments avec des attributs et du contenu
  const complexPRegex = /<p([^>]*)>([\s\S]*?)<([a-zA-Z]+)([^>]*)>([\s\S]*?)<\/\3>([\s\S]*?)<\/p>/g;
  
  fixedContent = fixedContent.replace(complexPRegex, (match, pAttrs, beforeElement, elementName, elementAttrs, elementContent, afterElement) => {
    // Vérifier si l'élément est un élément de bloc
    const blockElements = ['div', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (blockElements.includes(elementName.toLowerCase())) {
      changes++;
      return `<div${pAttrs}>${beforeElement}<${elementName}${elementAttrs}>${elementContent}</${elementName}>${afterElement}</div>`;
    }
    return match; // Garder tel quel si ce n'est pas un élément de bloc
  });
  
  // Corriger les cas où <p> contient directement des éléments de bloc sans attributs
  const simpleBlockRegex = /<p([^>]*)>([\s\S]*?)<(div|section|article|header|footer|main|nav|aside)>([\s\S]*?)<\/\3>([\s\S]*?)<\/p>/g;
  
  fixedContent = fixedContent.replace(simpleBlockRegex, (match, pAttrs, beforeElement, elementName, elementContent, afterElement) => {
    changes++;
    return `<div${pAttrs}>${beforeElement}<${elementName}>${elementContent}</${elementName}>${afterElement}</div>`;
  });
  
  return { content: fixedContent, changes };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixHTMLNesting(content);
    
    if (result.changes > 0) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      return result.changes;
    }
    
    return 0;
  } catch (error) {
    console.log(`❌ Erreur lors de la correction de ${filePath}: ${error.message}`);
    return 0;
  }
}

function main() {
  console.log('🔧 CORRECTEUR D\'ERREURS HTML NEXT.JS');
  console.log('====================================\n');
  
  const directories = ['app', 'components'];
  let totalChanges = 0;
  let totalFiles = 0;
  let fixedFiles = 0;
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Répertoire ${dir} non trouvé`);
      continue;
    }
    
    console.log(`📁 Correction du répertoire: ${dir}`);
    const files = findFiles(dir);
    totalFiles += files.length;
    
    let dirChanges = 0;
    let dirFixedFiles = 0;
    
    for (const file of files) {
      const changes = fixFile(file);
      if (changes > 0) {
        console.log(`   ✅ ${file} - ${changes} correction(s)`);
        dirChanges += changes;
        dirFixedFiles++;
        fixedFiles++;
      }
    }
    
    if (dirChanges === 0) {
      console.log(`   ✅ Aucune correction nécessaire dans ${files.length} fichiers`);
    } else {
      console.log(`   🔧 ${dirChanges} correction(s) dans ${dirFixedFiles} fichier(s)`);
    }
    console.log('');
  }
  
  console.log('📊 RÉSULTATS:');
  console.log(`   Fichiers analysés: ${totalFiles}`);
  console.log(`   Fichiers corrigés: ${fixedFiles}`);
  console.log(`   Corrections totales: ${totalChanges}`);
  
  if (totalChanges === 0) {
    console.log('\n🎉 Aucune correction nécessaire !');
    console.log('✅ Votre code HTML est déjà correct');
  } else {
    console.log('\n🎯 CORRECTIONS APPLIQUÉES:');
    console.log('✅ Éléments <p> contenant <div> remplacés par <div>');
    console.log('✅ Éléments <p> contenant des éléments de bloc remplacés par <div>');
    console.log('✅ Attributs CSS préservés');
    
    console.log('\n🔧 PROCHAINES ÉTAPES:');
    console.log('1. Redémarrez le serveur Next.js');
    console.log('2. Testez les pages corrigées');
    console.log('3. Vérifiez que les erreurs d\'hydratation sont résolues');
  }
  
  console.log('\n🌐 POUR TESTER:');
  console.log('   npm run dev');
  console.log('   http://localhost:3000');
}

main();
