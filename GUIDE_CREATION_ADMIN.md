# 🔐 Guide Rapide : Créer l'utilisateur Admin

## Problème
Vous ne pouvez pas vous connecter car l'utilisateur admin n'existe pas dans la base de données.

## ✅ Solution Simple (5 minutes)

### Option 1 : DB Browser for SQLite (RECOMMANDÉ - Le plus simple)

1. **Téléchargez DB Browser for SQLite** (gratuit) :
   - https://sqlitebrowser.org/
   - Installez-le

2. **Ouvrez la base de données** :
   - Lancez DB Browser for SQLite
   - Cliquez sur "Open Database"
   - Naviguez vers : `C:\Users\Basma\Desktop\inoxya-bijoux 2\data\inoxya_bijoux.db`
   - Ouvrez le fichier

3. **Exécutez le script SQL** :
   - Cliquez sur l'onglet "Execute SQL" (en haut)
   - Ouvrez le fichier : `C:\Users\Basma\Desktop\inoxya-bijoux 2\scripts\create-admin.sql`
   - Cliquez sur le bouton "Execute SQL" (ou appuyez sur F5)
   - Vous devriez voir "Query executed successfully"

4. **Vérifiez que ça a fonctionné** :
   - Dans l'onglet "Execute SQL", exécutez :
   ```sql
   SELECT id, phone, first_name, last_name, role FROM users WHERE role = 'admin';
   ```
   - Vous devriez voir 2 utilisateurs : `0612345678` et `admin_phone`

5. **Testez la connexion** :
   - Allez sur http://localhost:3000/login
   - Téléphone : `0612345678`
   - Mot de passe : `Admin123!`
   - Cliquez sur "Se connecter"

### Option 2 : Via le terminal (si sqlite3 CLI est installé)

```bash
cd "C:\Users\Basma\Desktop\inoxya-bijoux 2"
sqlite3 data/inoxya_bijoux.db < scripts/create-admin.sql
```

## 📋 Identifiants Admin

- **Téléphone** : `0612345678` ou `admin_phone`
- **Mot de passe** : `Admin123!`
- **Rôle** : `admin`

## ⚠️ Note Importante

Si vous voyez toujours l'erreur après avoir créé l'utilisateur :
1. Vérifiez que le serveur est démarré : `npm run dev`
2. Videz le cache du navigateur (Ctrl+Shift+Delete)
3. Réessayez de vous connecter

## 🆘 Besoin d'aide ?

Si vous avez des problèmes :
1. Vérifiez que la base de données existe : `data/inoxya_bijoux.db`
2. Vérifiez que le fichier SQL existe : `scripts/create-admin.sql`
3. Assurez-vous que DB Browser for SQLite peut ouvrir la base de données

