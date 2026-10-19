// copied from jbrowse-components packages/core/src/util/groupKeys.ts, which
// @jbrowse/core 5.0.0-beta.9 ships but the hosts the plugin runs on do not

const NUMERIC = /^-?\d+(\.\d+)?$/
const DIGIT_RUNS = /\d+|\D+/g

function compareRuns(a: string, b: string) {
  const runsA = a.match(DIGIT_RUNS) ?? []
  const runsB = b.match(DIGIT_RUNS) ?? []
  const shared = Math.min(runsA.length, runsB.length)
  for (let i = 0; i < shared; i++) {
    const x = runsA[i]!
    const y = runsB[i]!
    if (x === y) {
      continue
    }
    if (/^\d/.test(x) && /^\d/.test(y)) {
      const nx = Number(x)
      const ny = Number(y)
      if (nx !== ny) {
        return nx < ny ? -1 : 1
      }
      return x.length < y.length ? -1 : 1
    }
    return x < y ? -1 : 1
  }
  return runsA.length - runsB.length
}

/**
 * Numbers first by value, then every other value run by run with digit runs
 * by magnitude, so `2` before `10`, `chr2` before `chr10` and `2.3.2.1a`
 * before `2.3.4.4b`. The empty value sorts last.
 */
export function compareGroupKeys(a: string, b: string) {
  if (a === b) {
    return 0
  }
  if (a === '' || b === '') {
    return a === '' ? 1 : -1
  }
  const numA = NUMERIC.test(a)
  const numB = NUMERIC.test(b)
  if (numA !== numB) {
    return numA ? -1 : 1
  }
  if (numA) {
    const diff = Number(a) - Number(b)
    if (diff !== 0) {
      return diff < 0 ? -1 : 1
    }
  }
  return compareRuns(a, b)
}
