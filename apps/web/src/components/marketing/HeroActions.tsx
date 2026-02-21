import { Button } from '@/components/ui/button'

export function HeroActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg" className="min-w-52">
        <a href="/try-on">Try Live Demo</a>
      </Button>
      <Button asChild size="lg" variant="outline" className="min-w-52">
        <a href="#pricing">See Pricing Model</a>
      </Button>
    </div>
  )
}
