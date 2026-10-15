import { useEffect, useState } from 'react'

import { when } from 'mobx'
import { findStructures } from 'react-msaview-structure'

import type { MsaViewModel } from 'react-msaview'
import type { StructureCandidate } from 'react-msaview-structure'

export interface DemoProtein {
  row: string
  accession: string
}

export interface MappingState {
  state: 'loading' | 'ready' | 'error'
  message: string
  /** every candidate found, by row, so a demo can offer a choice */
  candidates: Record<string, StructureCandidate[]>
}

/**
 * Looks each row's structures up by its UniProt accession and writes the
 * AlphaFold model's mapping, or the candidate `pick` chooses, onto the model.
 * The lookups run in the browser against AlphaFold DB and RCSB, which is the
 * point of the demo: no structure file or mapping is bundled with it.
 */
export function useAccessionMappings(
  model: MsaViewModel,
  proteins: DemoProtein[],
  pick: (
    candidates: StructureCandidate[],
  ) => StructureCandidate | undefined = c => c[0],
) {
  // a demo's proteins and choice are fixed for its life
  const [fixed] = useState({ proteins, pick })
  const [mappings, setMappings] = useState<MappingState>({
    state: 'loading',
    message: 'Looking up structures',
    candidates: {},
  })
  useEffect(() => {
    const life = { cancelled: false }
    void (async () => {
      try {
        await when(() => model.dataInitialized)
        const candidates: Record<string, StructureCandidate[]> = {}
        const chosen = []
        const problems: string[] = []
        const found = await Promise.all(
          fixed.proteins.map(async ({ row, accession }) => ({
            row,
            result: await findStructures({
              rowName: row,
              rowSequence: model.rowSequence(row) ?? '',
              accession,
            }),
          })),
        )
        for (const { row, result } of found) {
          candidates[row] = result.candidates
          const picked = fixed.pick(result.candidates)
          if (picked) {
            chosen.push(picked.mapping)
          } else {
            problems.push(result.problem ?? `${row} has no structure`)
          }
        }
        if (life.cancelled) {
          return
        }
        model.setResidueMappings(chosen)
        setMappings({
          state: chosen.length > 0 ? 'ready' : 'error',
          message: problems.join(' '),
          candidates,
        })
      } catch (e) {
        if (!life.cancelled) {
          setMappings({
            state: 'error',
            message: e instanceof Error ? e.message : String(e),
            candidates: {},
          })
        }
      }
    })()
    return () => {
      life.cancelled = true
    }
  }, [model, fixed])
  return mappings
}
