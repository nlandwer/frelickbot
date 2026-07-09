import { Trophy } from 'lucide-react'
import { SportsNav, type Sport } from '@/components/calc/sports-nav'

export function AppHeader({
  activeSport,
  onSelectSport,
}: {
  activeSport: Sport
  onSelectSport: (sport: Sport) => void
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-3.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Trophy className="size-4" />
        </span>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Real EV Calculator
        </h1>
      </div>
      <SportsNav active={activeSport} onSelect={onSelectSport} />
    </header>
  )
}
