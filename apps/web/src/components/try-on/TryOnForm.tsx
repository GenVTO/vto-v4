'use client'

import type { SyntheticEvent } from 'react'

import { Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ImageUpload } from './ImageUpload'
import { LogViewer } from './LogViewer'
import { ResultViewer } from './ResultViewer'
import { useTryOnJob } from './use-try-on-job'

export function TryOnForm() {
  const [userImage, setUserImage] = useState<string | null>(null)
  const [productImage, setProductImage] = useState<string | null>(null)
  const [model, setModel] = useState<string>('advanced')

  const { isLoading, logs, resultUrl, submitJob, reset } = useTryOnJob()

  const handleSubmit = useCallback(
    async (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!userImage || !productImage) {
        alert('Please select both images')
        return
      }

      await submitJob(userImage, productImage, model)
    },
    [userImage, productImage, model, submitJob],
  )

  const handleReset = useCallback(() => {
    reset()
    setUserImage(null)
    setProductImage(null)
  }, [reset])

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <ImageUpload
                id="user-image"
                label="Your Photo"
                image={userImage}
                onImageChange={setUserImage}
              />
              <ImageUpload
                id="product-image"
                label="Product Image"
                image={productImage}
                onImageChange={setProductImage}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-select">Generation Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (Faster)</SelectItem>
                  <SelectItem value="advanced">Advanced (Higher Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !userImage || !productImage}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Processing...' : 'Start Try-On'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <LogViewer logs={logs} isLoading={isLoading} />

      <ResultViewer resultUrl={resultUrl} onReset={handleReset} />
    </div>
  )
}
