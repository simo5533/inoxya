# 🔧 Correction de la connexion admin

## Problème
L'erreur "Utilisateur non trouvé ou mot de passe incorrect" apparaît lors de la tentative de connexion avec:
- **Téléphone:** `0612345678` ou `admin_phone`
- **Mot de passe:** `Admin123!`

## Causes possibles

1. **Base de données non initialisée** : L'utilisateur admin n'a pas été créé
2. **better-sqlite3 non compilé** : Les bindings natifs ne sont pas disponibles
3. **Hash de mot de passe incorrect** : Le mot de passe stocké ne correspond pas

## ✅ Solution rapide (SANS compilation)

### Option 1: Utiliser le script SQL généré (RECOMMANDÉ)

1. **Générer les commandes SQL:**
   ```bash
   npm run admin:sql
   ```

2. **Ouvrir la base de données avec DB Browser for SQLite:**
   - Téléchargez DB Browser for SQLite: https://sqlitebrowser.org/
   - Ouvrez le fichier: `data/inoxya_bijoux.db`
   - Allez dans l'onglet "Execute SQL"
   - Ouvrez le fichier: `scripts/create-admin.sql`
   - Cliquez sur "Execute SQL" (F5)

3. **Vérifier que les utilisateurs ont été créés:**
   - Exécutez: `SELECT id, phone, first_name, last_name, role FROM users WHERE role = 'admin';`
   - Vous devriez voir 2 utilisateurs: `0612345678` et `admin_phone`

4. **Tester la connexion:**
   - Allez sur `/login`
   - Entrez `0612345678` ou `admin_phone`
   - Entrez `Admin123!`
   - Cliquez sur "Se connecter"

### Option 2: Compiler better-sqlite3 (si vous avez Python)

```bash
# 1. Installer Python 3.x depuis python.org
# 2. Installer Visual Studio Build Tools (C++ workload)
# 3. Ajouter Python au PATH
# 4. Recompiler better-sqlite3
npm rebuild better-sqlite3

# 5. Créer l'utilisateur admin
npm run admin:create
```

### Option 3: Créer manuellement via SQL

Si vous avez accès à la base de données SQLite:

```sql
-- Le hash pour "Admin123!" est: $2a$10$EUFwcX8aABzEZt3U8.TSSuwlpYcKSKSIeYwUik8o9kH9arblw9BIe

-- Créer l'utilisateur admin (0612345678)
INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
VALUES ('0612345678', '$2a$10$EUFwcX8aABzEZt3U8.TSSuwlpYcKSKSIeYwUik8o9kH9arblw9BIe', 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP);

-- Créer l'utilisateur admin (admin_phone)
INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
VALUES ('admin_phone', '$2a$10$EUFwcX8aABzEZt3U8.TSSuwlpYcKSKSIeYwUik8o9kH9arblw9BIe', 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP);
```

## Identifiants par défaut

- **Téléphone:** `0612345678` ou `admin_phone`
- **Mot de passe:** `Admin123!`
- **Rôle:** `admin`

## Vérification

Après avoir créé l'utilisateur, testez la connexion:
1. Allez sur `/login`
2. Entrez `0612345678` ou `admin_phone`
3. Entrez `Admin123!`
4. Cliquez sur "Se connecter"

## Notes

- Le script `npm run admin:sql` génère un fichier SQL (`scripts/create-admin.sql`) que vous pouvez exécuter avec DB Browser for SQLite
- Si `better-sqlite3` n'est pas compilé, l'application utilise le fallback (produits depuis images)
- En production, assurez-vous que `better-sqlite3` est correctement installé et compilé
- Le hash bcrypt pour "Admin123!" est généré automatiquement par le script
