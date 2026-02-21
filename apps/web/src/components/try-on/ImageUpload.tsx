'use client'

import type { ChangeEvent, DragEvent } from 'react'

import { Upload } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  id: string
  label: string
  image: string | null
  onImageChange: (image: string | null) => void
}

export function ImageUpload({ id, label, image, onImageChange }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.addEventListener('load', (event) => {
        onImageChange(event.target?.result as string)
      })
      reader.readAsDataURL(file)
    },
    [onImageChange],
  )

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        processFile(file)
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
        processFile(file)
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
              src={image}
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
    </div>
  )
}
