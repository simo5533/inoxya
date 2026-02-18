#!/usr/bin/env node

/**
 * Script de test complet CRUD pour INOXYA BIJOUX
 * Vérifie que toutes les opérations CRUD fonctionnent correctement
 */

const bcrypt = require('bcryptjs')
const path = require('path')
const Database = require('better-sqlite3')
const fs = require('fs')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
const dataDir = path.join(process.cwd(), 'data')

console.log('🧪 TEST COMPLET CRUD - INOXYA BIJOUX\n')
console.log('═'.repeat(60))

// Vérifier que le dossier data existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Connexion à la base de données
let db
try {
  db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  console.log('✅ Connexion à la base de données réussie\n')
} catch (error) {
  console.error('❌ Erreur de connexion:', error.message)
  process.exit(1)
}

// Initialiser les tables si nécessaire
try {
  const { initializeDatabase } = require('../lib/sqlite')
  initializeDatabase()
  console.log('✅ Base de données initialisée\n')
} catch (error) {
  console.error('⚠️  Erreur initialisation:', error.message)
}

const results = {
  products: { create: false, read: false, update: false, delete: false },
  orders: { create: false, read: false, update: false },
  payments: { create: false, read: false, update: false },
  users: { create: false, read: false, update: false },
  notifications: { create: false, read: false }
}

// TEST 1: CRUD Produits
console.log('📦 TEST 1: CRUD Produits')
console.log('─'.repeat(60))

