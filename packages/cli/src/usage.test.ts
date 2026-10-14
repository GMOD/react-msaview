import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'

import { expect, test } from 'vitest'

import { commandHelp, optionsTable, readmeWithOptions } from './usage.ts'

const index = new URL('index.ts', import.meta.url).pathname

test('the README option tables are the ones usage.ts renders', () => {
  const readme = fs.readFileSync(
    new URL('../README.md', import.meta.url),
    'utf8',
  )
  expect(
    readmeWithOptions(readme),
    'run `pnpm --filter react-msaview-cli readme`',
  ).toBe(readme)
})

test('a table cell escapes the pipe in an argument', () => {
  expect(optionsTable('genestructure')).toContain('`--taxon <name\\|id>`')
})

test('help shows a literal default and a default in words', () => {
  const help = commandHelp('genestructure')
  expect(help).toMatch(
    /--taxon <name\|id> +Taxon for --gene \(default: human\)/,
  )
  expect(help).toContain('(default: MANE/RefSeq Select)')
  expect(help).toContain('(default: first row)')
})

test("a command refuses another command's flag and points at its help", () => {
  const run = spawnSync(
    process.execPath,
    [index, 'export-svg', '--msa', 'x.fa', '--database', 'cdd'],
    { encoding: 'utf8' },
  )
  expect(run.status).toBe(1)
  expect(run.stderr).toContain("Unknown option '--database'")
  expect(run.stderr).toContain('react-msaview-cli export-svg --help')
})
