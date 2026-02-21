'use client'

import { Button } from '@/components/ui/button'

interface ResultViewerProps {
  resultUrl: string | null
  onReset: () => void
}

export function ResultViewer({ resultUrl, onReset }: ResultViewerProps) {
  if (!resultUrl) {
    return null
  }

  return (
    <div className="animate-in space-y-4 duration-500 fade-in slide-in-from-bottom-4">
      <h3 className="text-center text-xl font-bold">Your Result</h3>
      <div className="overflow-hidden rounded-xl border bg-background shadow-lg">
        <img
          src={resultUrl}
          alt="Try-on result"
          className="max-h-[600px] w-full bg-muted/20 object-contain"
        />
      </div>
      <div className="flex justify-center">
        <Button variant="outline" onClick={onReset}>
          Try Another One
        </Button>
      </div>
    </div>
  )
}
