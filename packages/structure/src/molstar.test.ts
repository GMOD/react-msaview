import { describe, expect, test } from 'vitest'

import { componentsOfStructure } from './molstar.ts'

import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context'

// only the part of the plugin the lookup reads
function pluginListing(refs: () => string[]) {
  return {
    managers: {
      structure: {
        hierarchy: {
          get current() {
            return {
              structures: refs().map(ref => ({
                cell: { transform: { ref } },
                components: [`components of ${ref}`],
              })),
            }
          },
        },
      },
    },
  } as unknown as PluginUIContext
}

describe('componentsOfStructure', () => {
  test('returns the components once the hierarchy lists the structure', async () => {
    let calls = 0
    const plugin = pluginListing(() => (++calls > 3 ? ['root-1'] : []))
    await expect(
      componentsOfStructure(plugin, 'root-1', { attempts: 10, delayMs: 1 }),
    ).resolves.toEqual(['components of root-1'])
    expect(calls).toBe(4)
  })

  test('fails, naming the structure, when the hierarchy never lists it', async () => {
    const plugin = pluginListing(() => ['other'])
    await expect(
      componentsOfStructure(plugin, 'root-1', { attempts: 3, delayMs: 1 }),
    ).rejects.toThrow('root-1')
  })
})
