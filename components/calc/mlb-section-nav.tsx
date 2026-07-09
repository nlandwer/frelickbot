'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function MLBSectionNav() {
  const pathname = usePathname()

  const sections = [
    { href: '/mlb/pregames', label: 'Pregames' },
    { href: '/mlb/psps', label: 'PSPs' },
    { href: '/mlb/dog-of-the-day', label: 'Dog of the Day' },
    { href: '/mlb/pool', label: 'Pool' },
  ]

  return (
    <nav
      aria-label="MLB Sections"
      className="sticky top-14 z-40 border-b border-border/60 bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-4 py-3">
        {sections.map((section) => {
          const isActive = pathname === section.href
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-block rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                {section.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
