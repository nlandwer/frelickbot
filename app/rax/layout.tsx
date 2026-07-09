'use client'

export default function RAXLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background pb-10">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </div>
  )
}
