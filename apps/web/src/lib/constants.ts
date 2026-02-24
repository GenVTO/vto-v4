export const APP_CONFIG = {
  description:
    'Revolutionizing the fashion e-commerce experience with AI-powered virtual try-on technology.',
  links: {
    demo: '#demo',
    shopify: 'https://shopify.genvto.com', // Placeholder for now
  },
  name: 'GenVTO',
  navigation: {
    admin: [
      { href: '/admin/try-on', label: 'Playground' },
      { href: '/admin/history', label: 'History' },
      { href: '/admin/env', label: 'Environment' },
    ],
    legal: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/security', label: 'Security' },
    ],
    product: [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#benefits', label: 'Benefits' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/#faq', label: 'FAQ' },
      { href: '/#blog', label: 'Blog' },
    ],
  },
  seo: {
    defaultDescription:
      'Increase sales and reduce returns with our AI virtual try-on solution for Shopify. Allow customers to try clothes virtually in seconds.',
    defaultTitle: 'GenVTO - AI Virtual Try-On for Shopify',
    openGraph: {
      images: [
        {
          alt: 'GenVTO - AI Virtual Try-On for Shopify',
          height: 630,
          url: 'https://www.genvto.com/og-image.jpg',
          width: 1200,
        },
      ],
      locale: 'en_US',
      site_name: 'GenVTO',
      type: 'website',
      url: 'https://www.genvto.com',
    },
    siteUrl: 'https://www.genvto.com',
    titleTemplate: '%s | GenVTO',
  },
}
