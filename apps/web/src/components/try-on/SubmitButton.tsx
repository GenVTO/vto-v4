import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'

interface SubmitButtonProps {
  hasAvailableCredits: boolean
  isLoading: boolean
}

export function SubmitButton({ hasAvailableCredits, isLoading }: SubmitButtonProps) {
  const buttonText = useMemo(() => {
    if (isLoading) {
      return 'Processing...'
    }

    if (hasAvailableCredits) {
      return 'Start Try-On'
    }

    return 'Sin créditos'
  }, [isLoading, hasAvailableCredits])

  return (
    <Button className="w-full" disabled={isLoading || !hasAvailableCredits} type="submit">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {buttonText}
    </Button>
  )
}
