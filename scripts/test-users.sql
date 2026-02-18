-- Script de test pour vérifier les utilisateurs créés
-- Exécutez ce script après la configuration complète

-- Vérifier tous les utilisateurs
SELECT 
  id,
  phone,
  first_name,
  last_name,
  role,
  created_at
FROM users 
ORDER BY role, created_at;

-- Vérifier les permissions par rôle
SELECT 
  role,
  COUNT(*) as nombre_utilisateurs
FROM users 
GROUP BY role
ORDER BY role;

-- Vérifier les produits disponibles
SELECT 
  b.name,
  b.price,
  c.name as categorie,
  b.is_featured
FROM bijoux b
JOIN categories c ON b.category_id = c.id
WHERE b.is_available = true
ORDER BY b.is_featured DESC, b.created_at DESC;

-- Vérifier les catégories
SELECT 
  name,
  slug,
  description
FROM categories
ORDER BY name;
