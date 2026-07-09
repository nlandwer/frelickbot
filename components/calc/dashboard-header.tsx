'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Settings, User } from 'lucide-react'
import { SportsNav, type Sport, SPORTS } from '@/components/calc/sports-nav'

export type TopTab = 'home' | 'karma' | 'rax' | 'predictions' | 'settings'

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const getActiveTab = (): TopTab => {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/rax')) return 'rax'
    if (pathname.startsWith('/predictions')) return 'predictions'
    if (pathname.startsWith('/settings')) return 'settings'
    return 'karma'
  }

  const getActiveSport = (): Sport => {
    // Extract sport from pathname like "/mlb/pregames" or "/nfl/spread"
    const parts = pathname.split('/')
    const sportPart = parts[1]?.toUpperCase()
    
    if (sportPart && SPORTS.includes(sportPart as Sport)) {
      return sportPart as Sport
    }
    return 'MLB'
  }

  const active = getActiveTab()
  const activeSport = getActiveSport()

  const primaryTabs: { id: TopTab; label: string; href: string }[] = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'karma', label: 'Karma', href: '/mlb/pregames' },
    { id: 'rax', label: 'RAX', href: '/rax/otd' },
    { id: 'predictions', label: 'Predictions', href: '/predictions/ev' },
    { id: 'settings', label: 'Settings', href: '/settings/account' },
  ]

  const handleSportSelect = (sport: Sport) => {
    router.push(`/${sport.toLowerCase()}/pregames`)
  }

  const getSecondaryNav = () => {
    // Hide secondary navigation when Home is selected
    if (active === 'home') {
      return null
    }

    switch (active) {
      case 'karma':
        // For Karma, show sports first, then MLB sections if on MLB
        return (
          <div className="space-y-2">
            <SportsNav active={activeSport} onSelect={handleSportSelect} />
            {activeSport === 'MLB' && (
              <SecondaryNav 
                items={[
                  { label: 'Pregames', href: '/mlb/pregames' },
                  { label: 'PSPs', href: '/mlb/psps' },
                  { label: 'Dog of the Day', href: '/mlb/dog-of-the-day' },
                  { label: 'Pool', href: '/mlb/pool' },
                ]} 
                active={pathname} 
              />
            )}
          </div>
        )
      case 'rax':
        return <SecondaryNav items={[
          { label: 'OTD', href: '/rax/otd' },
          { label: 'Overlap', href: '/rax/overlap' },
        ]} active={pathname} />
      case 'predictions':
        return <SecondaryNav items={[
          { label: 'EV', href: '/predictions/ev' },
        ]} active={pathname} />
      case 'settings':
        return <SecondaryNav items={[
          { label: 'Account', href: '/settings/account' },
          { label: 'Odds', href: '/settings/odds' },
        ]} active={pathname} />
      default:
        return null
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40">
      {/* Title Bar with Grid Layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 px-4 py-5">
        {/* Left Column - Empty */}
        <div />
        
        {/* Center Column - Logo and Primary Navigation */}
        <div className="flex flex-col items-center gap-4">
          {/* Centered Logo */}
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <Image
              src="/logo.png"
              alt="FrelickBot Logo"
              width={180}
              height={180}
              priority
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '180px'
              }}
            />
          </Link>

          {/* Primary Navigation */}
          <nav aria-label="Main navigation" className="w-full">
            <ul className="flex gap-1 py-1 justify-center">
              {primaryTabs.map((tab) => {
                const isActive = tab.id === active
                return (
                  <li key={tab.id}>
                    <Link
                      href={tab.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`rounded-lg px-4 py-2.5 text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/15 font-semibold text-primary shadow-sm shadow-primary/20'
                          : 'font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
        
        {/* Right Column - Icons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-primary/10"
          >
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-primary/10"
          >
            <Settings className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Profile"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-primary/10"
          >
            <User className="size-5" />
          </button>
        </div>
      </div>

      {/* Secondary Navigation */}
      {getSecondaryNav() && (
        <nav
          aria-label="Secondary navigation"
          className="border-t border-border/40 bg-background/30 animate-fade-in"
        >
          <div className="flex justify-center">
            {getSecondaryNav()}
          </div>
        </nav>
      )}
    </header>
  )
}

interface SecondaryNavProps {
  items: { label: string; href: string }[]
  active: string
}

function SecondaryNav({ items, active }: SecondaryNavProps) {
  return (
    <ul className="flex flex-wrap justify-center gap-1 py-3 px-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const isActive = active.startsWith(item.href)
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 font-bold text-primary'
                  : 'font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5'
              }`}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
