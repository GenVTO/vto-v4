import type { Tables, TablesInsert, TablesUpdate, Enums } from './generated/database.types'

export type TenantRow = Tables<'tenants'>
export type TenantInsert = TablesInsert<'tenants'>
export type TenantUpdate = TablesUpdate<'tenants'>

export type ApiKeyRow = Tables<'api_keys'>
export type ApiKeyInsert = TablesInsert<'api_keys'>
export type ApiKeyUpdate = TablesUpdate<'api_keys'>

export type CreditLedgerRow = Tables<'credit_ledgers'>
export type CreditLedgerInsert = TablesInsert<'credit_ledgers'>
export type CreditLedgerUpdate = TablesUpdate<'credit_ledgers'>

export type TryOnJobRow = Tables<'tryon_jobs'>
export type TryOnJobInsert = TablesInsert<'tryon_jobs'>
export type TryOnJobUpdate = TablesUpdate<'tryon_jobs'>

export type TryOnJobEventsRow = Tables<'tryon_job_events'>
export type TryOnJobEventsInsert = TablesInsert<'tryon_job_events'>
export type TryOnJobEventsUpdate = TablesUpdate<'tryon_job_events'>

export type UserImageRow = Tables<'user_images'>
export type UserImageInsert = TablesInsert<'user_images'>
export type UserImageUpdate = TablesUpdate<'user_images'>

export type CreditEventType = Enums<'credit_event_type'>
export type TryOnModel = Enums<'tryon_model'>
export type TryOnJobStatus = Enums<'tryon_job_status'>
