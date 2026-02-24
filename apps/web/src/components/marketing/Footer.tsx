import { Box } from 'lucide-react'
import React from 'react'

import { Separator } from '@/components/ui/separator'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-800 bg-slate-900 pt-16 pb-8 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Box className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">GenVTO</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              The leading AI-powered virtual try-on solution for fashion brands on Shopify.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">Product</h3>
            <ul className="space-y-3">
              <li>
                <a
                  className="text-sm text-slate-400 transition-colors hover:text-primary"
                  href="#how-it-works"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-slate-400 transition-colors hover:text-primary"
                  href="#pricing"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a className="text-sm text-slate-400 transition-colors hover:text-primary" href="#">
                  Integrations
                </a>
              </li>
              <li>
                <a className="text-sm text-slate-400 transition-colors hover:text-primary" href="#">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  className="text-sm text-slate-400 transition-colors hover:text-primary"
                  href="#blog"
                >
                  Blog
                </a>
              </li>
              <li>
                <a className="text-sm text-slate-400 transition-colors hover:text-primary" href="#">
                  Documentation
                </a>
              </li>
              <li>
                <a className="text-sm text-slate-400 transition-colors hover:text-primary" href="#">
                  Help Center
                </a>
              </li>
              <li>
                <a className="text-sm text-slate-400 transition-colors hover:text-primary" href="#">
                  Community
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a className="text-sm text-slate-400 transition-colors hover:text-primary" href="#">
                  Privacy
                </a>
              </li>
              <li>
                <a className="text-sm text-slate-400 transition-colors hover:text-primary" href="#">
                  Terms
                </a>
              </li>
              <li>
                <a className="text-sm text-slate-400 transition-colors hover:text-primary" href="#">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        <div className="flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">© {currentYear} GenVTO Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-slate-400">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
