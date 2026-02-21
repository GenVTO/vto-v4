import type { TryOnModel } from '@vto/types'

const modelMap: Record<TryOnModel, 'fashn-v1.6' | 'fashn-max'> = {
  advanced: 'fashn-max',
  normal: 'fashn-v1.6',
}

export function toFashnModel(model: TryOnModel): 'fashn-v1.6' | 'fashn-max' {
  return modelMap[model]
}

export function toFashnModelName(model: 'fashn-v1.6' | 'fashn-max'): 'tryon-v1.6' | 'tryon-max' {
  return model === 'fashn-v1.6' ? 'tryon-v1.6' : 'tryon-max'
}
