import type { VariantProps } from 'class-variance-authority'

import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const logoVariants = cva('flex items-center gap-2 font-bold tracking-tight transition-opacity', {
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
  variants: {
    size: {
      default: 'text-xl',
      lg: 'text-2xl',
      sm: 'text-lg',
    },
    variant: {
      default: 'text-slate-900',
      white: 'text-white',
    },
  },
})

const logoImageVariants = cva('rounded-lg object-contain', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'h-8 w-8',
      lg: 'h-10 w-10',
      sm: 'h-6 w-6',
    },
  },
})

export interface LogoProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof logoVariants> {
  asChild?: boolean
}

function Logo({ className, variant, size, ...props }: LogoProps) {
  return (
    <div className={cn(logoVariants({ className, size, variant }))} {...props}>
      <img src="/favicon.png" alt="GenVTO Logo" className={cn(logoImageVariants({ size }))} />
      <span>GenVTO</span>
    </div>
  )
}

export { Logo, logoVariants }
