'use client'

import { useEffect, useState } from 'react'

const ELEMENTS = ['quas', 'wex', 'exort'] as const
type Element = (typeof ELEMENTS)[number]

const INVOCATION_INTERVAL_MS = 13_500
const INVOCATION_DURATION_MS = 900

type OrbConfig = {
  rx: number
  ry: number
  tiltDeg: number
  durationS: number
  reverse: boolean
  phasePercent: number
  initial: Element
  cycleMs: number
  cycleDelayMs: number
  pulseDelay: string
}

const ORBS: OrbConfig[] = [
  { rx: 300, ry: 78,  tiltDeg: -14, durationS: 17, reverse: false, phasePercent: 0,    initial: 'quas',  cycleMs: 2400, cycleDelayMs: 0,    pulseDelay: '0s'   },
  { rx: 270, ry: 130, tiltDeg: 24,  durationS: 25, reverse: false, phasePercent: 33,   initial: 'wex',   cycleMs: 2800, cycleDelayMs: 800,  pulseDelay: '0.8s' },
  { rx: 340, ry: 60,  tiltDeg: -38, durationS: 13, reverse: false, phasePercent: 66,   initial: 'exort', cycleMs: 2200, cycleDelayMs: 1500, pulseDelay: '1.6s' },
]

function nextElement(current: Element): Element {
  const i = ELEMENTS.indexOf(current)
  return ELEMENTS[(i + 1) % ELEMENTS.length]
}

type Particle = {
  left: string
  top: string
  size: number
  delay: string
  duration: string
  tx: string
  ty: string
}

const QUAS_PARTICLES: Particle[] = [
  { left: '20%', top: '12%', size: 2, delay: '0s',   duration: '1.7s', tx: '4px',  ty: '40px' },
  { left: '50%', top: '8%',  size: 2, delay: '0.4s', duration: '1.9s', tx: '-3px', ty: '46px' },
  { left: '78%', top: '15%', size: 2, delay: '0.8s', duration: '1.5s', tx: '5px',  ty: '38px' },
  { left: '35%', top: '4%',  size: 1, delay: '0.2s', duration: '2.1s', tx: '-2px', ty: '50px' },
  { left: '64%', top: '6%',  size: 2, delay: '0.6s', duration: '1.7s', tx: '4px',  ty: '44px' },
  { left: '15%', top: '20%', size: 1, delay: '1.0s', duration: '1.6s', tx: '-1px', ty: '36px' },
]

const WEX_PARTICLES: Particle[] = [
  { left: '50%', top: '50%', size: 2, delay: '0s',   duration: '0.7s', tx: '-26px', ty: '-14px' },
  { left: '50%', top: '50%', size: 2, delay: '0.3s', duration: '0.8s', tx: '24px',  ty: '-16px' },
  { left: '50%', top: '50%', size: 2, delay: '0.5s', duration: '0.6s', tx: '-6px',  ty: '-28px' },
  { left: '50%', top: '50%', size: 2, delay: '0.7s', duration: '0.7s', tx: '-22px', ty: '20px'  },
  { left: '50%', top: '50%', size: 2, delay: '1.0s', duration: '0.8s', tx: '26px',  ty: '18px'  },
  { left: '50%', top: '50%', size: 1, delay: '1.3s', duration: '0.6s', tx: '4px',   ty: '28px'  },
]

const EXORT_PARTICLES: Particle[] = [
  { left: '25%', top: '78%', size: 2, delay: '0s',   duration: '1.5s', tx: '-3px', ty: '-44px' },
  { left: '54%', top: '85%', size: 2, delay: '0.4s', duration: '1.7s', tx: '4px',  ty: '-50px' },
  { left: '76%', top: '74%', size: 2, delay: '0.8s', duration: '1.4s', tx: '-2px', ty: '-42px' },
  { left: '40%', top: '90%', size: 1, delay: '0.2s', duration: '1.9s', tx: '5px',  ty: '-52px' },
  { left: '64%', top: '88%', size: 2, delay: '0.6s', duration: '1.6s', tx: '-4px', ty: '-46px' },
  { left: '15%', top: '82%', size: 1, delay: '1.0s', duration: '1.5s', tx: '2px',  ty: '-40px' },
]

function ParticleLayer({
  particles,
  active,
  color,
  glow,
  animation,
}: {
  particles: Particle[]
  active: boolean
  color: string
  glow: string
  animation: string
}) {
  return (
    <div
      className={`pointer-events-none absolute -inset-8 transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={
            {
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: color,
              boxShadow: `0 0 ${p.size * 4}px ${glow}`,
              animation: `${animation} ${p.duration} ease-out infinite`,
              animationDelay: p.delay,
              ['--tx' as string]: p.tx,
              ['--ty' as string]: p.ty,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

const WEX_ARCS = [
  { rot: 18,   delay: '0s'   },
  { rot: 70,   delay: '0.5s' },
  { rot: -42,  delay: '1.05s' },
  { rot: 130,  delay: '0.8s' },
]

function WexArcs({ active }: { active: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
        active ? 'opacity-90' : 'opacity-0'
      }`}
    >
      {WEX_ARCS.map((a, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 block h-px w-12"
          style={{
            transform: `translate(-50%, -50%) rotate(${a.rot}deg)`,
            transformOrigin: 'center',
            backgroundImage:
              'linear-gradient(90deg, transparent 0%, rgba(240,212,255,0.9) 30%, #ffffff 50%, rgba(240,212,255,0.9) 70%, transparent 100%)',
            boxShadow: '0 0 6px #b066ff, 0 0 14px rgba(176, 102, 255, 0.7)',
            animation: 'orb-arc-flicker 1.6s linear infinite',
            animationDelay: a.delay,
          }}
        />
      ))}
    </div>
  )
}

