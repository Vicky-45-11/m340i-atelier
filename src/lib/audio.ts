// Optional ambience, synthesised with Web Audio so no audio files are
// shipped or licensed. Nothing plays until the visitor turns sound on.

type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let running = false

function noiseBuffer(c: Ctx) {
  // brown noise: a low, mechanical rumble rather than hiss
  const len = c.sampleRate * 2
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    d[i] = last * 3.5
  }
  return buf
}

function build() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return false
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  noise = noiseBuffer(ctx)

  // low drone: two detuned oscillators through a slowly breathing low-pass
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 180
  filter.Q.value = 4
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.frequency.value = 0.08
  lfoGain.gain.value = 70
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()
  for (const [f, g] of [[55, 0.05], [82.4, 0.03], [110.3, 0.012]] as const) {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f
    const gain = ctx.createGain()
    gain.gain.value = g
    o.connect(gain).connect(filter)
    o.start()
  }
  filter.connect(master)

  const hum = ctx.createBufferSource()
  hum.buffer = noise
  hum.loop = true
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 120
  const humGain = ctx.createGain()
  humGain.gain.value = 0.25
  hum.connect(band).connect(humGain).connect(master)
  hum.start()
  return true
}

export async function setSound(on: boolean) {
  if (on) {
    if (!ctx && !build()) return false
    await ctx!.resume()
    master!.gain.cancelScheduledValues(ctx!.currentTime)
    master!.gain.setTargetAtTime(0.5, ctx!.currentTime, 0.6)
    running = true
    return true
  }
  if (ctx && master) {
    running = false
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.2)
    setTimeout(() => {
      if (!running) void ctx?.suspend()
    }, 900)
  }
  return false
}

/** Short filtered air sweep for scene changes */
export function whoosh() {
  if (!running || !ctx || !master || !noise) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noise
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 1.4
  f.frequency.setValueAtTime(300, t)
  f.frequency.exponentialRampToValueAtTime(2400, t + 0.5)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.35, t + 0.12)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
  src.connect(f).connect(g).connect(master)
  src.start(t)
  src.stop(t + 0.75)
}

/** A restrained, engine-inspired rise and fall. It is a synthesised tone, not a recording of a BMW engine */
export function rev() {
  if (!running || !ctx || !master) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(48, t)
  o.frequency.exponentialRampToValueAtTime(150, t + 0.55)
  o.frequency.exponentialRampToValueAtTime(52, t + 1.6)
  const shaper = ctx.createWaveShaper()
  const curve = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const x = (i / 128 - 1) * 2.5
    curve[i] = Math.tanh(x)
  }
  shaper.curve = curve
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 700
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.12, t + 0.15)
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.8)
  o.connect(shaper).connect(f).connect(g).connect(master)
  o.start(t)
  o.stop(t + 1.9)
}
