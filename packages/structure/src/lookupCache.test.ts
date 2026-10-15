import { describe, expect, test, vi } from 'vitest'

import { networkLookups } from './lookup.ts'

const search = vi.hoisted(() => vi.fn())

vi.mock('./identifiers.ts', async original => ({
  ...(await original<typeof import('./identifiers.ts')>()),
  searchAccession: search,
}))

describe('networkLookups resolveAccession', () => {
  test('an aborted caller leaves the shared lookup for the next one', async () => {
    let finish: (accession: string) => void = () => {}
    search.mockReturnValueOnce(
      new Promise<string>(resolve => {
        finish = resolve
      }),
    )
    const identifier = { kind: 'entryName' as const, value: 'HBA_HUMAN' }
    const first = new AbortController()
    const aborted = networkLookups(first.signal).resolveAccession(identifier)
    first.abort()
    await expect(aborted).rejects.toThrow()

    const second = networkLookups(new AbortController().signal)
    const next = second.resolveAccession(identifier)
    finish('P69905')
    await expect(next).resolves.toBe('P69905')
    expect(search).toHaveBeenCalledTimes(1)
  })
})
