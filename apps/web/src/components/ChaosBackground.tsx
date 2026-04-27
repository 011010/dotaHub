type Ember = {
  left: string
  size: number
  duration: string
  delay: string
  hue: string
}

const EMBER_HUES = ['#ff7a1a', '#ffb056', '#ff4d2e', '#ffd28a']

function buildEmbers(count: number): Ember[] {
  const embers: Ember[] = []
  for (let i = 0; i < count; i++) {
    const seed = (i * 9301 + 49297) % 233280
    const r = seed / 233280
    embers.push({
      left: `${(r * 100).toFixed(2)}%`,
      size: 1 + Math.round(r * 2),
      duration: `${(10 + r * 14).toFixed(2)}s`,
      delay: `${(r * 16).toFixed(2)}s`,
      hue: EMBER_HUES[i % EMBER_HUES.length],
    })
  }
  return embers
}

const EMBERS = buildEmbers(30)

// ─── Energy columns ───────────────────────────────────────────────────────────
type EnergyCol = {
  left: string
  width: number
  height: string
  blur: number
  opacity: number
  drift: 'a' | 'b'
  delay: string
  colors: [string, string, string]
}

const ENERGY_COLUMNS: EnergyCol[] = [
  { left: '-4%', width: 70,  height: '75%', blur: 28, opacity: 0.35, drift: 'a', delay: '0s',   colors: ['rgba(255,70,20,0)', 'rgba(255,70,20,0.42)', 'rgba(255,70,20,0)'] },
  { left: '92%', width: 90,  height: '80%', blur: 32, opacity: 0.33, drift: 'b', delay: '1.5s', colors: ['rgba(220,40,15,0)', 'rgba(220,40,15,0.39)', 'rgba(220,40,15,0)'] },
  { left: '-2%', width: 45,  height: '55%', blur: 22, opacity: 0.25, drift: 'b', delay: '3.1s', colors: ['rgba(180,30,160,0)', 'rgba(180,30,160,0.33)','rgba(180,30,160,0)'] },
  { left: '96%', width: 55,  height: '60%', blur: 26, opacity: 0.23, drift: 'a', delay: '4.4s', colors: ['rgba(255,100,40,0)', 'rgba(255,100,40,0.36)','rgba(255,100,40,0)'] },
]

function EnergyColumn({ col }: { col: EnergyCol }) {
  return (
    <div
      className="absolute bottom-0 mix-blend-screen"
      style={{
        left: col.left,
        width: `${col.width}px`,
        height: col.height,
        background: `linear-gradient(180deg, ${col.colors[0]} 0%, ${col.colors[1]} 45%, ${col.colors[1]} 70%, ${col.colors[2]} 100%)`,
        filter: `blur(${col.blur}px)`,
        opacity: col.opacity,
        animation: `chaos-drift-${col.drift} 14s ease-in-out infinite`,
        animationDelay: col.delay,
      }}
    />
  )
}

// ─── Plasma / fire explosions ─────────────────────────────────────────────────
type Plasma = {
  left: string
  top: string
  size: number
  duration: string
  delay: string
  hue: 'amber' | 'crimson'
}

const PLASMA_BURSTS: Plasma[] = [
  { left: '12%', top: '28%', size: 180, duration: '9s',  delay: '0s',   hue: 'amber'   },
  { left: '78%', top: '20%', size: 220, duration: '11s', delay: '2.1s', hue: 'crimson' },
  { left: '22%', top: '70%', size: 200, duration: '10s', delay: '5.4s', hue: 'amber'   },
  { left: '85%', top: '62%', size: 160, duration: '8s',  delay: '3.3s', hue: 'crimson' },
  { left: '50%', top: '85%', size: 240, duration: '12s', delay: '6.8s', hue: 'amber'   },
  { left: '60%', top: '12%', size: 140, duration: '9s',  delay: '4.5s', hue: 'crimson' },
]

const PLASMA_GRADIENTS: Record<Plasma['hue'], string> = {
  amber:
    'radial-gradient(circle, rgba(255,220,120,0.62) 0%, rgba(255,120,40,0.36) 28%, rgba(180,40,20,0.16) 55%, transparent 75%)',
  crimson:
    'radial-gradient(circle, rgba(255,180,130,0.55) 0%, rgba(220,40,30,0.36) 30%, rgba(110,20,30,0.2) 60%, transparent 80%)',
}

function PlasmaBurst({ plasma }: { plasma: Plasma }) {
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left: plasma.left,
        top: plasma.top,
        width: `${plasma.size}px`,
        height: `${plasma.size}px`,
        background: PLASMA_GRADIENTS[plasma.hue],
        mixBlendMode: 'screen',
        filter: 'blur(6px)',
        animation: `plasma-burst ${plasma.duration} ease-out infinite`,
        animationDelay: plasma.delay,
      }}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ChaosBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base void */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, #1a0a06 0%, #0a0509 45%, #050307 80%, #020103 100%)',
        }}
      />

      {/* Energy columns — vertical fire wisps at edges */}
      {ENERGY_COLUMNS.map((col, i) => (
        <EnergyColumn key={i} col={col} />
      ))}

      {/* Drifting chaos plumes — reduced to 65% of original opacity */}
      <div
        className="absolute -inset-[20%] animate-chaos-drift-a mix-blend-screen blur-3xl"
        style={{ opacity: 0.45, background: 'radial-gradient(circle at 30% 60%, rgba(255,80,30,0.55), transparent 55%)' }}
      />
      <div
        className="absolute -inset-[20%] animate-chaos-drift-b mix-blend-screen blur-3xl"
        style={{ opacity: 0.38, background: 'radial-gradient(circle at 70% 40%, rgba(220,40,20,0.45), transparent 50%)' }}
      />
      <div
        className="absolute -inset-[25%] animate-chaos-drift-a mix-blend-screen blur-2xl"
        style={{ opacity: 0.26, animationDuration: '28s', background: 'radial-gradient(circle at 80% 80%, rgba(120,30,200,0.35), transparent 55%)' }}
      />

      {/* Plasma explosions */}
      {PLASMA_BURSTS.map((p, i) => (
        <PlasmaBurst key={i} plasma={p} />
      ))}

      {/* Floating embers */}
      <div className="absolute inset-0">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="absolute bottom-[-10px] rounded-full animate-ember-rise"
            style={{
              left: e.left,
              width: `${e.size}px`,
              height: `${e.size}px`,
              backgroundColor: e.hue,
              boxShadow: `0 0 ${e.size * 3}px ${e.hue}`,
              animationDuration: e.duration,
              animationDelay: e.delay,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.95) 100%)' }}
      />

      {/* Film grain */}
      <div className="absolute inset-0 bg-grain opacity-[0.14] mix-blend-overlay" />
    </div>
  )
}
