export interface ShopItem {
  completed_consumed_count: number
  credits: number
  failed_charged_count: number
  in_flight_reserved_count: number
  refunded_credits: number
  reserved_or_spent_credits: number
  shop_domain: string
  tenant_id: string
}

export const FORM_DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111'
export const FORM_DEFAULT_API_KEY = 'dev_vto_api_key'
export const FORM_DEFAULT_SHOP_DOMAIN = 'demo-shop.myshopify.com'