try {
  // CREATE
  const testProduct = {
    name: 'Test Produit CRUD',
    name_ar: 'منتج اختبار',
    description: 'Produit de test pour vérifier le CRUD',
    price: 999.99,
    original_price: 1299.99,
    category: 'Bagues',
    stock: 10,
    is_active: 1,
    image_url: '/images/test.jpg',
    images: JSON.stringify([]),
    created_by: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const insertResult = db.prepare(`
    INSERT INTO products (name, name_ar, description, price, original_price, category, stock, is_active, image_url, images, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testProduct.name,
    testProduct.name_ar,
    testProduct.description,
    testProduct.price,
    testProduct.original_price,
    testProduct.category,
    testProduct.stock,
    testProduct.is_active,
    testProduct.image_url,
    testProduct.images,
    testProduct.created_by,
    testProduct.created_at,
    testProduct.updated_at
  )
  
  const productId = Number(insertResult.lastInsertRowid)
  results.products.create = productId > 0
  console.log(`  ✅ CREATE: Produit créé avec ID ${productId}`)
  
  // READ
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
  results.products.read = !!product
  console.log(`  ${results.products.read ? '✅' : '❌'} READ: Produit récupéré`)
  
  // UPDATE
  const updateResult = db.prepare(`
    UPDATE products 
    SET name = ?, price = ?, updated_at = ?
    WHERE id = ?
  `).run('Test Produit Modifié', 899.99, new Date().toISOString(), productId)
  
  results.products.update = updateResult.changes > 0
  console.log(`  ${results.products.update ? '✅' : '❌'} UPDATE: Produit modifié`)
  
  // DELETE
  const deleteResult = db.prepare('DELETE FROM products WHERE id = ?').run(productId)
  results.products.delete = deleteResult.changes > 0
  console.log(`  ${results.products.delete ? '✅' : '❌'} DELETE: Produit supprimé`)
  
} catch (error) {
  console.error('  ❌ Erreur CRUD Produits:', error.message)
}

// TEST 2: CRUD Commandes
console.log('\n📋 TEST 2: CRUD Commandes')
console.log('─'.repeat(60))

try {
  // CREATE
  const testOrder = {
    user_id: null,
    total_amount: 1999.99,
    status: 'pending',
    shipping_address: JSON.stringify({ city: 'Casablanca', address: '123 Rue Test' }),
    phone: '0612345678',
    notes: 'Commande de test',
    created_at: new Date().toISOString()
  }
  
  const orderResult = db.prepare(`
    INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    testOrder.user_id,
    testOrder.total_amount,
    testOrder.status,
    testOrder.shipping_address,
    testOrder.phone,
    testOrder.notes,
    testOrder.created_at
  )
  
  const orderId = Number(orderResult.lastInsertRowid)
  results.orders.create = orderId > 0
  console.log(`  ✅ CREATE: Commande créée avec ID ${orderId}`)
  
  // Créer un order_item
  const productForOrder = db.prepare('SELECT id, price FROM products LIMIT 1').get()
  if (productForOrder) {
    db.prepare(`
      INSERT INTO order_items (order_id, bijou_id, quantity, price, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, productForOrder.id, 2, productForOrder.price, new Date().toISOString())
    console.log(`  ✅ CREATE: Order item créé`)
  }
  
  // READ
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  results.orders.read = !!order
  console.log(`  ${results.orders.read ? '✅' : '❌'} READ: Commande récupérée`)
  
  // UPDATE
  const updateOrderResult = db.prepare(`
    UPDATE orders 
    SET status = ?
    WHERE id = ?
  `).run('confirmed', orderId)
  
  results.orders.update = updateOrderResult.changes > 0
  console.log(`  ${results.orders.update ? '✅' : '❌'} UPDATE: Statut commande modifié`)
  
  // Nettoyer
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId)
  db.prepare('DELETE FROM orders WHERE id = ?').run(orderId)
  console.log(`  ✅ Nettoyage: Commande de test supprimée`)
  
} catch (error) {
  console.error('  ❌ Erreur CRUD Commandes:', error.message)
}

// TEST 3: CRUD Paiements
console.log('\n💳 TEST 3: CRUD Paiements')
console.log('─'.repeat(60))

try {
  // Créer une commande pour le paiement
  const orderForPayment = db.prepare(`
    INSERT INTO orders (user_id, total_amount, status, phone, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(null, 1500.00, 'pending', '0612345678', new Date().toISOString())
  const paymentOrderId = Number(orderForPayment.lastInsertRowid)
  
  // CREATE
  const testPayment = {
    order_id: paymentOrderId,
    amount: 1500.00,
    payment_method: 'cash_on_delivery',
    status: 'pending',
    transaction_id: null,
    created_at: new Date().toISOString()
  }
  
  const paymentResult = db.prepare(`
    INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    testPayment.order_id,
    testPayment.amount,
    testPayment.payment_method,
    testPayment.status,
    testPayment.transaction_id,
    testPayment.created_at
  )
  
  const paymentId = Number(paymentResult.lastInsertRowid)
  results.payments.create = paymentId > 0
  console.log(`  ✅ CREATE: Paiement créé avec ID ${paymentId}`)
  
  // READ
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId)
  results.payments.read = !!payment
  console.log(`  ${results.payments.read ? '✅' : '❌'} READ: Paiement récupéré`)
  
  // UPDATE
  const updatePaymentResult = db.prepare(`
    UPDATE payments 
    SET status = ?
    WHERE id = ?
  `).run('completed', paymentId)
  
  results.payments.update = updatePaymentResult.changes > 0
  console.log(`  ${results.payments.update ? '✅' : '❌'} UPDATE: Statut paiement modifié`)
  
  // Nettoyer
  db.prepare('DELETE FROM payments WHERE id = ?').run(paymentId)
  db.prepare('DELETE FROM orders WHERE id = ?').run(paymentOrderId)
  console.log(`  ✅ Nettoyage: Paiement de test supprimé`)
  
} catch (error) {
  console.error('  ❌ Erreur CRUD Paiements:', error.message)
}

// TEST 4: CRUD Utilisateurs
console.log('\n👥 TEST 4: CRUD Utilisateurs')
console.log('─'.repeat(60))

try {
  // CREATE
  const testUser = {
    phone: `test_${Date.now()}`,
    password_hash: bcrypt.hashSync('Test123!', 10),
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const userResult = db.prepare(`
    INSERT INTO users (phone, password_hash, first_name, last_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    testUser.phone,
    testUser.password_hash,
    testUser.first_name,
    testUser.last_name,
    testUser.role,
    testUser.created_at,
    testUser.updated_at
  )
  
  const userId = Number(userResult.lastInsertRowid)
  results.users.create = userId > 0
  console.log(`  ✅ CREATE: Utilisateur créé avec ID ${userId}`)
  
  // READ
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  results.users.read = !!user
  console.log(`  ${results.users.read ? '✅' : '❌'} READ: Utilisateur récupéré`)
  
  // UPDATE
  const updateUserResult = db.prepare(`
    UPDATE users 
    SET role = ?, updated_at = ?
    WHERE id = ?
  `).run('moderator', new Date().toISOString(), userId)
  
  results.users.update = updateUserResult.changes > 0
  console.log(`  ${results.users.update ? '✅' : '❌'} UPDATE: Rôle utilisateur modifié`)
  
  // Nettoyer
  db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  console.log(`  ✅ Nettoyage: Utilisateur de test supprimé`)
  
} catch (error) {
  console.error('  ❌ Erreur CRUD Utilisateurs:', error.message)
}

// TEST 5: Notifications
console.log('\n🔔 TEST 5: Notifications')
console.log('─'.repeat(60))

try {
  // CREATE
  const testNotification = {
    user_id: null,
    title: 'Test Notification',
    message: 'Ceci est une notification de test',
    type: 'info',
    is_read: 0,
    action_url: null,
    created_at: new Date().toISOString()
  }
  
  const notifResult = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, is_read, action_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    testNotification.user_id,
    testNotification.title,
    testNotification.message,
    testNotification.type,
    testNotification.is_read,
    testNotification.action_url,
    testNotification.created_at
  )
  
  const notifId = Number(notifResult.lastInsertRowid)
  results.notifications.create = notifId > 0
  console.log(`  ✅ CREATE: Notification créée avec ID ${notifId}`)
  
  // READ
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId)
  results.notifications.read = !!notification
  console.log(`  ${results.notifications.read ? '✅' : '❌'} READ: Notification récupérée`)
  
  // UPDATE (marquer comme lue)
  const updateNotifResult = db.prepare(`
    UPDATE notifications 
    SET is_read = 1
    WHERE id = ?
  `).run(notifId)
  
  console.log(`  ${updateNotifResult.changes > 0 ? '✅' : '❌'} UPDATE: Notification marquée comme lue`)
  
  // Nettoyer
  db.prepare('DELETE FROM notifications WHERE id = ?').run(notifId)
  console.log(`  ✅ Nettoyage: Notification de test supprimée`)
  
} catch (error) {
  console.error('  ❌ Erreur Notifications:', error.message)
}

// TEST 6: Vérification des données existantes
console.log('\n📊 TEST 6: Vérification des données existantes')
console.log('─'.repeat(60))

try {
  const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get()
  const paymentsCount = db.prepare('SELECT COUNT(*) as count FROM payments').get()
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  const notificationsCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get()
  
  console.log(`  ✅ Produits: ${productsCount.count} enregistrés`)
  console.log(`  ✅ Commandes: ${ordersCount.count} enregistrées`)
  console.log(`  ✅ Paiements: ${paymentsCount.count} enregistrés`)
  console.log(`  ✅ Utilisateurs: ${usersCount.count} enregistrés`)
  console.log(`  ✅ Notifications: ${notificationsCount.count} enregistrées`)
  
} catch (error) {
  console.error('  ❌ Erreur vérification:', error.message)
}

// RÉSUMÉ
console.log('\n' + '═'.repeat(60))
console.log('📊 RÉSUMÉ DES TESTS')
console.log('═'.repeat(60))

const allTests = [
  { name: 'Produits', tests: results.products },
  { name: 'Commandes', tests: results.orders },
  { name: 'Paiements', tests: results.payments },
  { name: 'Utilisateurs', tests: results.users },
  { name: 'Notifications', tests: results.notifications }
]

let totalTests = 0
let passedTests = 0

allTests.forEach(({ name, tests }) => {
  Object.entries(tests).forEach(([operation, passed]) => {
    totalTests++
    if (passed) passedTests++
    const icon = passed ? '✅' : '❌'
    console.log(`${icon} ${name} - ${operation.toUpperCase()}: ${passed ? 'PASSÉ' : 'ÉCHOUÉ'}`)
  })
})

console.log('─'.repeat(60))
console.log(`📈 Résultat: ${passedTests}/${totalTests} tests réussis (${Math.round(passedTests/totalTests*100)}%)`)

if (passedTests === totalTests) {
  console.log('\n🎉 TOUS LES TESTS SONT PASSÉS ! Le CRUD fonctionne parfaitement.\n')
} else {
  console.log(`\n⚠️  ${totalTests - passedTests} test(s) ont échoué. Vérifiez les erreurs ci-dessus.\n`)
}

db.close()

process.exit(passedTests === totalTests ? 0 : 1)

