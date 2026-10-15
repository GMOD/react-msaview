import { useState } from 'react'

import { findStructures, networkLookups } from 'react-msaview-structure'

import { messageOf, useRestartable } from './restartable'

import type { MsaViewModel } from 'react-msaview'
import type { StructureSearch } from 'react-msaview-structure'

export type Lookup =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'done'; result: StructureSearch; row: string }
  | { state: 'error'; row: string; message: string }

/** looks a row's structures up by its id, or by an accession typed for it */
export function useStructureLookup(model: MsaViewModel) {
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' })
  const run = useRestartable()

  async function find(row: string, accession: string) {
    const signal = run.restart()
    setLookup({ state: 'loading' })
    try {
      const result = await findStructures({
        rowName: row,
        rowSequence: model.rowSequence(row) ?? '',
        accession: accession.trim() || undefined,
        lookups: networkLookups(signal),
      })
      if (!signal.aborted) {
        setLookup({ state: 'done', result, row })
      }
    } catch (e) {
      if (!signal.aborted) {
        setLookup({ state: 'error', row, message: messageOf(e) })
      }
    }
  }

  function reset() {
    run.abort()
    setLookup({ state: 'idle' })
  }

  return { lookup, find, reset }
}
