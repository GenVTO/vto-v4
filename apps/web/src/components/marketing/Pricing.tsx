import { Check } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { APP_CONFIG } from '@/lib/constants'

export function Pricing() {
  const shopifyUrl = APP_CONFIG.links.shopify

  return (
    <section className="bg-white py-20 lg:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple and transparent plans
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Start for free and scale as your sales grow.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {/* Free Plan */}
          <Card className="flex flex-col border-slate-200 bg-white">
            <CardContent className="flex flex-1 flex-col p-8">
              <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
              <p className="mt-4 flex items-baseline text-slate-900">
                <span className="text-4xl font-bold tracking-tight">$0</span>
                <span className="ml-1 text-sm font-semibold text-slate-500">/mo</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">Perfect for small stores.</p>
              <ul className="mt-8 flex-1 space-y-4">
                <li className="flex items-center text-sm text-slate-600">
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  50 virtual try-ons / mo
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  Basic integration
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  Email support
                </li>
              </ul>
              <Button
                asChild
                variant="outline"
                className="mt-8 w-full border-primary font-bold text-primary hover:bg-primary/5"
              >
                <a href={shopifyUrl}>Start for Free</a>
              </Button>
            </CardContent>
          </Card>

          {/* Ecommerce Plan (Highlighted) */}
          <Card className="relative z-10 flex scale-105 transform flex-col border-2 border-primary bg-white shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold tracking-wider text-white uppercase">
              Most Popular
            </div>
            <CardContent className="flex flex-1 flex-col p-8">
              <h3 className="text-lg font-semibold text-primary">Ecommerce</h3>
              <p className="mt-4 flex items-baseline text-slate-900">
                <span className="text-4xl font-bold tracking-tight">$49</span>
                <span className="ml-1 text-sm font-semibold text-slate-500">/mo</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">For growing brands.</p>
              <ul className="mt-8 flex-1 space-y-4">
                <li className="flex items-center text-sm font-medium text-slate-900">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  2,000 virtual try-ons / mo
                </li>
                <li className="flex items-center text-sm font-medium text-slate-900">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  Brand customization (White label)
                </li>
                <li className="flex items-center text-sm font-medium text-slate-900">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  Advanced analytics
                </li>
                <li className="flex items-center text-sm font-medium text-slate-900">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  Priority 24/7 support
                </li>
              </ul>
              <Button
                asChild
                className="mt-8 w-full bg-primary font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                <a href={shopifyUrl}>14-day Free Trial</a>
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="flex flex-col border-slate-200 bg-white">
            <CardContent className="flex flex-1 flex-col p-8">
              <h3 className="text-lg font-semibold text-slate-900">Enterprise</h3>
              <p className="mt-4 flex items-baseline text-slate-900">
                <span className="text-4xl font-bold tracking-tight">Custom</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">For large retailers.</p>
              <ul className="mt-8 flex-1 space-y-4">
                <li className="flex items-center text-sm text-slate-600">
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  Unlimited try-ons
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  API Access
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  Dedicated account manager
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  Guaranteed SLA
                </li>
              </ul>
              <Button
                asChild
                variant="outline"
                className="mt-8 w-full border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              >
                <a href="mailto:sales@genvto.com">Contact Sales</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
