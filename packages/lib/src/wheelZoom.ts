// Chrome and Firefox encode a trackpad pinch as ctrl+wheel with
// deltaY = -100 * ln(scale), so dividing by 100 tracks the fingers 1:1
const PINCH_PX_PER_LOG = 100

// a plain scroll covers more pixels than a pinch for the same intent
const SCROLL_PX_PER_LOG = 400

// a pixel delta at least this large counts as a wheel notch
const NOTCH_MIN_PX = 40

export const NOTCH_ZOOM = 1.25

// the time constant a notch eases in over
const NOTCH_TAU_MS = 60

// a burst of continuous events coalesced into one frame applies at most 2x
const MAX_FRAME_LOG = Math.log(2)

// the queue holds at most four notches, which caps a fast spin
const MAX_PENDING_LOG = 4 * Math.log(NOTCH_ZOOM)

export function normalizeWheelDelta(delta: number, mode: number) {
  if (mode === 1) {
    return delta * 16
  }
  if (mode === 2) {
    return delta * 100
  }
  return delta
}

const clampAbs = (x: number, max: number) => Math.max(-max, Math.min(max, x))

// Positive log zooms in. Feed every wheel event to add() and call step() once
// per animation frame with the time since the last frame; step() returns the
// multiplier for colWidth/rowHeight.
export class WheelZoomSmoother {
  private continuous = 0
  private pending = 0

  add(deltaY: number, deltaMode: number, isPinch: boolean) {
    const px = normalizeWheelDelta(deltaY, deltaMode)
    if (deltaMode !== 0 || Math.abs(px) >= NOTCH_MIN_PX) {
      const notches =
        deltaMode !== 0 ? 1 : Math.min(Math.max(Math.abs(px) / 100, 1), 3)
      this.pending = clampAbs(
        this.pending - Math.sign(px) * notches * Math.log(NOTCH_ZOOM),
        MAX_PENDING_LOG,
      )
    } else {
      this.continuous -= px / (isPinch ? PINCH_PX_PER_LOG : SCROLL_PX_PER_LOG)
    }
  }

  get idle() {
    return this.continuous === 0 && this.pending === 0
  }

  step(elapsedMs: number) {
    let eased = this.pending * (1 - Math.exp(-elapsedMs / NOTCH_TAU_MS))
    if (Math.abs(this.pending - eased) < 0.005) {
      eased = this.pending
    }
    this.pending -= eased
    const log = clampAbs(this.continuous + eased, MAX_FRAME_LOG)
    this.continuous = 0
    return Math.exp(log)
  }
}
