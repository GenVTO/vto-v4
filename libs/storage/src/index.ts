export { createStorageGatewayChain, FallbackStorageGateway } from './fallback'
export { createStorageGateway } from './gateway'
export { createInDiskStorageGateway, InDiskStorageGateway } from './in-disk'

export type { StorageGatewayFactoryOptions } from './gateway'
export type { NamedStorageGateway, StorageGatewayChainOptions } from './fallback'
export type { InDiskStorageOptions } from './in-disk'
