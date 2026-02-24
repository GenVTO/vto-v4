import React from 'react'
import { GlassMagnifier } from 'react-image-magnifiers'

import type { TryOnHistoryItem } from './types'

import { ImageComparisonDialog } from './ImageComparisonDialog'
import { getOriginalImageUrl, getProductImageUrl } from './utils'

interface HistoryImagesProps {
  item: TryOnHistoryItem
}

export function HistoryImages({ item }: HistoryImagesProps) {
  const originalImage = getOriginalImageUrl(item.events)
  const productImage = getProductImageUrl(item.events)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Images</h4>
        <ImageComparisonDialog
          originalImage={originalImage}
          productImage={productImage}
          resultImage={item.result_url || undefined}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {originalImage && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Original</p>
            <div className="aspect-[3/4] overflow-hidden rounded-lg border bg-white">
              <img src={originalImage} alt="Original" className="h-full w-full object-cover" />
            </div>
          </div>
        )}
        {productImage && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Product</p>
            <div className="aspect-[3/4] overflow-hidden rounded-lg border bg-white">
              <img src={productImage} alt="Product" className="h-full w-full object-contain p-2" />
            </div>
          </div>
        )}
        {item.result_url && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Result</p>
            <div className="aspect-[3/4] overflow-hidden rounded-lg border bg-white">
              <GlassMagnifier
                imageSrc={item.result_url}
                imageAlt="Result"
                className="h-full w-full object-cover"
                magnifierSize="40%"
                square
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
