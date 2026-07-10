'use client'

export default function MLBLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background pb-10">
      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-3 py-6 sm:gap-6 sm:px-4 sm:py-8">
        {children}
      </main>
    </div>
  )
}
