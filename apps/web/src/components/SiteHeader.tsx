import Link from 'next/link'
import { AuthButton } from './AuthButton'

export function SiteHeader() {
  return (
    <header className="relative z-30 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
      <Link href="/" className="group flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-md border border-white/15 bg-white/5 backdrop-blur-sm font-display text-sm font-bold text-white/90 transition-colors group-hover:border-white/40">
          D
        </span>
        <span className="font-display text-sm tracking-[0.4em] text-white/85">
          DOTA REPLAY HUB
        </span>
      </Link>

      <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.3em] text-white/60 sm:flex">
        <Link href="/search" className="transition-colors hover:text-white">
          Search
        </Link>
        <Link href="/streamers" className="transition-colors hover:text-white">
          Streamers
        </Link>
        <AuthButton />
      </nav>
    </header>
  )
}
