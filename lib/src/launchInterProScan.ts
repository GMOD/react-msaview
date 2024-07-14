import { jsonfetch, textfetch, timeout } from './fetchUtils'

const base = `https://www.ebi.ac.uk/Tools/services/rest`

export interface InterProScanResults {
  matches: {
    signature: {
      entry?: {
        name: string
        description: string
        accession: string
      }
    }
    locations: { start: number; end: number }[]
  }[]
  xref: { id: string }[]
}
export interface InterProScanResponse {
  results: InterProScanResults[]
}

async function runInterProScan({
  seq,
  onProgress,
  onJobId,
  programs,
}: {
  seq: string
  programs: string[]
  onProgress: (arg?: { msg: string; url?: string }) => void
  onJobId: (arg: string) => void
}) {
  const jobId = await textfetch(`${base}/iprscan5/run`, {
    method: 'POST',
    body: new URLSearchParams({
      email: 'colin.diesh@gmail.com',
      sequence: `${seq}`,
      programs: programs.join(','),
    }),
  })
  onJobId(jobId)
  await wait({
    jobId,
    onProgress,
  })
  return loadInterProScanResults(jobId)
}

export function loadInterProScanResults(jobId: string) {
  return jsonfetch<InterProScanResponse>(
    `${base}/iprscan5/result/${jobId}/json`,
  )
}

async function wait({
  onProgress,
  jobId,
}: {
  jobId: string
  onProgress: (arg?: { msg: string; url?: string }) => void
}) {
  const url = `${base}/iprscan5/status/${jobId}`
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      for (let i = 0; i < 10; i++) {
        await timeout(1000)
        onProgress({ msg: `Checking status ${10 - i}`, url })
      }
      const result = await textfetch(url)

      if (result === 'FINISHED') {
        break
      }
    }
  } finally {
    onProgress()
  }
}

export async function launchInterProScan({
  algorithm,
  seq,
  programs,
  onJobId,
  onProgress,
}: {
  algorithm: string
  seq: string
  programs: string[]
  onProgress: (arg?: { msg: string; url?: string }) => void
  onJobId: (arg: string) => void
}) {
  try {
    onProgress({ msg: `Launching ${algorithm} MSA` })
    if (algorithm === 'interproscan') {
      const result = await runInterProScan({
        seq,
        onJobId,
        onProgress,
        programs,
      })
      return result
    } else {
      throw new Error('unknown algorithm')
    }
  } finally {
    onProgress()
  }
}
