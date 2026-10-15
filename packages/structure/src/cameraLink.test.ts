import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { cameraLink } from './cameraLink.ts'

import type { CameraView, LinkedCamera } from './cameraLink.ts'

function viewAt(x: number): CameraView {
  return { position: [x, 0, 0], target: [0, 0, 0], up: [0, 1, 0], radius: 10 }
}

// a camera that emits a change whenever it is set, as Mol*'s does
function fakeCamera(x = 0) {
  let view = viewAt(x)
  const listeners = new Set<() => void>()
  const camera = {
    getSnapshot: () => view,
    setState: (next: CameraView) => {
      view = next
      for (const fn of listeners) {
        fn()
      }
    },
    stateChanged: {
      subscribe: (fn: () => void) => {
        listeners.add(fn)
        return { unsubscribe: () => listeners.delete(fn) }
      },
    },
    turn: (to: number) => {
      camera.setState(viewAt(to))
    },
    x: () => view.position[0],
  }
  return camera satisfies LinkedCamera
}

describe('cameraLink', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('turning one camera turns the rest, and the echoes stop', () => {
    const link = cameraLink()
    const a = fakeCamera()
    const b = fakeCamera()
    link.register('A', a)
    link.register('B', b)
    a.turn(5)
    expect(b.x()).toBe(5)
  })

  test('passes on the last of a burst of changes', () => {
    const link = cameraLink({ throttleMs: 60 })
    const a = fakeCamera()
    const b = fakeCamera()
    link.register('A', a)
    link.register('B', b)
    a.turn(1)
    a.turn(2)
    a.turn(3)
    expect(b.x()).toBe(1)
    vi.advanceTimersByTime(60)
    expect(b.x()).toBe(3)
  })

  test('a facet added in front leaves the others tied', () => {
    const link = cameraLink({ throttleMs: 0 })
    const a = fakeCamera()
    const b = fakeCamera()
    link.register('A', a)
    link.register('B', b)
    const c = fakeCamera()
    link.register('C', c)
    a.turn(7)
    expect([b.x(), c.x()]).toEqual([7, 7])
  })

  test('an unregistered camera no longer follows', () => {
    const link = cameraLink({ throttleMs: 0 })
    const a = fakeCamera()
    const b = fakeCamera()
    link.register('A', a)
    link.register('B', b)
    link.register('B', undefined)
    a.turn(4)
    expect(b.x()).toBe(0)
  })
})
