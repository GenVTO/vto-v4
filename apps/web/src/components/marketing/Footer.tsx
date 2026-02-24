import { Shirt } from 'lucide-react'
import React from 'react'

import { Separator } from '@/components/ui/separator'

import { SystemStatus } from './SystemStatus'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const productLinks = [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#benefits', label: 'Benefits' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#faq', label: 'FAQ' },
  ]

  const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
    { href: '/security', label: 'Security' },
  ]

  return (
    <footer className="border-t border-slate-800 bg-slate-950 pt-20 pb-10 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          {/* Brand Column */}
          <div className="max-w-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                <Shirt className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">GenVTO</span>
            </div>
            <p className="mb-8 text-sm leading-7 text-slate-400">
              Revolutionizing the fashion e-commerce experience with AI-powered virtual try-on
              technology. Reduce returns, boost conversions, and delight your customers.
            </p>
            <div className="mt-4">
              <SystemStatus />
            </div>
          </div>

          {/* Links Grid */}
          <div className="flex flex-wrap gap-16 lg:gap-24">
            <div>
              <h3 className="mb-6 text-sm font-semibold tracking-wider text-white uppercase">
                Product
              </h3>
              <ul className="space-y-4">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-6 text-sm font-semibold tracking-wider text-white uppercase">
                Legal
              </h3>
              <ul className="space-y-4">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-12 bg-slate-800/50" />

        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} GenVTO Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
