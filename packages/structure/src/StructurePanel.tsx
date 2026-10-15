import { useEffect, useRef, useState } from 'react'

import { compareStructural, reaction } from 'mobx'
import { observer } from 'mobx-react'
import { isBinaryStructureUrl, structureFormatFromContent } from 'p2s_mapper'

import {
  drawnStructure,
  loadMolstar,
  polymerResidues,
  residueLoci,
  tmAlignOnto,
  transformStructure,
} from './molstar.ts'
import {
  conservationColor,
  paintGroups,
  paintStructure,
  rowResidueOfChain,
  solidGroups,
} from './paint.ts'

import type { Molstar, TmAlignment } from './molstar.ts'
import type { StructureColor } from './paint.ts'
import type { Loci } from 'molstar/lib/mol-model/loci'
import type { Structure } from 'molstar/lib/mol-model/structure'
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context'
import type { MsaViewModel } from 'react-msaview'

export interface StructurePanelProps {
  model: MsaViewModel
  /** which mapped structure to show; the first one when unset */
  structureId?: string
  /** several mapped structures at once, such as a superposition's */
  structureIds?: string[]
  /** column-major 4x4 by structure id, moving that structure into place */
  transforms?: Record<string, number[]>
  /**
   * `tm-align` superposes the structures on the first by their traces alone and
   * reports each fit through `onTmAlign`, and `transforms` is ignored
   */
  fitBy?: 'transforms' | 'tm-align'
  /** the TM-align fit of each structure after the first, by structure id */
  onTmAlign?: (fits: Record<string, TmAlignment>) => void
  /** what to paint the structure with; several structures take one color each
   * unless this is set */
  colorBy?: StructureColor
  height?: number
}

// Okabe-Ito, which stays apart under the common forms of color blindness
export const structurePalette = [
  '#0072b2',
  '#d55e00',
  '#009e73',
  '#cc79a7',
  '#e69f00',
  '#56b4e9',
  '#f0e442',
]

const idle = 'Hover a residue in the alignment or the structure.'

function readLocation(molstar: Molstar, loci: Loci) {
  const loc = molstar.StructureElement.Loci.is(loci)
    ? molstar.StructureElement.Loci.getFirstLocation(loci)
    : undefined
  const SP = molstar.StructureProperties
  return loc
    ? {
        model: loc.unit.model,
        labelSeqId: SP.residue.label_seq_id(loc),
        labelAsymId: SP.chain.label_asym_id(loc),
        authAsymId: SP.chain.auth_asym_id(loc),
        compId: SP.atom.label_comp_id(loc),
        polymer: SP.entity.type(loc) === 'polymer',
      }
    : undefined
}

function centerOnResidue(model: MsaViewModel, row: string, seqPos: number) {
  const col = model.seqPosToVisibleCol(row, seqPos - 1)
  if (col !== undefined) {
    model.setScrollX(model.msaCanvasWidth / 2 - (col + 0.5) * model.colWidth)
  }
}

interface Loaded {
  id: string
  ref: string
  model: Structure['model']
}

/**
 * A Mol* view of structures that rows of the alignment map onto. The model
 * drives it: a hovered or clicked alignment cell lights or focuses the residue
 * it maps to, a hovered structure residue lights its cell, and `colorBy` paints
 * the structures from the alignment's columns. With `transforms`, each
 * structure is moved into the frame of a superposition.
 */
