'use client'

import { useRouter } from 'next/navigation'
import { SPORTS, type Sport } from '@/components/calc/sports-nav'

export default function HomePage() {
  const router = useRouter()

  const handleSportSelect = (sport: Sport) => {
    router.push(`/${sport.toLowerCase()}/pregames`)
  }

  return (
    <div className="min-h-dvh bg-background pt-8 pb-10">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Welcome to FrelickBot
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Select a sport to get started
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => handleSportSelect(sport)}
              className="relative overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm px-4 py-6 text-center font-semibold text-foreground transition-all duration-200 hover:bg-card hover:border-primary/60 hover:text-primary hover:shadow-lg hover:shadow-primary/20"
            >
              {sport}
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-8 text-center">
          <p className="text-sm text-muted-foreground">
            FrelickBot helps you estimate fair odds and expected value across sports markets.
          </p>
        </div>
      </main>
    </div>
  )
}
