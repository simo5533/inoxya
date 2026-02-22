/**
 * Vérification des orphelins (lecture seule) pour order_items et payments.
 * Usage: npx tsx scripts/checkout-orphans-verify.ts
 * Si les deux comptes sont 0, vous pouvez ajouter les FK (voir docs/SUPABASE_CHECKOUT_FK_AND_ORPHANS.md).
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function main() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) {
    console.error('Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)

  console.log('Vérification des orphelins (lecture seule)...\n')

  const { data: orderIds } = await supabase.from('orders').select('id')
  const orderIdSet = new Set((orderIds ?? []).map((r) => String(r.id)))

  const { data: orderItems } = await supabase.from('order_items').select('order_id')
  const orphanOrderItems = (orderItems ?? []).filter((r) => !orderIdSet.has(String(r.order_id)))
  const orphanOrderItemsCount = orphanOrderItems.length

  const { data: payments } = await supabase.from('payments').select('order_id')
  const orphanPayments = (payments ?? []).filter((r) => !orderIdSet.has(String(r.order_id)))
  const orphanPaymentsCount = orphanPayments.length

  console.log('Résultat:')
  console.log('  order_items orphelins (order_id absent de orders):', orphanOrderItemsCount)
  console.log('  payments orphelins (order_id absent de orders):   ', orphanPaymentsCount)
  console.log('')

  if (orphanOrderItemsCount === 0 && orphanPaymentsCount === 0) {
    console.log('OK — Aucun orphelin. Vous pouvez exécuter le SQL d’ajout des FK dans Supabase SQL Editor (voir docs/SUPABASE_CHECKOUT_FK_AND_ORPHANS.md).')
  } else {
    console.log('ATTENTION — Des orphelins existent. Ne pas ajouter les FK avant de les traiter (voir doc).')
    if (orphanOrderItemsCount > 0) {
      console.log('  Exemples order_items orphelins (order_id):', [...new Set(orphanOrderItems.map((r) => r.order_id))].slice(0, 5))
    }
    if (orphanPaymentsCount > 0) {
      console.log('  Exemples payments orphelins (order_id):', [...new Set(orphanPayments.map((r) => r.order_id))].slice(0, 5))
    }
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Erreur:', e)
  process.exit(1)
})
