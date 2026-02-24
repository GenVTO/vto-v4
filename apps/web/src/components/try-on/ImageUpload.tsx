'use client'

import type { ChangeEvent, DragEvent } from 'react'

import { Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const OPTIMIZED_FORMAT = 'image/jpeg'
const OPTIMIZED_QUALITY = 0.8
const MAX_IMAGE_DIMENSION = 1536

export interface ImageOptimizationStats {
  optimizedBytes: number
  optimizedPercent: number
  originalBytes: number
}

export interface OptimizedImagePayload {
  file: File
  previewUrl: string
  stats: ImageOptimizationStats
}

interface ImageUploadProps {
  id: string
  label: string
  image: OptimizedImagePayload | null
  onImageChange: (image: OptimizedImagePayload | null) => void
}

export function ImageUpload({ id, label, image, onImageChange }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const optimizeImage = useCallback(async (file: File): Promise<OptimizedImagePayload> => {
    const sourceUrl = URL.createObjectURL(file)
    const source = new Image()
    source.src = sourceUrl
    await source.decode()

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(source.width, source.height))
    const targetWidth = Math.max(1, Math.round(source.width * scale))
    const targetHeight = Math.max(1, Math.round(source.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext('2d')

    if (!context) {
      URL.revokeObjectURL(sourceUrl)
      throw new Error('Unable to optimize image in browser.')
    }

    context.drawImage(source, 0, 0, targetWidth, targetHeight)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => {
          if (!nextBlob) {
            reject(new Error('Failed to create optimized image blob.'))
            return
          }

          resolve(nextBlob)
        },
        OPTIMIZED_FORMAT,
        OPTIMIZED_QUALITY,
      )
    })

    const optimizedFile = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, {
      type: OPTIMIZED_FORMAT,
    })

    if (optimizedFile.size >= file.size) {
      URL.revokeObjectURL(sourceUrl)
      const originalUrl = URL.createObjectURL(file)

      return {
        file,
        previewUrl: originalUrl,
        stats: {
          optimizedBytes: file.size,
          optimizedPercent: 0,
          originalBytes: file.size,
        },
      }
    }

    const optimizedUrl = URL.createObjectURL(optimizedFile)
    URL.revokeObjectURL(sourceUrl)

    const optimizedPercent =
      file.size > 0
        ? Math.max(0, Number((((file.size - optimizedFile.size) / file.size) * 100).toFixed(2)))
        : 0

    return {
      file: optimizedFile,
      previewUrl: optimizedUrl,
      stats: {
        optimizedBytes: optimizedFile.size,
        optimizedPercent,
        originalBytes: file.size,
      },
    }
  }, [])

  const clearCurrentPreview = useCallback(() => {
    if (image?.previewUrl) {
      URL.revokeObjectURL(image.previewUrl)
    }
  }, [image?.previewUrl])

  useEffect(() => {
    const currentPreviewUrl = image?.previewUrl
    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl)
      }
    }
  }, [image?.previewUrl])

  const processFile = useCallback(
    async (file: File) => {
      clearCurrentPreview()
      const optimized = await optimizeImage(file)
      onImageChange(optimized)
    },
    [clearCurrentPreview, onImageChange, optimizeImage],
  )

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        void processFile(file)
      }
    },
    [processFile],
  )

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      const file = event.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        void processFile(file)
      }
    },
    [processFile],
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        id={id}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className={cn(
          'relative flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/50 px-6 py-4 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/10' : 'hover:bg-muted/80',
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {image ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src={image.previewUrl}
              alt={`${label} preview`}
              className="max-h-[200px] w-full rounded-md object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <span className="font-medium text-white">Change Image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <span className="text-xs font-medium">Click to upload</span>
          </div>
        )}
      </button>
      {image && (
        <div className="rounded-md border bg-muted/40 p-2 text-xs">
          <p>
            Original: <strong>{(image.stats.originalBytes / 1024).toFixed(2)} KB</strong>
          </p>
          <p>
            Optimized: <strong>{(image.stats.optimizedBytes / 1024).toFixed(2)} KB</strong>
          </p>
          <p>
            Saved: <strong>{image.stats.optimizedPercent}%</strong>
          </p>
        </div>
      )}
    </div>
  )
}