function ExortFlame({ active }: { active: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute -inset-2 transition-opacity duration-500 ${
        active ? 'opacity-80' : 'opacity-0'
      }`}
      style={{
        background:
          'radial-gradient(circle, rgba(255,160,60,0.55), rgba(220,60,20,0.22) 60%, transparent 80%)',
        filter: 'blur(3px)',
        animation: 'orb-flame-morph 2.4s ease-in-out infinite',
      }}
    />
  )
}

function Orb({
  config,
  invocationActive,
}: {
  config: OrbConfig
  invocationActive: boolean
}) {
  const [element, setElement] = useState<Element>(config.initial)
  const [flash, setFlash] = useState(false)
  const [replaceKey, setReplaceKey] = useState(0)

  // Cycle through elements
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setElement((prev) => nextElement(prev))
      }, config.cycleMs)
    }, config.cycleDelayMs)
    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [config.cycleMs, config.cycleDelayMs])

  // Trigger flash + collapse on element change
  useEffect(() => {
    setFlash(true)
    setReplaceKey((k) => k + 1)
    const t = setTimeout(() => setFlash(false), 380)
    return () => clearTimeout(t)
  }, [element])

  return (
    <div
      className="absolute inset-0"
      style={{ transform: `rotate(${config.tiltDeg}deg)` }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          offsetPath: `ellipse(${config.rx}px ${config.ry}px at 50% 50%)`,
          offsetDistance: '0%',
          offsetRotate: '0deg',
          animation: `orbit-path ${config.durationS}s linear infinite${
            config.reverse ? ' reverse' : ''
          }`,
          animationDelay: `-${(config.phasePercent / 100) * config.durationS}s`,
        }}
      >
        {/* Centering wrapper (transform: translate) */}
        <div className="-translate-x-1/2 -translate-y-1/2">
          {/* Replace-collapse wrapper — remounts on element change to retrigger animation */}
          <div
            key={replaceKey}
            style={{ animation: 'orb-replace 0.5s ease-out' }}
          >
            {/* Plasma orb — blob morph + pulse blur give non-spherical plasma look */}
            <div
              className={`relative transition-[box-shadow,background] duration-700 orb-${element} h-9 w-9 sm:h-11 sm:w-11`}
              style={{
                animation: `orb-pulse 3.2s ease-in-out infinite, plasma-morph ${
                  element === 'wex' ? '1.9s' : element === 'exort' ? '2.6s' : '3.8s'
                } ease-in-out infinite`,
                animationDelay: `${config.pulseDelay}, 0s`,
              }}
            >
              {/* Particle layers (always rendered, opacity-controlled) */}
              <ParticleLayer
                particles={QUAS_PARTICLES}
                active={element === 'quas'}
                color="#cdeeff"
                glow="rgba(76,201,255,0.7)"
                animation="orb-frost-fall"
              />
              <ParticleLayer
                particles={WEX_PARTICLES}
                active={element === 'wex'}
                color="#f0d4ff"
                glow="rgba(176,102,255,0.85)"
                animation="orb-spark-burst"
              />
              <ParticleLayer
                particles={EXORT_PARTICLES}
                active={element === 'exort'}
                color="#ffd28a"
                glow="rgba(255,140,40,0.85)"
                animation="orb-ember-up"
              />

              {/* Element-specific decorations */}
              <WexArcs active={element === 'wex'} />
              <ExortFlame active={element === 'exort'} />

              {/* Specular highlight */}
              <span
                className="pointer-events-none absolute left-[18%] top-[14%] h-1/3 w-1/3 rounded-full opacity-80 blur-sm"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.85), transparent 70%)',
                }}
              />

              {/* Element-change white flash */}
              <span
                className={`pointer-events-none absolute -inset-2 rounded-full transition-opacity ${
                  flash ? 'opacity-90 duration-100' : 'opacity-0 duration-500'
                }`}
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 35%, rgba(255,255,255,0) 70%)',
                }}
              />

              {/* Synchronized invocation flash — bigger, brighter */}
              <span
                className={`pointer-events-none absolute -inset-6 rounded-full transition-opacity ${
                  invocationActive
                    ? 'opacity-100 duration-100'
                    : 'opacity-0 duration-500'
                }`}
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 28%, rgba(255,255,255,0) 70%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InvokerOrbs() {
  const [invocationKey, setInvocationKey] = useState(0)
  const [invocationActive, setInvocationActive] = useState(false)

  // Periodic synchronized "Invoke" pulse
  useEffect(() => {
    let cancel: ReturnType<typeof setTimeout> | undefined
    const interval = setInterval(() => {
      setInvocationKey((k) => k + 1)
      setInvocationActive(true)
      if (cancel) clearTimeout(cancel)
      cancel = setTimeout(() => setInvocationActive(false), INVOCATION_DURATION_MS)
    }, INVOCATION_INTERVAL_MS)
    return () => {
      clearInterval(interval)
      if (cancel) clearTimeout(cancel)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: '880px', height: '380px' }}
    >
      {/* Center halo — invocation point */}
      <div
        className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 200, 130, 0.45), rgba(180, 80, 40, 0.12) 45%, transparent 75%)',
        }}
      />

      {/* Invocation shockwave — remounts on each pulse to retrigger animation */}
      {invocationActive && (
        <div
          key={invocationKey}
          className="absolute left-1/2 top-1/2 h-32 w-32 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 230, 180, 0.55), rgba(255, 140, 80, 0.2) 50%, transparent 75%)',
            animation: 'orb-shockwave 0.9s ease-out forwards',
          }}
        />
      )}

      {ORBS.map((cfg, i) => (
        <Orb key={i} config={cfg} invocationActive={invocationActive} />
      ))}
    </div>
  )
}
