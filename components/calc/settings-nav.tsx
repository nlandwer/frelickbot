'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function SettingsNav() {
  const pathname = usePathname()

  const sections = [
    { href: '/settings/account', label: 'Account' },
    { href: '/settings/odds', label: 'Odds' },
  ]

  return (
    <nav
      aria-label="Settings Sections"
      className="sticky top-20 z-40 border-b border-border/60 bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md gap-2 px-4 py-3">
        {sections.map((section) => {
          const isActive = pathname === section.href
          return (
            <li key={section.href} className="flex-1">
              <Link
                href={section.href}
                aria-current={isActive ? 'page' : undefined}
                className={`block w-full rounded-lg px-3 py-2 text-center text-sm transition-colors ${
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
