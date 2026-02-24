import React from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQItem {
  question: string
  answer: string
}

const FAQS: FAQItem[] = [
  {
    answer:
      "Our AI technology analyzes the user's uploaded photo and the garment image to create a realistic simulation. It adapts the clothing to the user's body shape and pose, preserving the texture and details of the fabric.",
    question: 'How does the virtual try-on technology work?',
  },
  {
    answer:
      "Yes, GenVTO is designed to work with any Shopify theme. Our 'No-Code' integration allows you to add the try-on button to your product pages with just a few clicks, without needing technical knowledge.",
    question: 'Is it compatible with all Shopify themes?',
  },
  {
    answer:
      'Currently, we support upper body garments (t-shirts, shirts, sweaters, jackets) and full-body dresses. We are working on adding support for pants and skirts in the near future.',
    question: 'What types of garments are supported?',
  },
  {
    answer:
      'Credits are consumed only when a user successfully generates a try-on image. If the generation fails for any reason, no credit is deducted from your balance.',
    question: 'How are credits charged?',
  },
  {
    answer:
      "Absolutely. The Enterprise plan allows full customization of the widget's appearance to match your brand identity. The Ecommerce plan includes basic customization options like colors and button text.",
    question: 'Can I customize the look of the try-on widget?',
  },
  {
    answer:
      'You will receive a notification when your credits are running low. If you exhaust your monthly limit, the try-on button will temporarily be hidden until your next billing cycle or until you upgrade your plan.',
    question: 'What happens if I run out of credits?',
  },
]

export function FAQ() {
  return (
    <section className="bg-white py-20" id="faq">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-medium text-slate-900">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
