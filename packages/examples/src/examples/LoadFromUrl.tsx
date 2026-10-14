import { MSAViewer } from 'react-msaview'

const BASE = 'https://jbrowse.org/genomes/multiple_sequence_alignments'

// The viewer fetches each URL itself. This Stockholm file carries its own
// tree, and the InterProScan GFF draws the protein domains over it.
export default function LoadFromUrl() {
  return (
    <MSAViewer
      msaUrl={`${BASE}/pfam-cov2.stock`}
      gffUrl={`${BASE}/pfam-cov2-domains.gff`}
      colorScheme="maeditor"
      height={550}
    />
  )
}
