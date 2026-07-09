'use client'

export type Section = 'pregames' | 'psps' | 'dog-of-the-day' | 'pool'

export function SectionNav({
  active,
  onSelect,
}: {
  active: Section
  onSelect: (section: Section) => void
}) {
  const sections: { id: Section; label: string }[] = [
    { id: 'pregames', label: 'Pregames' },
    { id: 'psps', label: 'PSPs' },
    { id: 'dog-of-the-day', label: 'Dog of the Day' },
    { id: 'pool', label: 'Pool' },
  ]

  return (
    <nav
      aria-label="Sections"
      className="sticky top-14 z-40 border-b border-border/60 bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md gap-2 px-4 py-3">
        {sections.map((section) => {
          const selected = section.id === active
          return (
            <li key={section.id} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  onSelect(section.id)
                  const element = document.getElementById(section.id)
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
                aria-current={selected ? 'true' : undefined}
                className={`w-full rounded-lg px-3 py-2 text-sm transition-colors ${
                  selected
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                {section.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
