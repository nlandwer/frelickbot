'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type TopTab = 'karma' | 'rax' | 'predictions' | 'settings'

export function TopNav() {
  const pathname = usePathname()

  const getActiveTab = (): TopTab => {
    if (pathname.startsWith('/rax')) return 'rax'
    if (pathname.startsWith('/predictions')) return 'predictions'
    if (pathname.startsWith('/settings')) return 'settings'
    return 'karma'
  }

  const active = getActiveTab()

  const tabs: { id: TopTab; label: string; href: string }[] = [
    { id: 'karma', label: 'Karma', href: '/' },
    { id: 'rax', label: 'RAX', href: '/rax' },
    { id: 'predictions', label: 'Predictions', href: '/predictions' },
    { id: 'settings', label: 'Settings', href: '/settings' },
  ]

  return (
    <nav aria-label="Main" className="border-b border-border/60 bg-background">
      <ul className="mx-auto flex max-w-4xl gap-1 px-4 py-3">
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
