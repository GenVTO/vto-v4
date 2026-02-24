import React from 'react'

export function LogoWall() {
  return (
    <section className="border-y border-slate-100 bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="mb-6 text-sm font-semibold tracking-wider text-slate-400 uppercase">
          Brands that trust GenVTO
        </p>
        <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0 md:gap-16">
          <h3 className="font-serif text-xl font-bold text-slate-800 italic">VOGUE</h3>
          <h3 className="text-xl font-black tracking-tighter text-slate-800">ZARA</h3>
          <h3 className="text-xl font-medium tracking-widest text-slate-800">MANGO</h3>
          <h3 className="text-xl font-bold text-slate-800">H&M</h3>
          <h3 className="font-serif text-xl font-bold text-slate-800">ASOS</h3>
        </div>
      </div>
    </section>
  )
}
