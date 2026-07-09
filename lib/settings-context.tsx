'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SettingsContextType {
  useBallParkPalModel: boolean
  setUseBallParkPalModel: (value: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [useBallParkPalModel, setUseBallParkPalModel] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('useBallParkPalModel')
    if (saved !== null) {
      setUseBallParkPalModel(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage whenever it changes
  const handleSetUseBallParkPalModel = (value: boolean) => {
    setUseBallParkPalModel(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('useBallParkPalModel', JSON.stringify(value))
    }
  }

  return (
    <SettingsContext.Provider value={{ useBallParkPalModel, setUseBallParkPalModel: handleSetUseBallParkPalModel }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
