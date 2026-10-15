import { useEffect, useRef, useState } from 'react'

import { compareStructural, reaction } from 'mobx'
import { observer } from 'mobx-react'
import { isBinaryStructureUrl, structureFormatFromContent } from 'p2s_mapper'
import { schemeResidueColor } from 'react-msaview'

import {
  drawnStructure,
  loadMolstar,
  polymerResidues,
  residueLoci,
  showChains,
  tmAlignOnto,
  transformStructure,
} from './molstar.ts'
import {
  conservationColor,
  highlightGroups,
  mappedResidues,
  paintGroups,
  paintStructure,
  rowResidueLookup,
  solidMappedGroups,
} from './paint.ts'
import { structurePalette } from './palette.ts'
import { identityMatrix } from './superpose.ts'

import type { Molstar, PolymerResidue, TmAlignment } from './molstar.ts'
import type { StructureColor } from './paint.ts'
import type { Loci } from 'molstar/lib/mol-model/loci'
import type { Structure } from 'molstar/lib/mol-model/structure'
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context'
import type { ReactNode } from 'react'
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
  /** paint the residues the alignment's `highlights` mark, on top of the rest */
  highlights?: boolean
  /** one color for every residue, to tell this panel's structures apart */
  solidColor?: string
  /** a line above the view, such as a facet's label */
  caption?: string
  /** hides the hover status line, for a small multiple */
  compact?: boolean
  /** the Mol* plugin once the structures are loaded, and undefined when it goes */
  onPlugin?: (plugin: PluginUIContext | undefined) => void
  /**
   * `mapped` draws only the chains a row maps onto, with the ligands and ions
   * filed under them, and hides the other chains and the waters. The default is
   * `mapped` when several structures are shown, where the unfitted chains of
   * each would crowd the fitted ones, and `all` for one.
   */
  chains?: 'mapped' | 'all'
  height?: number
}

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
  residues: PolymerResidue[]
}

