import React from 'react'

import { Button } from '@/components/ui/button'

export function HeroActions() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Button size="lg">Get Started</Button>
      <Button variant="outline" size="lg">
        Learn More
      </Button>
    </div>
  )
}
