'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (token) localStorage.setItem('auth_token', token)

    if (error) {
      router.replace(`/login?error=${error}`)
    } else {
      router.replace('/')
    }
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border border-white/40 border-t-transparent" />
        <p className="font-display text-[10px] uppercase tracking-[0.4em] text-white/35">
          Authenticating
        </p>
      </div>
    </div>
  )
}
