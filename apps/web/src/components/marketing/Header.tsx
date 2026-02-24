import { Menu } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const shopifyUrl = import.meta.env.PUBLIC_SHOPIFY_APP_URL || '#'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)

    // Check if we are in admin section
    setIsAdmin(globalThis.location.pathname.startsWith('/admin'))

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = isAdmin
    ? [
        { href: '/admin/try-on', name: 'Playground' },
        { href: '/admin/history', name: 'History' },
        { href: '/admin/env', name: 'Environment' },
      ]
    : [
        { href: '/#how-it-works', name: 'How it works' },
        { href: '/#benefits', name: 'Benefits' },
        { href: '/#pricing', name: 'Pricing' },
        { href: '/#faq', name: 'FAQ' },
        { href: '/#blog', name: 'Blog' },
      ]

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        isScrolled || isAdmin
          ? 'border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="transition-opacity hover:opacity-80">
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-primary"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!isAdmin && (
            <Button
              asChild
              className="hidden bg-primary font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/40 sm:inline-flex"
            >
              <a href={shopifyUrl}>Install on Shopify</a>
            </Button>
          )}

          {isAdmin && (
            <Button asChild variant="outline" className="hidden font-bold sm:inline-flex">
              <a href="/">Exit Admin</a>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6 text-slate-600" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-lg font-medium text-slate-600 hover:text-primary"
                  >
                    {link.name}
                  </a>
                ))}
                {!isAdmin && (
                  <Button asChild className="mt-4 w-full bg-primary font-bold text-white">
                    <a href={shopifyUrl}>Install on Shopify</a>
                  </Button>
                )}
                {isAdmin && (
                  <Button asChild variant="outline" className="mt-4 w-full font-bold">
                    <a href="/">Exit Admin</a>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
