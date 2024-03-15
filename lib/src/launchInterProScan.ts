import { textfetch, timeout } from './fetchUtils'

const base = `https://www.ebi.ac.uk/Tools/services/rest/`

async function runEmbossMatcher({
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
      sequence: `>a\n${seq}`,
    }),
  })
  await wait({
    jobId,
    onProgress,
  })
  return {
    gff: await textfetch(`${base}/iprscan5/run/${jobId}/gff`),
  }
}

async function wait({
  onProgress,
  jobId,
}: {
  jobId: string
  onProgress: (arg: string) => void
}) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (let i = 0; i < 10; i++) {
      await timeout(1000)
      onProgress(`Re-checking alignment to PDB seq1,seq2 in... ${10 - i}`)
    }
    const result = await textfetch(`${base}/iprscan5/status/${jobId}`)

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
    return runEmbossMatcher({ seq, onProgress })
  } else {
    throw new Error('unknown algorithm')
  }
}
