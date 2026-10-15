import { useEffect, useRef } from 'react'

import { observer } from 'mobx-react'

import { StructurePanel } from './StructurePanel.tsx'

import type { Facet } from './facets.ts'
import type { StructureColor } from './paint.ts'
import type { Camera } from 'molstar/lib/mol-canvas3d/camera'
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context'
import type { MsaViewModel } from 'react-msaview'

export interface FacetGridProps {
  model: MsaViewModel
  facets: Facet[]
  /**
   * column-major 4x4 by structure id, from a superposition, so every facet
   * shares one frame
   */
  transforms?: Record<string, number[]>
  columns?: number
  /** height of one cell, in pixels */
  cellHeight?: number
  colorBy?: StructureColor
  highlights?: boolean
}

function sameView(a: Camera.Snapshot, b: Camera.Snapshot) {
  const near = (x: ArrayLike<number>, y: ArrayLike<number>) =>
    [0, 1, 2].every(i => Math.abs((x[i] ?? 0) - (y[i] ?? 0)) < 1e-3)
  return (
    near(a.position, b.position) &&
    near(a.target, b.target) &&
    near(a.up, b.up) &&
    Math.abs(a.radius - b.radius) < 1e-3
  )
}

/**
 * Small multiples of structures: one Mol* view per facet, each facet's
 * structures in its own color and all in one frame, with the cameras tied so
 * turning one turns every facet. Each cell is a separate WebGL context, so a
 * grid suits a handful of facets, not dozens.
 */
export const FacetGrid = observer(function FacetGrid({
  model,
  facets,
  transforms,
  columns = 3,
  cellHeight = 260,
  colorBy = 'none',
  highlights = true,
}: FacetGridProps) {
  const plugins = useRef(new Map<number, PluginUIContext>())
  const subscriptions = useRef(new Map<number, () => void>())
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // setting one camera emits a change on it, which would set the others and
  // come back, so a change is passed on once and echoes are dropped
  const passing = useRef(false)
  const lastPassed = useRef(0)

  function follow(source: number) {
    const from = plugins.current.get(source)?.canvas3d
    if (!from || passing.current || Date.now() - lastPassed.current < 60) {
      return
    }
    const view = from.camera.getSnapshot()
    passing.current = true
    try {
      for (const [index, plugin] of plugins.current) {
        const camera = plugin.canvas3d?.camera
        if (index !== source && camera) {
          const current = camera.getSnapshot()
          if (!sameView(current, view)) {
            camera.setState(view, 0)
          }
        }
      }
    } finally {
      passing.current = false
      lastPassed.current = Date.now()
    }
  }

  function register(index: number, plugin: PluginUIContext | undefined) {
    subscriptions.current.get(index)?.()
    subscriptions.current.delete(index)
    if (!plugin) {
      plugins.current.delete(index)
      return
    }
    plugins.current.set(index, plugin)
    const camera = plugin.canvas3d?.camera
    if (camera) {
      const subscription = camera.stateChanged.subscribe(() => {
        follow(index)
      })
      subscriptions.current.set(index, () => {
        subscription.unsubscribe()
      })
    }
    // the cells finish loading and framing at different times, so the first
    // facet's frame is applied to the rest once the last one has registered
    clearTimeout(settle.current)
    if (plugins.current.size === facets.length) {
      settle.current = setTimeout(() => {
        follow(Math.min(...plugins.current.keys()))
      }, 1500)
    }
  }

  useEffect(
    () => () => {
      clearTimeout(settle.current)
      for (const unsubscribe of subscriptions.current.values()) {
        unsubscribe()
      }
    },
    [],
  )

  return (
    <div
      data-testid="facet-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(columns, facets.length)}, minmax(0, 1fr))`,
        gap: 12,
      }}
    >
      {facets.map((facet, index) => (
        <div
          key={facet.label}
          style={{ borderTop: `3px solid ${facet.color}`, paddingTop: 4 }}
        >
          <StructurePanel
            model={model}
            structureIds={facet.structureIds}
            transforms={transforms}
            solidColor={colorBy === 'none' ? facet.color : undefined}
            colorBy={colorBy}
            highlights={highlights}
            caption={`${facet.label} (${facet.rows.length})`}
            compact
            height={cellHeight}
            onPlugin={plugin => {
              register(index, plugin)
            }}
          />
        </div>
      ))}
    </div>
  )
})
