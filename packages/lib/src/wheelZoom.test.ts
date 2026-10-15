import { describe, expect, test } from 'vitest'

import {
  NOTCH_ZOOM,
  WheelZoomSmoother,
  normalizeWheelDelta,
} from './wheelZoom.ts'

interface WheelEv {
  t: number
  deltaY: number
  deltaMode?: number
}

// replays useWheelScroll's loop: events land between frames, and a frame runs
// every frameMs while the smoother has zoom left to apply
function simulate(events: WheelEv[], frameMs: number, isPinch = true) {
  const smoother = new WheelZoomSmoother()
  const factors: number[] = []
  let i = 0
  let running = false
  const end = events.at(-1)!.t + 2000
  for (let t = 0; t <= end; t += frameMs) {
    while (i < events.length && events[i]!.t <= t) {
      const e = events[i]!
      smoother.add(e.deltaY, e.deltaMode ?? 0, isPinch)
      i++
      running = true
    }
    if (running) {
      factors.push(smoother.step(frameMs))
      running = !smoother.idle
    }
  }
  const total = factors.reduce((a, b) => a * b, 1)
  const maxStep = Math.max(...factors.map(f => Math.max(f, 1 / f)))
  return { factors, total, maxStep }
}

const notches = (times: number[], deltaY: number, deltaMode = 0) =>
  times.map(t => ({ t, deltaY, deltaMode }))

// a trackpad pinch: events every 8ms, velocity rising and falling
function pinch(durationMs: number, peakPx: number) {
  const events: WheelEv[] = []
  for (let t = 0; t < durationMs; t += 8) {
    events.push({ t, deltaY: -peakPx * Math.sin((Math.PI * t) / durationMs) })
  }
  return events
}

const sumDelta = (events: WheelEv[]) => events.reduce((a, e) => a + e.deltaY, 0)

describe('normalizeWheelDelta', () => {
  test('pixel mode passes through', () => {
    expect(normalizeWheelDelta(120, 0)).toBe(120)
  })
  test('line mode scales to pixels', () => {
    expect(normalizeWheelDelta(3, 1)).toBe(48)
  })
  test('page mode scales to pixels', () => {
    expect(normalizeWheelDelta(2, 2)).toBe(200)
  })
})

describe.each([16.67, 50])('at a %sms frame', frameMs => {
  test('a mouse notch zooms 1.25x, eased over several frames', () => {
    const { factors, total, maxStep } = simulate(notches([0], -100), frameMs)
    expect(total).toBeCloseTo(NOTCH_ZOOM, 6)
    expect(factors.length).toBeGreaterThan(3)
    expect(maxStep).toBeLessThan(frameMs > 20 ? 1.15 : 1.06)
  })

  test('every notch zooms the same, idle or not', () => {
    const spaced = simulate(notches([0, 250, 500, 750, 1000], -100), frameMs)
    const flick = simulate(notches([0, 40, 80, 120, 160], -100), frameMs)
    expect(spaced.total).toBeCloseTo(NOTCH_ZOOM ** 5, 4)
    expect(flick.total).toBeCloseTo(NOTCH_ZOOM ** 5, 4)
  })

  test('a Firefox line-mode notch zooms like a Chrome pixel notch', () => {
    const { total } = simulate(notches([0], -3, 1), frameMs)
    expect(total).toBeCloseTo(NOTCH_ZOOM, 6)
  })

  test('zooming out undoes zooming in', () => {
    const { total } = simulate(
      [...notches([0, 40, 80], -100), ...notches([600, 640, 680], 100)],
      frameMs,
    )
    expect(total).toBeCloseTo(1, 6)
  })

  test('a fast spin zooms far less than its notch count', () => {
    const times = Array.from({ length: 20 }, (_, i) => i * 5)
    const { total } = simulate(notches(times, -100), frameMs)
    expect(total).toBeLessThan(NOTCH_ZOOM ** 10)
  })

  // a 400ms pinch peaking at 2px doubles the zoom, at 6px about 7x
  test.each([2, 6])('a pinch peaking at %spx follows the fingers', peak => {
    const events = pinch(400, peak)
    const { total, maxStep } = simulate(events, frameMs)
    expect(Math.log(total)).toBeCloseTo(-sumDelta(events) / 100, 6)
    expect(maxStep).toBeLessThan(frameMs > 20 ? 1.6 : 1.25)
  })
})

test('a plain-scroll trackpad swipe zooms less per pixel than a pinch', () => {
  const events = pinch(400, 6)
  const scroll = simulate(events, 16.67, false)
  const pinched = simulate(events, 16.67, true)
  expect(scroll.total).toBeLessThan(pinched.total)
  expect(scroll.total).toBeGreaterThan(1)
})
