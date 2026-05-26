// components/bottom-nav.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Timer, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  const isAuthPage = pathname === '/login' || pathname === '/register'
  if (isAuthPage) return null

  const navItems = [
    { label: 'Beranda', href: '/', icon: Home },
    { label: 'Catat', href: '/record', icon: Timer, isPrimary: true },
    { label: 'Profil', href: '/profile', icon: User },
  ]

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-20 px-4 z-50">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        if (item.isPrimary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center -mt-10"
              id={`nav-${item.label.toLowerCase()}`}
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-4 border-white shadow-orange-100",
                isActive ? "bg-[#FF6321]" : "bg-[#FF6321]"
              )}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <span className={cn(
                "text-[10px] font-bold mt-1 uppercase tracking-[0.15em]",
                isActive ? "text-[#FF6321]" : "text-gray-400"
              )}>
                {item.label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 py-2"
            id={`nav-${item.label.toLowerCase()}`}
          >
            <Icon className={cn(
              "w-6 h-6 mb-1",
              isActive ? "text-[#FF6321]" : "text-gray-400"
            )} />
            <span className={cn(
              "text-[10px] font-bold tracking-tight",
              isActive ? "text-[#FF6321]" : "text-gray-400"
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
