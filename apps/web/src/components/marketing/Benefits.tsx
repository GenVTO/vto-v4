import { TrendingUp, Undo, Puzzle, BarChart3 } from 'lucide-react'
import React from 'react'

import { Card, CardContent } from '@/components/ui/card'

export function Benefits() {
  const benefits = [
    {
      description: 'Users who use the virtual try-on are 3x more likely to purchase.',
      icon: TrendingUp,
      title: 'Higher Conversion',
    },
    {
      description: "Drastically reduce 'bracketing' (buying multiple sizes to return).",
      icon: Undo,
      title: 'Fewer Returns',
    },
    {
      description: 'Installs on your Shopify theme with one click. No developers needed.',
      icon: Puzzle,
      title: 'No-Code Integration',
    },
    {
      description: 'Dashboard with data on which garments are tried on the most.',
      icon: BarChart3,
      title: 'Real Analytics',
    },
  ]

  return (
    <section className="bg-background-light py-20" id="benefits">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to scale your fashion e-commerce
            </h2>
            <p className="mb-8 text-lg text-slate-600">
              GenVTO is not just a visual tool, it's a conversion platform designed to eliminate
              friction in online clothing shopping.
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <benefit.icon className="mb-4 h-8 w-8 text-primary" />
                    <h4 className="mb-2 font-bold text-slate-900">{benefit.title}</h4>
                    <p className="text-sm text-slate-500">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mt-8 lg:mt-0">
            <div className="absolute inset-0 translate-x-12 translate-y-12 transform rounded-full bg-primary/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
              {/* Fake Dashboard Header */}
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-4 h-2 w-32 rounded-full bg-slate-200" />
              </div>
              {/* Fake Dashboard Content */}
              <div className="p-6">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">General Performance</h3>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    +12.5% vs last month
                  </span>
                </div>
                <div className="mb-8 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="mb-1 text-xs text-slate-500">Try-on Sessions</p>
                    <p className="text-2xl font-bold text-slate-900">14,205</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="mb-1 text-xs text-slate-500">Add to Cart</p>
                    <p className="text-2xl font-bold text-slate-900">3,890</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="mb-1 text-xs text-slate-500">Attributed Sales</p>
                    <p className="text-2xl font-bold text-slate-900">$45.2k</p>
                  </div>
                </div>
                <div className="flex h-32 w-full items-end justify-between gap-1 rounded-lg bg-slate-50 px-2 pb-2">
                  {/* Simple bar chart */}
                  <div className="h-[40%] w-full rounded-t bg-primary/20" />
                  <div className="h-[60%] w-full rounded-t bg-primary/30" />
                  <div className="h-[30%] w-full rounded-t bg-primary/40" />
                  <div className="h-[80%] w-full rounded-t bg-primary/50" />
                  <div className="h-[55%] w-full rounded-t bg-primary/60" />
                  <div className="h-[90%] w-full rounded-t bg-primary/80" />
                  <div className="h-[75%] w-full rounded-t bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
