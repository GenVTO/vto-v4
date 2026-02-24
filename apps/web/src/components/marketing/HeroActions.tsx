import { Button } from '@/components/ui/button'

export function HeroActions() {
  return (
    <div className="flex gap-2">
      <Button asChild>
        <a href="/admin/try-on">Try Demo</a>
      </Button>
      <Button asChild variant="secondary">
        <a href="https://github.com/vto-ai/vto">View Source</a>
      </Button>
    </div>
  )
}
