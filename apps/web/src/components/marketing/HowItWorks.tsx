import { Camera, Shirt, CheckCircle } from 'lucide-react'
import React from 'react'

export function HowItWorks() {
  const steps = [
    {
      description: 'Customers upload a clear full-body image from their mobile or desktop.',
      icon: Camera,
      title: '1. Upload your photo',
    },
    {
      description: "Browse your catalog and select the 'Virtual Try-On' button on any product.",
      icon: Shirt,
      title: '2. Choose the garment',
    },
    {
      description:
        'Our AI generates an ultra-realistic preview of the garment on their body in seconds.',
      icon: CheckCircle,
      title: '3. See how it fits',
    },
  ]

  return (
    <section className="bg-white py-20 lg:py-32" id="how-it-works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Try on clothes in 3 simple steps
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            A seamless user experience, without technical complications, designed to convert
            visitors into loyal buyers.
          </p>
        </div>
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-12 right-[16%] left-[16%] -z-10 hidden h-0.5 bg-slate-100 md:block" />

          {steps.map((step, index) => (
            <div key={index} className="group flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm shadow-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:border-primary/30 group-hover:shadow-lg">
                <step.icon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="px-4 leading-relaxed text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
