import { Menu, Box, X } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const shopifyUrl = import.meta.env.PUBLIC_SHOPIFY_APP_URL || '#'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#how-it-works', name: 'How it works' },
    { href: '#benefits', name: 'Benefits' },
    { href: '#pricing', name: 'Pricing' },
    { href: '#faq', name: 'FAQ' },
    { href: '#blog', name: 'Blog' },
  ]

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Box className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">GenVTO</span>
        </div>

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
          <Button
            asChild
            className="hidden bg-primary font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/40 sm:inline-flex"
          >
            <a href={shopifyUrl}>Install on Shopify</a>
          </Button>

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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Box className="h-5 w-5" />
                  </div>
                  GenVTO
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
                <Button asChild className="mt-4 w-full bg-primary font-bold text-white">
                  <a href={shopifyUrl}>Install on Shopify</a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
