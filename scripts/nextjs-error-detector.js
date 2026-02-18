#!/usr/bin/env node

/**
 * Détecteur d'erreurs Next.js - Analyse du code pour identifier les problèmes
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

function checkHTMLNesting(content, filePath) {
  const errors = [];
  
  // Détecter les éléments <div> dans <p>
  const pDivRegex = /<p[^>]*>[\s\S]*?<div[^>]*>[\s\S]*?<\/div>[\s\S]*?<\/p>/g;
  let match;
  while ((match = pDivRegex.exec(content)) !== null) {
    const lines = content.substring(0, match.index).split('\n');
    const lineNumber = lines.length;
    errors.push({
      type: 'HTML_NESTING',
      message: 'Élément <div> trouvé dans <p> - cause une erreur d\'hydratation',
      file: filePath,
      line: lineNumber,
      code: match[0].substring(0, 100) + '...'
    });
  }
  
  // Détecter les éléments de bloc dans <p>
  const blockElements = ['div', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside'];
  for (const element of blockElements) {
    const regex = new RegExp(`<p[^>]*>[\\s\\S]*?<${element}[^>]*>[\\s\\S]*?<\\/${element}>[\\s\\S]*?<\\/p>`, 'g');
    while ((match = regex.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      errors.push({
        type: 'HTML_NESTING',
        message: `Élément <${element}> trouvé dans <p> - cause une erreur d'hydratation`,
        file: filePath,
        line: lineNumber,
        code: match[0].substring(0, 100) + '...'
      });
    }
  }
  
  return errors;
}

function checkReactErrors(content, filePath) {
  const errors = [];
  
  // Détecter les hooks mal utilisés
  const hookErrors = [
    {
      pattern: /useEffect\([^)]*\)\s*{[^}]*return\s*[^;]*[^;]\s*}/g,
      message: 'useEffect avec return sans point-virgule - peut causer des erreurs'
    },
    {
      pattern: /useState\([^)]*\)\s*{[^}]*}/g,
      message: 'useState mal structuré - vérifier la destructuration'
    }
  ];
  
  for (const error of hookErrors) {
    let match;
    while ((match = error.pattern.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      errors.push({
        type: 'REACT_HOOK',
        message: error.message,
        file: filePath,
        line: lineNumber,
        code: match[0].substring(0, 100) + '...'
      });
    }
  }
  
  return errors;
}

function checkImportErrors(content, filePath) {
  const errors = [];
  
  // Détecter les imports manquants
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Vérifier les imports relatifs
  for (const importPath of imports) {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fullPath = path.resolve(path.dirname(filePath), importPath);
      const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
      
      let found = false;
      for (const ext of possibleExtensions) {
        if (fs.existsSync(fullPath + ext)) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        errors.push({
          type: 'IMPORT_ERROR',
          message: `Import manquant: ${importPath}`,
          file: filePath,
          line: content.substring(0, content.indexOf(`from '${importPath}'`)).split('\n').length,
          code: `import ... from '${importPath}'`
        });
      }
    }
  }
  
  return errors;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];
    
    // Vérifier les erreurs HTML
    errors.push(...checkHTMLNesting(content, filePath));
    
    // Vérifier les erreurs React
    errors.push(...checkReactErrors(content, filePath));
    
    // Vérifier les imports
    errors.push(...checkImportErrors(content, filePath));
    
    return errors;
  } catch (error) {
    return [{
      type: 'FILE_ERROR',
      message: `Erreur de lecture du fichier: ${error.message}`,
      file: filePath,
      line: 0,
      code: ''
    }];
  }
}

function main() {
  console.log('🔍 DÉTECTEUR D\'ERREURS NEXT.JS');
  console.log('================================\n');
  
  const directories = ['app', 'components', 'lib'];
  let totalErrors = 0;
  let totalFiles = 0;
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Répertoire ${dir} non trouvé`);
      continue;
    }
    
    console.log(`📁 Analyse du répertoire: ${dir}`);
    const files = findFiles(dir);
    totalFiles += files.length;
    
    let dirErrors = 0;
    
    for (const file of files) {
      const errors = analyzeFile(file);
      if (errors.length > 0) {
        console.log(`\n❌ ${file}`);
        for (const error of errors) {
          console.log(`   Ligne ${error.line}: ${error.message}`);
          console.log(`   Code: ${error.code}`);
          totalErrors++;
          dirErrors++;
        }
      }
    }
    
    if (dirErrors === 0) {
      console.log(`   ✅ Aucune erreur détectée dans ${files.length} fichiers`);
    } else {
      console.log(`   ❌ ${dirErrors} erreur(s) détectée(s) dans ${files.length} fichiers`);
    }
    console.log('');
  }
  
  console.log('📊 RÉSULTATS:');
  console.log(`   Fichiers analysés: ${totalFiles}`);
  console.log(`   Erreurs détectées: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n🎉 Aucune erreur détectée !');
    console.log('✅ Votre code Next.js semble correct');
  } else {
    console.log('\n🔧 RECOMMANDATIONS:');
    console.log('1. Corrigez les erreurs HTML d\'imbrication');
    console.log('2. Vérifiez les imports manquants');
    console.log('3. Corrigez les erreurs React/Hooks');
    console.log('4. Redémarrez le serveur Next.js après corrections');
  }
  
  console.log('\n🌐 POUR TESTER:');
  console.log('   npm run dev');
  console.log('   http://localhost:3000');
}

main();