// the file's own first lines say which parser it needs: mmCIF read as PDB
// loads with no polymer and no error
async function loadStructure(
  plugin: PluginUIContext,
  molstar: Molstar,
  id: string,
  url: string,
  shownResidues?: (residues: PolymerResidue[]) => PolymerResidue[],
): Promise<Loaded | undefined> {
  let trajectory
  if (isBinaryStructureUrl(url)) {
    const data = await plugin.builders.data.download(
      { url, isBinary: true },
      { state: { isGhost: true } },
    )
    trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif')
  } else {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
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
    shownResidues ? { representationPreset: 'empty' } : undefined,
  )
  const root = built?.structure
  const structure = root
    ? plugin.state.data.cells.get(root.ref)?.obj?.data
    : undefined
  if (!built || !root || !structure) {
    return undefined
  }
  const residues = polymerResidues(molstar, structure)
  if (shownResidues) {
    const props = built.structureProperties ?? root
    const shown = shownResidues(residues)
    // a structure no row reaches is drawn whole rather than not at all
    await (shown.length > 0
      ? showChains(plugin, molstar, props.ref, shown)
      : plugin.builders.structure.representation.applyPreset(props, 'auto'))
  }
  return { id, ref: root.ref, model: structure.model, residues }
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
  highlights = true,
  solidColor,
  caption,
  compact = false,
  onPlugin,
  chains,
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
  const onlyMapped =
    (chains ?? (entries.length > 1 ? 'mapped' : 'all')) === 'mapped'
  // the chains drawn follow the mappings, so a new one onto another chain reloads
  const chainKey = onlyMapped
    ? JSON.stringify(
        entries.map(e =>
          mapped
            .filter(m => m.structure.id === e.id)
            .map(m => `${m.structure.asymId}/${m.structure.asymIdKind}`)
            .toSorted(),
        ),
      )
    : ''

  const hostRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<PluginUIContext | undefined>(undefined)
  const molstarRef = useRef<Molstar | undefined>(undefined)
  const loadedRef = useRef<Loaded[]>([])
  const paintQueue = useRef(Promise.resolve())
  // the latest callback, so a new function each render does not refit
  const onTmAlignRef = useRef(onTmAlign)
  onTmAlignRef.current = onTmAlign
  const onPluginRef = useRef(onPlugin)
  onPluginRef.current = onPlugin
  // structures a transform has moved, so only those are moved back
  const movedRef = useRef(new Set<string>())
  const framedRef = useRef(false)
  const [state, setState] = useState('Loading structure')
  const [status, setStatus] = useState(idle)
  const [failed, setFailed] = useState<string[]>([])
  const ready = state === ''
  // tm-align ignores `transforms`, so a change to them must not refit
  const moveKey =
    fitBy === 'tm-align' ? 'tm-align' : JSON.stringify(transforms ?? {})

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
      root: undefined as { unmount: () => void } | undefined,
      unsubscribe: [] as (() => void)[],
    }
    const target = document.createElement('div')
    target.style.cssText = 'position:absolute;inset:0'
    hostRef.current?.append(target)
    setState('Loading structure')
    setFailed([])

    void (async () => {
      try {
        const molstar = await loadMolstar()
        if (life.cancelled) {
          return
        }
        const spec = molstar.DefaultPluginUISpec()
        const plugin = await molstar.createPluginUI({
          target,
          render: (component: ReactNode, container: Element) => {
            const root = molstar.createRoot(container)
            life.root = root
            root.render(component)
          },
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
          life.root?.unmount()
          target.remove()
          return
        }
        const loaded: Loaded[] = []
        const problems: string[] = []
        for (const { id, url } of entries) {
          try {
            const found = await loadStructure(
              plugin,
              molstar,
              id,
              url,
              chainKey
                ? residues => mappedResidues(model, id, residues)
                : undefined,
            )
            if (found) {
              loaded.push(found)
            } else {
              problems.push(`${id} holds no structure to show`)
            }
          } catch (e) {
            problems.push(
              `${id}: ${e instanceof Error ? e.message : String(e)}`,
            )
          }
          if (life.cancelled) {
            return
          }
        }
        if (loaded.length === 0) {
          throw new Error(problems.join('; '))
        }
        setFailed(problems)
        loadedRef.current = loaded
        molstarRef.current = molstar
        pluginRef.current = plugin

        const lookup = (
          where: NonNullable<ReturnType<typeof readLocation>>,
        ) => {
          const found = loaded.find(l => l.model === where.model)
          return found
            ? rowResidueLookup(model, found.id, found.residues)(where)
            : undefined
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
        onPluginRef.current?.(plugin)
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
      onPluginRef.current?.(undefined)
      pluginRef.current = undefined
      molstarRef.current = undefined
      loadedRef.current = []
      movedRef.current = new Set()
      framedRef.current = false
      life.plugin?.dispose()
      // React refuses to unmount a root synchronously inside a commit
      const { root } = life
      setTimeout(() => {
        root?.unmount()
        target.remove()
      })
    }
  }, [key, chainKey, model])

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
          // the fit is onto the pivot's own coordinates, so it stays put
          const pivot = loaded[0]
          if (pivot && movedRef.current.delete(pivot.id)) {
            await transformStructure(plugin, molstar, pivot.ref, identityMatrix)
          }
          const results = await tmAlignOnto(
            plugin,
            molstar,
            loaded.map(l => l.ref),
          )
          for (const l of loaded.slice(1)) {
            movedRef.current.add(l.id)
          }
          frameMapped(plugin, molstar, model, loadedRef.current)
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
    const moves = JSON.parse(moveKey) as Record<string, number[]>
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
            await transformStructure(plugin, molstar, ref, identityMatrix)
            moved = true
          }
        }
        if (moved || !framedRef.current) {
          framedRef.current = true
          frameMapped(plugin, molstar, model, loadedRef.current)
        }
      })
      .catch((e: unknown) => {
        console.error(e)
      })
    return undefined
  }, [ready, moveKey, fitBy, key, model])

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
    const several = loadedNow.length > 1 || solidColor !== undefined
    if (colorBy === 'none' && !several && !highlights) {
      return undefined
    }
    const enqueue = (step: () => Promise<void>) => {
      paintQueue.current = paintQueue.current
        .then(() => (pluginRef.current === plugin ? step() : undefined))
        .catch((e: unknown) => {
          console.error(e)
        })
    }
    const perStructure = loadedNow.map((l, index) => ({ ...l, index }))
    const dispose = reaction(
      () =>
        perStructure.map(s => [
          ...(colorBy !== 'none'
            ? paintGroups(
                model,
                s.id,
                s.residues,
                colorBy === 'scheme'
                  ? schemeResidueColor(model)
                  : (row, pos) => conservationColor(model, row, pos),
              )
            : several
              ? solidMappedGroups(
                  model,
                  s.id,
                  s.residues,
                  solidColor ??
                    structurePalette[s.index % structurePalette.length]!,
                )
              : []),
          ...(highlights ? highlightGroups(model, s.id, s.residues) : []),
        ]),
      groups => {
        for (const [i, s] of perStructure.entries()) {
          enqueue(() => paintStructure(plugin, molstar, groups[i]!, s.ref))
        }
      },
      { fireImmediately: true, equals: compareStructural },
    )
    return () => {
      dispose()
      for (const s of perStructure) {
        enqueue(() => paintStructure(plugin, molstar, [], s.ref))
      }
    }
  }, [colorBy, highlights, solidColor, ready, model, key])

  if (entries.length === 0) {
    return null
  }
  return (
    <div>
      {caption ? (
        <div style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
          {caption}
        </div>
      ) : null}
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
      {failed.length > 0 ? (
        <p role="alert" style={{ margin: '8px 0 0', fontSize: 13 }}>
          Could not load {failed.join('; ')}
        </p>
      ) : null}
      {compact ? null : (
        <p aria-live="polite" style={{ margin: '8px 0 0', fontSize: 14 }}>
          {status}
        </p>
      )}
    </div>
  )
})

/**
 * Points the camera at the residues the alignment covers, so a disordered tail
 * or an unaligned domain does not set the zoom. Falls back to the whole view
 * when nothing is mapped.
 */
function frameMapped(
  plugin: PluginUIContext,
  molstar: Molstar,
  model: MsaViewModel,
  loaded: Loaded[],
) {
  const loci = loaded.flatMap(({ id, ref, residues }) => {
    const drawn = drawnStructure(plugin, molstar, ref)
    if (!drawn) {
      return []
    }
    const chains = new Map<string, number[]>()
    for (const r of mappedResidues(model, id, residues)) {
      const ids = chains.get(r.labelAsymId) ?? []
      ids.push(r.labelSeqId)
      chains.set(r.labelAsymId, ids)
    }
    return [...chains].map(([chain, ids]) =>
      residueLoci(molstar, drawn, ids, chain, 'label'),
    )
  })
  if (loci.length > 0) {
    plugin.managers.camera.focusLoci(loci)
  } else {
    plugin.managers.camera.reset()
  }
}

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
