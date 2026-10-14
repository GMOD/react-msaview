import * as fs from 'node:fs'

import { readmeWithOptions } from './usage.ts'

const file = new URL('../README.md', import.meta.url)
fs.writeFileSync(file, readmeWithOptions(fs.readFileSync(file, 'utf8')))
