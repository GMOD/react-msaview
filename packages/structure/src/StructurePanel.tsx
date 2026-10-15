import { useEffect, useRef, useState } from 'react'

import { compareStructural, reaction } from 'mobx'
import { observer } from 'mobx-react'

import {
  loadMolstar,
  loadedStructure,
  polymerResidues,
  residueLoci,
} from './molstar.ts'
import { conservationColor, paintGroups, paintStructure } from './paint.ts'

import type { Molstar } from './molstar.ts'
import type { StructureColor } from './paint.ts'
import type { Loci } from 'molstar/lib/mol-model/loci'
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context'
import type { MsaViewModel } from 'react-msaview'

export interface StructurePanelProps {
  model: MsaViewModel
  /** which mapped structure to show; the first one when unset */
  structureId?: string
  /** what to paint the structure with */
  colorBy?: StructureColor
  height?: number
}

const idle = 'Hover a residue in the alignment or the structure.'

function formatOf(url: string) {
  return url.endsWith('.pdb') || url.endsWith('.ent') ? 'pdb' : 'mmcif'
}

function readLocation(molstar: Molstar, loci: Loci) {
  const loc = molstar.StructureElement.Loci.is(loci)
    ? molstar.StructureElement.Loci.getFirstLocation(loci)
    : undefined
  const SP = molstar.StructureProperties
  return loc
    ? {
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

/**
 * A Mol* view of one structure a row of the alignment maps onto. The model
 * drives it: a hovered or clicked alignment cell lights or focuses the residue
 * it maps to, a hovered structure residue lights its cell, and `colorBy` paints
 * the structure from the alignment's columns.
 */
export const StructurePanel = observer(function StructurePanel({
  model,
  structureId,
  colorBy = 'none',
  height = 400,
}: StructurePanelProps) {
  const mapped = model.mappedStructures
  const structure = (
    structureId ? mapped.find(m => m.structure.id === structureId) : mapped[0]
  )?.structure
  const id = structure?.id
  const url = structure?.url

  const hostRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<PluginUIContext | undefined>(undefined)
  const molstarRef = useRef<Molstar | undefined>(undefined)
  const paintQueue = useRef(Promise.resolve())
  const [state, setState] = useState('Loading structure')
  const [status, setStatus] = useState(idle)
  const ready = state === ''

  useEffect(() => {
    if (!url || !id) {
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
        const data = await plugin.builders.data.download(
          { url, isBinary: url.endsWith('.bcif') },
          { state: { isGhost: true } },
        )
        const trajectory = await plugin.builders.structure.parseTrajectory(
          data,
          url.endsWith('.bcif') ? 'mmcif' : formatOf(url),
        )
        await plugin.builders.structure.hierarchy.applyPreset(
          trajectory,
          'default',
        )
        if (life.cancelled) {
          return
        }
        molstarRef.current = molstar
        pluginRef.current = plugin

        const lookup = (where: NonNullable<ReturnType<typeof readLocation>>) =>
          model.rowResidue(id, where.labelSeqId, where.labelAsymId) ??
          model.rowResidue(id, where.labelSeqId, where.authAsymId)

        const hover = plugin.behaviors.interaction.hover.subscribe(
          ({ current }) => {
            const where = readLocation(molstar, current.loci)
            if (!where) {
              model.clearHighlight('structure')
              setStatus(idle)
              return
            }
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
          setState(`Could not load ${url}: ${String(e)}`)
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
      life.plugin?.dispose()
      target.remove()
    }
  }, [url, id, model])

  useEffect(() => {
    const plugin = pluginRef.current
    const molstar = molstarRef.current
    if (!ready || !plugin || !molstar || !id) {
      return undefined
    }
    const stop = reaction(
      () => model.clickedCell,
      cell => {
        const hit =
          cell?.row !== undefined && cell.residue !== undefined
            ? model.structureResidue(cell.row, cell.residue, id)
            : undefined
        const loaded = loadedStructure(plugin)
        const loci =
          hit && loaded
            ? residueLoci(molstar, loaded, [hit.position], hit.structure.asymId)
            : undefined
        if (loci && !molstar.StructureElement.Loci.isEmpty(loci)) {
          plugin.managers.camera.focusLoci(loci, { minRadius: 20 })
          plugin.managers.structure.focus.setFromLoci(loci)
        } else {
          plugin.managers.structure.focus.clear()
        }
      },
    )
    const stopHover = reaction(
      () => model.hoveredCell,
      cell => {
        const hit =
          cell?.row !== undefined && cell.residue !== undefined
            ? model.structureResidue(cell.row, cell.residue, id)
            : undefined
        const loaded = loadedStructure(plugin)
        const { lociHighlights } = plugin.managers.interactivity
        if (hit && loaded) {
          lociHighlights.highlightOnly(
            {
              loci: residueLoci(
                molstar,
                loaded,
                [hit.position],
                hit.structure.asymId,
              ),
            },
            false,
          )
          setStatus(
            `${cell?.row} residue ${cell?.residue} · ${id} residue ${hit.position}${hit.observed ? '' : ' · no coordinates'}`,
          )
        } else {
          lociHighlights.clearHighlights()
          setStatus(
            cell?.row === undefined
              ? idle
              : `${cell.row} residue ${cell.residue ?? '(gap)'} · no mapping onto ${id}`,
          )
        }
      },
    )
    return () => {
      stop()
      stopHover()
    }
  }, [ready, model, id])

  useEffect(() => {
    const plugin = pluginRef.current
    const molstar = molstarRef.current
    const loaded = plugin ? loadedStructure(plugin) : undefined
    if (colorBy === 'none' || !ready || !plugin || !molstar || !loaded || !id) {
      return undefined
    }
    const enqueue = (step: () => Promise<void>) => {
      paintQueue.current = paintQueue.current
        .then(() => (pluginRef.current === plugin ? step() : undefined))
        .catch((e: unknown) => {
          console.error(e)
        })
    }
    const residues = polymerResidues(molstar, loaded)
    const life = { cancelled: false, dispose: () => {} }
    void import('react-msaview').then(({ schemeResidueColor }) => {
      if (life.cancelled) {
        return
      }
      life.dispose = reaction(
        () =>
          paintGroups(
            model,
            id,
            residues,
            colorBy === 'scheme'
              ? schemeResidueColor(model)
              : (row, pos) => conservationColor(model, row, pos),
          ),
        groups => {
          enqueue(() => paintStructure(plugin, molstar, groups))
        },
        { fireImmediately: true, equals: compareStructural },
      )
    })
    return () => {
      life.cancelled = true
      life.dispose()
      enqueue(() => paintStructure(plugin, molstar, []))
    }
  }, [colorBy, ready, model, id])

  if (!structure) {
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
              margin: 0,
              display: 'grid',
              placeItems: 'center',
              opacity: 0.7,
            }}
          >
            {url ? state : `${id} has no file url in its mapping`}
          </p>
        ) : null}
      </div>
      <p aria-live="polite" style={{ margin: '8px 0 0', fontSize: 14 }}>
        {status}
      </p>
    </div>
  )
})
