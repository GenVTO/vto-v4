import { useCallback } from 'react'
import { useFormContext } from 'react-hook-form'

import type { OptimizedImagePayload } from './ImageUpload'
import type { TryOnFormValues } from './schema'

import { ImageUpload } from './ImageUpload'

export function ImageUploadSection() {
  const form = useFormContext<TryOnFormValues>()
  const userImage = form.watch('userImage')
  const productImage = form.watch('productImage')

  const onUserImageChange = useCallback(
    (image: OptimizedImagePayload | null) => {
      form.setValue('userImage', image ?? (undefined as never), {
        shouldValidate: true,
      })
    },
    [form],
  )

  const onProductImageChange = useCallback(
    (image: OptimizedImagePayload | null) => {
      form.setValue('productImage', image ?? (undefined as never), {
        shouldValidate: true,
      })
    },
    [form],
  )

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <ImageUpload
        id="user-image"
        image={userImage ?? null}
        label="Your Photo"
        onImageChange={onUserImageChange}
      />
      <ImageUpload
        id="product-image"
        image={productImage ?? null}
        label="Product Image"
        onImageChange={onProductImageChange}
      />
    </div>
  )
}
