import { jsonfetch, textfetch, timeout } from './fetchUtils'

const base = `https://www.ebi.ac.uk/Tools/services/rest/`

async function runInterProScan({
  seq,
  onProgress,
}: {
  seq: string
  onProgress: (arg: string) => void
}) {
  const jobId = await textfetch(`${base}/iprscan5/run`, {
    method: 'POST',
    body: new URLSearchParams({
      email: 'colin.diesh@gmail.com',
      sequence: `${seq}`,
    }),
  })
  await wait({
    jobId,
    onProgress,
  })
  return {
    result: await jsonfetch(`${base}/iprscan5/result/${jobId}/json`),
  }
}

async function wait({
  onProgress,
  jobId,
}: {
  jobId: string
  onProgress: (arg: string) => void
}) {
  const url = `${base}/iprscan5/status/${jobId}`
  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (let i = 0; i < 10; i++) {
      await timeout(1000)
      onProgress(`Checking status... ${10 - i} ${url}`)
    }
    const result = await textfetch(url)

    if (result === 'FINISHED') {
      break
    }
  }
}

export async function launchInterProScan({
  algorithm,
  seq,
  onProgress,
}: {
  algorithm: string
  seq: string
  onProgress: (arg: string) => void
}) {
  onProgress(`Launching ${algorithm} MSA...`)
  if (algorithm === 'interproscan') {
    return runInterProScan({ seq, onProgress })
  } else {
    throw new Error('unknown algorithm')
  }
}
