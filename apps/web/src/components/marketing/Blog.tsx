import { ArrowRight } from 'lucide-react'
import React from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export function Blog() {
  const articles = [
    {
      category: 'Trends',
      excerpt: 'How artificial intelligence is transforming the way we buy clothes online.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCM4DeThWDTigAMmNGa-xj1-O5v1HvvihDDDCLtiVj7ZasO9pLfNpWOr650nyku0m07PqTvNrXqijIvAE1cC6bJIcK4Xq_ZsSkjmV3kSdxCA10d2retZvBHvzdSj98nk4qREbx6gFaTOlcDNIykBeLlqVLnRaXapHe5RdI6syJv_iXS-kw_fCf6tbcjJKb5M7_P5ZpctB0rlxMk0DQIwPMBXAWEwM_i1JjW7UCXqJmlJwy0kGAHAsOW5eggU3w_bYnHPwqflkd9cUAj',
      title: 'The future of digital fashion in 2024',
    },
    {
      category: 'Case Study',
      excerpt:
        'We analyze the strategies of major retailers to minimize the impact of reverse logistics.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAOIBinqAalOYQ0VKT81ktSAJqlZTuWEwk708jASwSQRcQDw6nxrxKVMef4KfRWcLh4JthyoxrKRC0O3vg3ZNeUZf6svvQaBwX6av7_yU9monVvjT3BNwacEOWdrSOR7VlE4EbX5z8sM2uOAL4_IzUUa1QxJ45jvECE_VF7_T3epIFbBDDlM2PqaIfKy9Ru_Diqeh9IpvDRQei4dPYzVog_RGbh9OasE87S3Gi0PE4vegVYpxzd2R1Ch4zQ_HUe9fT1ddGPKljARPT0',
      title: 'How Zara reduced returns by 15%',
    },
    {
      category: 'Technology',
      excerpt: 'Step-by-step guide to setting up the virtual try-on in custom Shopify themes.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDSo0yasxYaTGKiUc-2Mt_eX4p9T-TZd1vSsOuVgPzm0YFj-_0tIbqy6oR66iKckVloCEi0aIbT3ktaQ1tuvixAA-FJrdrcUg1YOghFyID1DS9q7GpgDf2dyprDjIk3VIFdVzm8zQZ1zygIOWfc_mHUjx83An0UdCM4ZRr4vgGCDfVno7RVwDUCslABYvPzQwMZEFr5isqFtq27B_7fg8iraD5Kc2MD3xJwhFBa6Je7CKIMH6x6NzcN1QYtGkYEKIHNX5Jp20YX57KK',
      title: 'GenVTO Integration: Technical Guide',
    },
  ]

  return (
    <section className="bg-white py-20" id="blog">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Latest News</h2>
            <p className="mt-2 text-slate-600">Trends in e-commerce and fashion technology.</p>
          </div>
          <a
            className="hidden items-center font-bold text-primary hover:underline sm:flex"
            href="#"
          >
            View all blog
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {articles.map((article, index) => (
            <Card
              key={index}
              className="group cursor-pointer overflow-hidden border-slate-100 shadow-sm transition-all hover:shadow-md"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src={article.image}
                />
              </div>
              <CardContent className="p-6">
                <Badge
                  variant="secondary"
                  className="mb-3 border-none bg-primary/5 font-bold tracking-wide text-primary uppercase hover:bg-primary/10"
                >
                  {article.category}
                </Badge>
                <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-primary">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-500">{article.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