export const StructurePanel = observer(function StructurePanel({
  model,
  structureId,
  structureIds,
  transforms,
  fitBy = 'transforms',
  onTmAlign,
  colorBy = 'none',
  height = 400,
}: StructurePanelProps) {
  const mapped = model.mappedStructures
  const wanted = structureIds ?? (structureId ? [structureId] : [])
  const entries = (
    wanted.length > 0 ? wanted : mapped.slice(0, 1).map(m => m.structure.id)
  ).flatMap(id => {
    const structure = mapped.find(m => m.structure.id === id)?.structure
    return structure?.url ? [{ id, url: structure.url }] : []
  })
  const key = entries.map(e => `${e.id}\u0000${e.url}`).join('\u0001')

  const hostRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<PluginUIContext | undefined>(undefined)
  const molstarRef = useRef<Molstar | undefined>(undefined)
  const loadedRef = useRef<Loaded[]>([])
  const paintQueue = useRef(Promise.resolve())
  // the latest callback, so a new function each render does not refit
  const onTmAlignRef = useRef(onTmAlign)
  onTmAlignRef.current = onTmAlign
  // structures a transform has moved, so only those are moved back
  const movedRef = useRef(new Set<string>())
  const [state, setState] = useState('Loading structure')
  const [status, setStatus] = useState(idle)
  const ready = state === ''
  const transformKey = JSON.stringify(transforms ?? {})

  useEffect(() => {
    // `key` carries the entries, so the effect depends on the structures shown
    // and not on an array rebuilt every render
    const entries = key
      ? key.split('\u0001').map(part => {
          const [id = '', url = ''] = part.split('\u0000')
          return { id, url }
        })
      : []
    if (entries.length === 0) {
      return undefined
    }
    const life = {
      cancelled: false,
      plugin: undefined as PluginUIContext | undefined,
      unsubscribe: [] as (() => void)[],
    }
    const target = document.createElement('div')
    target.style.cssText = 'position:absolute;inset:0'
    hostRef.current?.append(target)
    setState('Loading structure')

    void (async () => {
      try {
        const molstar = await loadMolstar()
        if (life.cancelled) {
          return
        }
        const spec = molstar.DefaultPluginUISpec()
        const plugin = await molstar.createPluginUI({
          target,
          render: molstar.renderReact18,
          spec: {
            ...spec,
            layout: {
              initial: {
                isExpanded: false,
                showControls: false,
                controlsDisplay: 'reactive',
              },
            },
            config: [
              [molstar.PluginConfig.Viewport.ShowExpand, false],
              [molstar.PluginConfig.Viewport.ShowSelectionMode, false],
              [molstar.PluginConfig.Viewport.ShowAnimation, false],
            ],
          },
        })
        life.plugin = plugin
        if (life.cancelled) {
          plugin.dispose()
          return
        }
        const loaded: Loaded[] = []
        for (const { id, url } of entries) {
          // the file's own first lines say which parser it needs: mmCIF read
          // as PDB loads with no polymer and no error
          let trajectory
          if (isBinaryStructureUrl(url)) {
            const data = await plugin.builders.data.download(
              { url, isBinary: true },
              { state: { isGhost: true } },
            )
            trajectory = await plugin.builders.structure.parseTrajectory(
              data,
              'mmcif',
            )
          } else {
            const res = await fetch(url)
            if (!res.ok) {
              throw new Error(`${url}: HTTP ${res.status}`)
            }
            const text = await res.text()
            const data = await plugin.builders.data.rawData(
              { data: text, label: id },
              { state: { isGhost: true } },
            )
            trajectory = await plugin.builders.structure.parseTrajectory(
              data,
              structureFormatFromContent(text),
            )
          }
          const built = await plugin.builders.structure.hierarchy.applyPreset(
            trajectory,
            'default',
          )
          const root = built?.structure
          const data2 = root
            ? plugin.state.data.cells.get(root.ref)?.obj?.data
            : undefined
          if (root && data2) {
            loaded.push({ id, ref: root.ref, model: data2.model })
          }
          if (life.cancelled) {
            return
          }
        }
        if (loaded.length === 0) {
          throw new Error('the file holds no structure to show')
        }
        loadedRef.current = loaded
        molstarRef.current = molstar
        pluginRef.current = plugin

        const lookup = (
          where: NonNullable<ReturnType<typeof readLocation>>,
        ) => {
          const id = loaded.find(l => l.model === where.model)?.id
          if (id === undefined) {
            return undefined
          }
          return rowResidueOfChain(
            model,
            id,
            where.labelSeqId,
            where.labelAsymId,
            where.authAsymId,
          )
        }

        const hover = plugin.behaviors.interaction.hover.subscribe(
          ({ current }) => {
            const where = readLocation(molstar, current.loci)
            if (!where) {
              model.clearHighlight('structure')
              setStatus(idle)
              return
            }
            const id = loaded.find(l => l.model === where.model)?.id ?? ''
            const label = where.polymer
              ? `${id} chain ${where.authAsymId} residue ${where.labelSeqId} ${where.compId}`
              : `${id} ${where.compId}`
            const hit = where.polymer ? lookup(where) : undefined
            if (hit) {
              model.applyHighlight('structure', [
                { row: hit.rowName, start: hit.seqPos, end: hit.seqPos },
              ])
              setStatus(`${label} · ${hit.rowName} residue ${hit.seqPos}`)
            } else {
              model.clearHighlight('structure')
              setStatus(`${label} · no row maps here`)
            }
          },
        )
        const click = plugin.behaviors.interaction.click.subscribe(
          ({ current }) => {
            const where = readLocation(molstar, current.loci)
            const hit = where?.polymer ? lookup(where) : undefined
            if (hit) {
              centerOnResidue(model, hit.rowName, hit.seqPos)
            }
          },
        )
        life.unsubscribe.push(
          () => {
            hover.unsubscribe()
          },
          () => {
            click.unsubscribe()
          },
        )
        setState('')
      } catch (e) {
        if (!life.cancelled) {
          console.error(e)
          setState(`Could not load the structure: ${String(e)}`)
        }
      }
    })()

    return () => {
      life.cancelled = true
      for (const fn of life.unsubscribe) {
        fn()
      }
      model.clearHighlight('structure')
      pluginRef.current = undefined
      molstarRef.current = undefined
      loadedRef.current = []
      movedRef.current = new Set()
      life.plugin?.dispose()
      target.remove()
    }
  }, [key, model])

  useEffect(() => {
    const plugin = pluginRef.current
    const molstar = molstarRef.current
    if (!ready || !plugin || !molstar) {
      return undefined
    }
    if (fitBy === 'tm-align') {
      paintQueue.current = paintQueue.current
        .then(async () => {
          if (pluginRef.current !== plugin) {
            return
          }
          const loaded = loadedRef.current
          const results = await tmAlignOnto(
            plugin,
            molstar,
            loaded.map(l => l.ref),
          )
          for (const l of loaded) {
            movedRef.current.add(l.id)
          }
          plugin.managers.camera.reset()
          onTmAlignRef.current?.(
            Object.fromEntries(
              results.flatMap(r => {
                const id = loaded.find(l => l.ref === r.ref)?.id
                return id === undefined ? [] : [[id, r] as const]
              }),
            ),
          )
        })
        .catch((e: unknown) => {
          console.error(e)
        })
      return undefined
    }
    const moves = JSON.parse(transformKey) as Record<string, number[]>
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    paintQueue.current = paintQueue.current
      .then(async () => {
        if (pluginRef.current !== plugin) {
          return
        }
        let moved = false
        for (const { id, ref } of loadedRef.current) {
          const matrix = moves[id]
          if (matrix) {
            await transformStructure(plugin, molstar, ref, matrix)
            movedRef.current.add(id)
            moved = true
          } else if (movedRef.current.delete(id)) {
            await transformStructure(plugin, molstar, ref, identity)
            moved = true
          }
        }
        if (moved) {
          plugin.managers.camera.reset()
        }
      })
      .catch((e: unknown) => {
        console.error(e)
      })
    return undefined
  }, [ready, transformKey, fitBy, key])

  useEffect(() => {
    const plugin = pluginRef.current
    const molstar = molstarRef.current
    if (!ready || !plugin || !molstar) {
      return undefined
    }
    const stop = reaction(
      () => model.clickedCell,
      cell => {
        const found = pickStructure(
          model,
          loadedRef.current.map(l => l.id),
          cell,
        )
        const loaded = found
          ? loadedRef.current.find(l => l.id === found.id)
          : undefined
        const drawn = loaded
          ? drawnStructure(plugin, molstar, loaded.ref)
          : undefined
        const loci =
          found && drawn
            ? residueLoci(
                molstar,
                drawn,
                [found.hit.position],
                found.hit.structure.asymId,
                found.hit.structure.asymIdKind,
              )
            : undefined
        if (loci && !molstar.StructureElement.Loci.isEmpty(loci)) {
          plugin.managers.camera.focusLoci(loci, { minRadius: 20 })
          plugin.managers.structure.focus.setFromLoci(loci)
        } else {
          plugin.managers.structure.focus.clear()
        }
      },
      { equals: compareStructural },
    )
    const stopHover = reaction(
      () => model.hoveredCell,
      cell => {
        const found = pickStructure(
          model,
          loadedRef.current.map(l => l.id),
          cell,
        )
        const loaded = found
          ? loadedRef.current.find(l => l.id === found.id)
          : undefined
        const drawn = loaded
          ? drawnStructure(plugin, molstar, loaded.ref)
          : undefined
        const { lociHighlights } = plugin.managers.interactivity
        if (found && drawn) {
          lociHighlights.highlightOnly(
            {
              loci: residueLoci(
                molstar,
                drawn,
                [found.hit.position],
                found.hit.structure.asymId,
                found.hit.structure.asymIdKind,
              ),
            },
            false,
          )
          setStatus(
            `${cell?.row} residue ${cell?.residue} · ${found.id} residue ${found.hit.position}${found.hit.observed ? '' : ' · no coordinates'}`,
          )
        } else {
          lociHighlights.clearHighlights()
          setStatus(
            cell?.row === undefined
              ? idle
              : `${cell.row} residue ${cell.residue ?? '(gap)'} · no mapping onto the shown structures`,
          )
        }
      },
      { equals: compareStructural },
    )
    return () => {
      stop()
      stopHover()
    }
  }, [ready, model, key])

  useEffect(() => {
    const plugin = pluginRef.current
    const molstar = molstarRef.current
    if (!ready || !plugin || !molstar) {
      return undefined
    }
    const loadedNow = loadedRef.current
    const several = loadedNow.length > 1
    if (colorBy === 'none' && !several) {
      return undefined
    }
    const enqueue = (step: () => Promise<void>) => {
      paintQueue.current = paintQueue.current
        .then(() => (pluginRef.current === plugin ? step() : undefined))
        .catch((e: unknown) => {
          console.error(e)
        })
    }
    const perStructure = loadedNow.flatMap((l, index) => {
      const drawn = plugin.state.data.cells.get(l.ref)?.obj?.data as
        | Structure
        | undefined
      return drawn
        ? [{ ...l, index, residues: polymerResidues(molstar, drawn) }]
        : []
    })
    const life = { cancelled: false, dispose: () => {} }
    void import('react-msaview').then(({ schemeResidueColor }) => {
      if (life.cancelled) {
        return
      }
      life.dispose = reaction(
        () =>
          perStructure.map(s =>
            colorBy === 'none'
              ? solidGroups(
                  s.residues,
                  structurePalette[s.index % structurePalette.length]!,
                )
              : paintGroups(
                  model,
                  s.id,
                  s.residues,
                  colorBy === 'scheme'
                    ? schemeResidueColor(model)
                    : (row, pos) => conservationColor(model, row, pos),
                ),
          ),
        groups => {
          for (const [i, s] of perStructure.entries()) {
            enqueue(() => paintStructure(plugin, molstar, groups[i]!, s.ref))
          }
        },
        { fireImmediately: true, equals: compareStructural },
      )
    })
    return () => {
      life.cancelled = true
      life.dispose()
      for (const s of perStructure) {
        enqueue(() => paintStructure(plugin, molstar, [], s.ref))
      }
    }
  }, [colorBy, ready, model, key])

  if (entries.length === 0) {
    return null
  }
  return (
    <div>
      <div style={{ position: 'relative', height }} ref={hostRef}>
        {state ? (
          <p
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              margin: 0,
              padding: 16,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            {state}
          </p>
        ) : null}
      </div>
      <p aria-live="polite" style={{ margin: '8px 0 0', fontSize: 14 }}>
        {status}
      </p>
    </div>
  )
})

// the first shown structure the hovered or clicked row maps onto
function pickStructure(
  model: MsaViewModel,
  ids: string[],
  cell: { row?: string; residue?: number } | undefined,
) {
  if (cell?.row === undefined || cell.residue === undefined) {
    return undefined
  }
  for (const id of ids) {
    const hit = model.structureResidue(cell.row, cell.residue, id)
    if (hit) {
      return { id, hit }
    }
  }
  return undefined
}
