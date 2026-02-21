import { toFashnModel } from './index'

describe(toFashnModel, () => {
  it('maps normal to fashn-v1.6', () => {
    expect(toFashnModel('normal')).toBe('fashn-v1.6')
  })

  it('maps advanced to fashn-max', () => {
    expect(toFashnModel('advanced')).toBe('fashn-max')
  })
})
