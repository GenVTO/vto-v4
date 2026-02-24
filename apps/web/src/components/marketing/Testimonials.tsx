import { Star } from 'lucide-react'
import React from 'react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function Testimonials() {
  const testimonials = [
    {
      content:
        "Since installing GenVTO, we've noticed a 25% reduction in returns due to sizing issues. It's incredible.",
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBMIDAE2O0LsyCb08sNQcBZg74tORFpyB9a9ViXWzlzHhmPV4K7nFUMxa0UviQIQrc_52fcOnkfGPP0P_rax3swfUJ9-LlNrBo2n2GtpR7GYKkLrKLv2sbSxcXe46J6HQr5X13Nvyats95kd0f1BGXcNeUnBpk5aebVogz_m_gc6V0L6VWrXzY9aaTved4N7lwUb0Zl6bnKK2nLCg2oppBkYj6xntzlQMEottPz-3nDI8sxAF_bfHQEsR7vob4UoBQ3O4ozuYdmeK2N',
      initials: 'SM',
      name: 'Sofia Martinez',
      role: 'CEO, ModaUrbana',
    },
    {
      content:
        'Integration was super simple. In 5 minutes it was running on my Shopify store. My customers love it.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAz562l2dYzWbuwktoGEXBAu4iSRmtz5FJ4sDssquruvrGIOeR1e0yZqgBScnKmFJ8VzKTW7ggRb65s_YisFKj4qn2RMNiRMq_rPeGNMjVEqqqVNj_IRPYfji9rPILOXTwkoIuhfOV3kgJm00V7gVmbSEq9keMQRDwei3MWr_Xvr5DfSQqP2H4ukG7yGIVAyCGmupuTH6gmVs_4QLXve517iaxIZocIB7TVnuzbgo_6VYbDfbhnXjtHqeclz0k3QJQy3iTVvfrNlTUB',
      initials: 'CR',
      name: 'Carlos Ruiz',
      role: 'Founder, MinimalFits',
    },
    {
      className: 'hidden lg:block',
      content:
        'Technical support is excellent and the quality of the clothing visualization on the body is far superior to other apps.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAdwQpvdBBWk8R0no4xL52VGDdrVW48oY_qOZ4aQpapBtTuz6KyYXGgPU9PE8YyWKKJm_ay3T9yFmeYCNRfkDjeL8I1E7hCy-EwL7fep-r07BcBqEeF9prmvyBoDpk9XxilOWIMIIvC0Sg9lE5g0r1RHq-wBkzZR4CJqm1kDFsc5vLDP3ZgNe-xKkU4Kzf0mzgv9Ego9R8EqvKyjNk_IVfyP3ec4XyQdBUoKbdCRabrIYYVE2oXg884abRaCoIBZoNI9vN6XJNmuQIB',
      initials: 'EG',
      name: 'Elena Gomez',
      role: 'Marketing, StyleHub',
    },
  ]

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900">
          What our customers say
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className={cn('border-slate-100 shadow-sm', testimonial.className)}>
              <CardContent className="p-8">
                <div className="mb-4 flex items-center text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="mb-6 text-slate-600">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="object-cover"
                    />
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
