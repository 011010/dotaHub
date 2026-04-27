import Link from 'next/link'
import { ChaosBackground } from '@/components/ChaosBackground'
import { InvokerOrbs } from '@/components/InvokerOrbs'
import { SiteHeader } from '@/components/SiteHeader'

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <ChaosBackground />

      <SiteHeader />

      {/* Hero */}
      <section className="relative flex flex-1 items-center justify-center px-6 pb-24 text-center">
        {/* Orbital sigil — sits behind the title */}
        <div className="absolute inset-0 z-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <InvokerOrbs />
        </div>

        {/* Foreground content */}
        <div className="relative z-20 flex flex-col items-center">
          <div className="max-w-3xl animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <p className="mb-5 text-[10px] uppercase tracking-[0.5em] text-white/45 sm:text-xs">
              Forged from chaos · Reagents combined
            </p>
            <h1
              className="font-display text-4xl font-black uppercase tracking-[0.04em] text-[#f5ede0] sm:text-6xl md:text-7xl"
              style={{
                textShadow:
                  '0 2px 0 rgba(0,0,0,0.5), 0 0 24px rgba(255, 120, 50, 0.35), 0 0 60px rgba(180, 30, 20, 0.4)',
              }}
            >
              <span className="block">Invoke your</span>
              <span className="block">Greatest plays</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
              Find every clip where pro streamers crossed paths with you in Dota 2. Three reagents,
              countless combinations — one archive of your story on the battlefield.
            </p>
          </div>

          <div
            className="mt-12 flex flex-col items-center gap-4 animate-fade-up sm:flex-row sm:gap-6"
            style={{ animationDelay: '0.9s' }}
          >
            <Link
              href="/search"
              className="group relative inline-flex items-center justify-center overflow-hidden border border-white/30 bg-black/40 px-10 py-4 font-display text-sm tracking-[0.4em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
            >
              <span className="relative z-10">EXPLORE</span>
            </Link>
            <Link
              href="/streamers"
              className="text-xs uppercase tracking-[0.35em] text-white/50 transition-colors hover:text-white/90"
            >
              Browse streamers →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer hint */}
      <footer className="relative z-30 px-6 pb-6 text-center text-[10px] uppercase tracking-[0.4em] text-white/25 sm:px-10">
        Three reagents · Ten invocations · One archive
      </footer>
    </main>
  )
}
