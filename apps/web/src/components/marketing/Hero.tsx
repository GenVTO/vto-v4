import { ShoppingBag, PlayCircle, Star, Sparkles } from 'lucide-react'
import React from 'react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Hero() {
  const shopifyUrl = import.meta.env.PUBLIC_SHOPIFY_APP_URL || '#'

  return (
    <section className="relative overflow-hidden bg-background-light pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* Background Decoration */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-1/2 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col gap-6">
            <Badge
              variant="secondary"
              className="w-fit gap-2 border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              New V2.0 Integration Available
            </Badge>
            <h1 className="text-4xl leading-tight font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Boost Sales and <span className="text-primary">Reduce Returns</span> with AI
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-slate-600">
              Allow your customers to upload full-body photos and try on clothes virtually. Increase
              purchase confidence and drastically reduce returns on your Shopify store.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 bg-primary px-6 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/40"
              >
                <a href={shopifyUrl}>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Install on Shopify
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-slate-200 px-6 text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <a href="#demo">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  View Demo
                </a>
              </Button>
            </div>

            {/* Trust Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-200 pt-8">
              <div>
                <p className="text-2xl font-bold text-slate-900">+40%</p>
                <p className="text-sm font-medium text-slate-500">Conversion</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">-30%</p>
                <p className="text-sm font-medium text-slate-500">Returns</p>
              </div>
              <div>
                <div className="flex items-center text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <p className="text-sm font-medium text-slate-500">5.0 on Shopify</p>
              </div>
            </div>
          </div>

          {/* Hero Image / Mockup */}
          <div className="relative flex w-full justify-center lg:h-auto lg:justify-end">
            <div className="relative aspect-[4/5] w-full max-w-[500px] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl">
              <img
                alt="Fashion model in studio"
                className="h-full w-full object-cover opacity-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfF2VF8UeR6Rp1xW2EU2-oJNchqxzHycnmtyi4-vDXeoFBPknr8dstIDAfGzpAnM31kdfdHwjSR-dtGfGNxxTYi3DsXyMivdzozrbSpYBTu33fln8c2fICGD4gVQti6BX4chjg11h9ZaPYqfBW_FypmGhdWdEfmpZdpL-lzR8lMg6JIcrIpFHzOvWurkMyMCQld6rYZ5ouP8o2KCqhfEqz5ONo22ifjV1LhWXOQosGYkRrJX3ZK8N_ohFr5d_siQ4QSk1Yublm50IZ"
              />

              {/* UI Overlay Mockup */}
              <div className="absolute inset-0 flex items-end justify-center bg-black/10 pb-8">
                <div className="w-[90%] rounded-xl border border-white/50 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary bg-slate-200">
                      <AvatarImage
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBch28gm9jIvyDUKSzbFvlSyc_4mz78QDKbooyYUBCN_lLMT0jB5DYjUBi_ukJlw5ALaqFHwYnTc6vsgT6LCiH4XgNL6c9SLPp4-XU-JN15P9ecDBiwcR2qAvsSSV3Ogi3X9tOPGYx5FWPYrhCpcE1Ezl1R2oQI7462v08jiIhrQS3biT_tO7gkPrYy2joDJu_gMtIvRGKNPaXYz0slIYVEwSxq4eqhI0TaFKmyNhfoxeR-I_MXsnoGsAHBPO5vRyghy89Zc1TO4h4Y"
                        alt="User avatar"
                        className="object-cover"
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Virtual Try-On</p>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <p className="text-[10px] text-slate-500">Generated by AI in 2.4s</p>
                      </div>
                    </div>
                  </div>
                  <Button className="h-8 w-full bg-primary text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90">
                    Add to Cart
                  </Button>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute top-6 right-6 animate-bounce rounded-lg bg-white p-2 shadow-lg">
                <span className="text-primary">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.75 12L10.58 14.83L16.25 9.17004"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
