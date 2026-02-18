import { CartSkeleton, PageHeaderSkeleton } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-12">
          <PageHeaderSkeleton />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <CartSkeleton items={3} />
      </div>
    </div>
  )
}

