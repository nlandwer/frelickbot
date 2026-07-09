'use client'

export const SPORTS = [
  'MLB',
  'UFC',
  'WNBA',
  'Soccer',
  'NFL',
  'NBA',
  'NHL',
  'Golf',
  'CFB',
  'CBB',
] as const

export type Sport = (typeof SPORTS)[number]

export function SportsNav({
  active,
  onSelect,
}: {
  active: Sport
  onSelect: (sport: Sport) => void
}) {
  return (
    <nav aria-label="Sports" className="border-t border-border/60">
      <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SPORTS.map((sport) => {
          const selected = sport === active
          return (
            <li key={sport} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(sport)}
                aria-current={selected ? 'true' : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  selected
                    ? 'bg-primary/15 font-bold text-primary'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                {sport}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
