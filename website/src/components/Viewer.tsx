import { Suspense, lazy } from 'react'

import { useDesktop } from '../lib/useDesktop'

const LiveViewer = lazy(() => import('./LiveViewer'))

export default function Viewer({ base }: { base: string }) {
  return useDesktop() ? (
    <Suspense fallback={<div style={{ height: 390 }} />}>
      <LiveViewer />
    </Suspense>
  ) : (
    <a href={`${base}/demo/`}>
      <img
        src={`${base}/media/domain-loss.png`}
        alt="Multiple sequence alignment viewer with phylogenetic tree and protein domains"
      />
      Open the interactive viewer
    </a>
  )
}
