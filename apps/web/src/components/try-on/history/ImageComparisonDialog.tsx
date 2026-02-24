import { ZoomIn } from 'lucide-react'
import React, { useRef, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ImageComparisonDialogProps {
  originalImage?: string
  productImage?: string // Kept in interface but not used in UI as requested
  resultImage?: string
}

export function ImageComparisonDialog({ originalImage, resultImage }: ImageComparisonDialogProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showMagnifier, setShowMagnifier] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) {
      return
    }

    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    // Calculate percentage relative to the CONTAINER
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100

    // Since we have 2 columns with a gap, we need to normalize X to be 0-100% relative to the IMAGE column
    // The container is split roughly 50/50 with a gap
    // If mouse is in left half (0-50%), normalize to 0-100%
    // If mouse is in right half (50-100%), normalize to 0-100%

    // Simple heuristic: if x > 50, subtract 50 and multiply by 2 (roughly)
    // Actually, it's better to just track mouse relative to the specific image container
    // But we want SYNCED zoom. So if I hover left image at 10%, right image should also zoom at 10%.

    // Improved logic:
    // 1. Determine which column the mouse is over
    // 2. Calculate local percentage within that column
    // 3. Use that local percentage for BOTH magnifiers

    // Assuming 2 columns with gap-4 (16px)
    // Let's assume equal width columns for simplicity

    let localX = x
    if (x > 50) {
      localX = (x - 50) * 2 // Map 50-100 to 0-100
    } else {
      localX = x * 2 // Map 0-50 to 0-100
    }

    // Clamping just in case
    localX = Math.max(0, Math.min(100, localX))

    setPosition({ x: localX, y })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200">
          <ZoomIn className="h-3.5 w-3.5" />
          Compare & Zoom
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] w-full max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[95vw]">
        <DialogHeader className="z-10 shrink-0 border-b bg-white p-4">
          <DialogTitle>Image Comparison</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 items-center justify-center overflow-hidden bg-slate-50 p-4">
          <div
            className="grid h-full w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2"
            ref={containerRef}
            onMouseEnter={() => setShowMagnifier(true)}
            onMouseLeave={() => setShowMagnifier(false)}
            onMouseMove={handleMouseMove}
          >
            {/* Original Image */}
            <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="border-b bg-slate-50 p-2 text-center text-xs font-medium text-slate-500">
                Original User Image
              </div>
              <div className="relative flex-1 overflow-hidden">
                {originalImage ? (
                  <>
                    <img
                      src={originalImage}
                      alt="Original"
                      className="absolute inset-0 h-full w-full object-contain p-2"
                    />
                    {showMagnifier && (
                      <div
                        className="pointer-events-none absolute h-32 w-32 rounded-full border-2 border-primary bg-white bg-no-repeat shadow-xl"
                        style={{
                          backgroundImage: `url(${originalImage})`,
                          backgroundPosition: `${position.x}% ${position.y}%`,
                          backgroundSize: '300%',
                          left: `calc(${position.x}% - 64px)`,
                          top: `calc(${position.y}% - 64px)`, // 3x zoom
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No image
                  </div>
                )}
              </div>
            </div>

            {/* Result Image */}
            <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="border-b bg-slate-50 p-2 text-center text-xs font-medium text-slate-500">
                Try-On Result
              </div>
              <div className="relative flex-1 overflow-hidden">
                {resultImage ? (
                  <>
                    <img
                      src={resultImage}
                      alt="Result"
                      className="absolute inset-0 h-full w-full object-contain p-2"
                    />
                    {showMagnifier && (
                      <div
                        className="pointer-events-none absolute h-32 w-32 rounded-full border-2 border-primary bg-white bg-no-repeat shadow-xl"
                        style={{
                          backgroundImage: `url(${resultImage})`,
                          backgroundPosition: `${position.x}% ${position.y}%`,
                          backgroundSize: '300%',
                          left: `calc(${position.x}% - 64px)`,
                          top: `calc(${position.y}% - 64px)`, // 3x zoom
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No result
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
