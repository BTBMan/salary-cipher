'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MdClose, MdMenu, MdShield } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
      isScrolled
        ? 'bg-background/80 backdrop-blur-md border-border/50 py-3'
        : 'bg-transparent border-transparent py-5',
    )}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg primary-gradient text-primary-foreground group-hover:scale-110 transition-transform">
            <MdShield className="size-6" />
          </div>
          <span className="text-xl font-heading font-bold tracking-tight">Salary Cipher</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Security</Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            nativeButton={false}
            render={(
              <Link href="/dashboard">
                <span>Sign In</span>
              </Link>
            )}
          />
          <Button
            className="primary-gradient border-none"
            nativeButton={false}
            render={(
              <Link href="/dashboard">
                <span>Get Started</span>
              </Link>
            )}
          />
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <MdClose /> : <MdMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
          <Link href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
          <Link href="#security" onClick={() => setIsMobileMenuOpen(false)}>Security</Link>
          <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="w-full" render={<Link href="/dashboard">Sign In</Link>} />
            <Button className="w-full primary-gradient border-none" render={<Link href="/dashboard">Get Started</Link>} />
          </div>
        </div>
      )}
    </nav>
  )
}
