'use client'

import { useParams } from 'next/navigation'
import { SPORTS } from '@/components/calc/sports-nav'

export default function SportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const sport = (params?.sport as string)?.toUpperCase()

  // If it's MLB, let the MLB layout handle it
  if (sport === 'MLB') {
    return children
  }

  // For other sports, show coming soon
  return (
    <div className="min-h-dvh bg-background pt-4 pb-10">
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4">
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card shadow-lg shadow-black/20 py-16">
          <p className="text-muted-foreground">{sport} coming soon.</p>
        </div>
      </main>
    </div>
  )
}
