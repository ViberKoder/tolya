'use client'

import Header from '@/components/Header'
import Hero from '@/components/Hero'
import MinterForm from '@/components/MinterForm'
import Features from '@/components/Features'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <div id="create" className="section-padding bg-ton-gray">
        <div className="container-custom">
          <MinterForm />
        </div>
      </div>
      <Features />
      <FAQ />
      <Footer />
    </main>
  )
}
