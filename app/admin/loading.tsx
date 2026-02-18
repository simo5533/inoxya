import { TableSkeleton, PageHeaderSkeleton } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeaderSkeleton />
        <TableSkeleton rows={10} cols={5} />
      </div>
    </div>
  )
}

