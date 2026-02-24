import React from 'react'

import { Button } from '@/components/ui/button'
import { APP_CONFIG } from '@/lib/constants'

export function CTA() {
  const shopifyUrl = APP_CONFIG.links.shopify

  return (
    <section className="px-4 py-20">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-purple-600 px-6 py-16 text-center shadow-2xl sm:px-12">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-0 bottom-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-black/10 blur-2xl" />

        <div className="relative z-10">
          <h2 className="mb-6 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Start for free on Shopify today
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80">
            Join over 500 fashion brands that are already revolutionizing their customers' shopping
            experience.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              className="h-14 w-full bg-white px-8 text-lg font-bold text-primary shadow-lg transition-all hover:scale-105 hover:bg-slate-100 sm:w-auto"
            >
              <a href={shopifyUrl}>Install GenVTO Free</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 w-full border-white/30 bg-white/10 px-8 text-lg font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white sm:w-auto"
            >
              <a href="#demo">Schedule Demo</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-white/60">No credit card required for Starter plan.</p>
        </div>
      </div>
    </section>
  )
}
