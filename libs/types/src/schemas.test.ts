import { createTryOnRequestSchema } from './schemas'

describe('createTryOnRequestSchema', () => {
  it('accepts a valid URL payload', () => {
    const result = createTryOnRequestSchema.safeParse({
      model: 'advanced',
      product_id: '123',
      product_image_url: 'https://cdn.example.com/product.jpg',
      shop_domain: 'test-shop.myshopify.com',
      user_image_url: 'https://cdn.example.com/user.jpg',
      visitor_id: 'visitor_12345678',
    })

    expect(result.success).toBeTruthy()
  })

  it('accepts a valid file-like payload', () => {
    const result = createTryOnRequestSchema.safeParse({
      model: 'normal',
      product_id: '123',
      product_image_url: 'https://cdn.example.com/product.jpg',
      shop_domain: 'test-shop.myshopify.com',
      user_image: 'person.jpg',
      visitor_id: 'visitor_12345678',
    })

    expect(result.success).toBeTruthy()
  })
})
