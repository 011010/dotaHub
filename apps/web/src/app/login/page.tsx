'use client'

import { useSearchParams } from 'next/navigation'
import { SiteHeader } from '@/components/SiteHeader'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const STEAM_SVG = (
  <svg viewBox="0 0 233 233" className="h-5 w-5" fill="currentColor" aria-hidden>
    <path d="M116.5 0C52.2 0 0 52.2 0 116.5c0 56.4 40.2 103.5 93.7 114l34.7-43.6c-2.5.2-5 .3-7.6.3-37.4 0-67.7-30.3-67.7-67.7S83.4 51.8 120.8 51.8s67.7 30.3 67.7 67.7c0 29.8-19.3 55.2-46.1 64.4l-38.3 48.1c4.2.5 8.4.7 12.7.7C181 232.7 233 180.5 233 116.2 233 51.9 180.8 0 116.5 0zm-21.8 157.2-17.4-7.2a28.2 28.2 0 0 0 52.6-14.3 28.2 28.2 0 0 0-46.2-21.6l18 7.4c10.4 4.3 15.4 16.3 11.1 26.7-4.3 10.4-16.3 15.3-26.7 11l8.6-2z" />
  </svg>
)

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Steam authentication failed. Please try again.',
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error        = searchParams.get('error')
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.') : null

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0a0d1a 0%, #060408 40%, #030203 100%)',
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        <div className="flex flex-1 items-center justify-center px-6 pb-24">
          <div className="w-full max-w-sm">

            {/* Heading */}
            <div className="mb-10 text-center">
              <p className="mb-2 text-[10px] uppercase tracking-[0.5em] text-white/35">
                Authentication
              </p>
              <h1
                className="font-display text-3xl font-black uppercase tracking-[0.04em] text-[#f5ede0]"
                style={{ textShadow: '0 0 40px rgba(80, 120, 255, 0.2)' }}
              >
                Sign In
              </h1>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="mb-6 border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400 text-center">
                {errorMessage}
              </div>
            )}

            {/* Steam button */}
            <a
              href={`${API_BASE}/auth/steam`}
              className="group flex w-full items-center justify-center gap-3 border border-white/15 bg-white/[0.04] px-8 py-4 backdrop-blur-sm transition-all hover:border-white/35 hover:bg-white/[0.08]"
            >
              <span className="text-[#4c9be8] transition-colors group-hover:text-[#71b8ff]">
                {STEAM_SVG}
              </span>
              <span className="font-display text-sm uppercase tracking-[0.35em] text-white/80 group-hover:text-white">
                Continue with Steam
              </span>
            </a>

            {/* Explainer */}
            <p className="mt-5 text-center text-[11px] leading-relaxed text-white/30">
              We only read your Steam public profile to display your name.
              No password is stored — authentication is handled entirely by Steam.
            </p>

            {/* Divider */}
            <div className="mt-10 border-t border-white/[0.06]" />

            <p className="mt-6 text-center text-[10px] text-white/20">
              By signing in you agree to our{' '}
              <span className="underline underline-offset-2 cursor-pointer hover:text-white/40 transition-colors">
                Terms of Service
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
