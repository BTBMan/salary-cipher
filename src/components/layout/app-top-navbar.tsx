'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MdShield } from 'react-icons/md'
import { WalletConnection } from '@/components/wallet/wallet-connection'
import { topNavItems } from '@/configs'
import { cn } from '@/utils'

export function AppTopNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentHash, setCurrentHash] = useState('')
  const params = useParams()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setCurrentHash(window.location.hash || '#overview')
  }, [params])

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
      isScrolled
        ? 'bg-background/80 backdrop-blur-md border-border/50 py-3'
        : 'bg-transparent border-transparent py-5',
    )}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg primary-gradient text-primary-foreground group-hover:scale-110 transition-transform">
            <MdShield className="size-6" />
          </div>
          <span className="text-xl font-heading font-bold tracking-tight">Salary Cipher</span>
        </Link>

        <div className="absolute left-1/2 top-1/2 -translate-1/2 hidden md:flex items-center gap-8">
          {
            topNavItems.map(item => (
              <Link
                key={item.title}
                className={cn(
                  'text-sm transition-colors',
                  currentHash === item.href
                    ? 'font-semibold text-brand'
                    : 'text-slate-400 hover:text-slate-300',
                )}
                href={item.href}
              >
                {item.title}
              </Link>
            ))
          }
        </div>

        <div className="flex items-center gap-4">
          <WalletConnection direction="horizontal" />
        </div>
      </div>
    </nav>
  )
}
