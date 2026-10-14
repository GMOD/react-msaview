// Self-contained JBrowse session URLs for the tutorials/jbrowse_integration
// page, written by hand. Since jbrowse-plugin-msaview 3.5 a spec names the
// transcript (`connectedTranscript`), and the plugin looks the exon model up in
// the genome view's own gene track at launch. protein3d's `transcriptId` does
// the same for a ProteinView.
const HUB_HG38 = 'https://jbrowse.org/ucsc/hg38/config.json'
const DATA = 'https://gmod.org/JBrowseMSA/demo/data'
// hg38 with the RefSeq Select gene track and the BRAF and TP53 ClinVar tracks
const COMBINED_CONFIG = `${DATA}/jbrowse-msa-combined-config.json`

function specUrl(spec: Record<string, unknown>, config = HUB_HG38) {
  return `https://jbrowse.org/code/jb2/main/?config=${encodeURIComponent(config)}&session=spec-${encodeURIComponent(JSON.stringify(spec))}`
}

const tp53Genome = {
  type: 'LinearGenomeView',
  id: 'lgv-tp53',
  assembly: 'hg38',
  loc: 'chr17:7,668,000-7,688,000',
  tracks: ['hg38-ncbiRefSeqCurated'],
}

function tp53Search(params: Record<string, unknown>) {
  return specUrl({
    views: [
      tp53Genome,
      {
        type: 'MsaView',
        connectedViewId: tp53Genome.id,
        connectedTranscript: 'NM_000546.6',
        placement: 'splitRight',
        allowedGappyness: 50,
        ...params,
      },
    ],
  })
}

// TP53's UniRef50 cluster: every reference-proteome entry in UniProtKB within
// 50% identity of p53, aligned to the transcript's translation in the browser.
// It submits no job to any service, so it opens in seconds.
export const tp53UnirefBrowser = tp53Search({
  orthologParams: {
    taxId: 9606,
    geneCandidates: ['TP53'],
    source: 'uniref',
    msaAlgorithm: 'browser',
    maxSpecies: 100,
  },
})

// The same gene through a phmmer search of UniProt's representative proteomes
// at 15% similarity (rp15), the widest net EBI offers: p53's remote relatives
// across the tree of life, including p63/p73 and invertebrate p53 family
// members a 50% cluster cannot reach. The wait is EBI's queue.
export const tp53PhmmerRp15 = tp53Search({
  searchParams: {
    searchProgram: 'phmmer',
    blastDatabase: 'rp15',
    maxHits: 100,
  },
})

interface LinkedPair {
  id: string
  loc: string
  highlight?: string
  clinvarTrack?: string
  transcript: string
  row: string
  mark?: { start: number; end: number; label: string }
  msa: string
  tree: string
}

// A genome view on the RefSeq Select track, one transcript per gene, and an
// alignment loaded from files that connects to it through `transcript`.
function linkedPair(p: LinkedPair) {
  const genome = {
    assembly: 'hg38',
    loc: p.loc,
    tracks: [
      'hg38-ncbiRefSeqSelect',
      ...(p.clinvarTrack ? [p.clinvarTrack] : []),
    ],
  }
  return {
    genome,
    views: [
      {
        type: 'LinearGenomeView',
        id: p.id,
        ...genome,
        highlight: p.highlight ? [p.highlight] : undefined,
        colorByCDS: true,
      },
      {
        type: 'MsaView',
        connectedViewId: p.id,
        connectedTranscript: p.transcript,
        querySeqName: p.row,
        highlights: p.mark ? [{ row: p.row, ...p.mark }] : undefined,
        msaFileLocation: { uri: `${DATA}/${p.msa}` },
        treeFileLocation: { uri: `${DATA}/${p.tree}` },
        colorSchemeName: 'clustalx_protein_dynamic',
        labelsAlignRight: true,
        treeAreaWidth: 200,
      },
    ],
  }
}

function linkedSession(p: LinkedPair) {
  return specUrl({ views: linkedPair(p).views }, COMBINED_CONFIG)
}

// The `human` row is NP_000537.3, the translation of NM_000546.6.
const p53Alignment = {
  transcript: 'NM_000546.6',
  row: 'human',
  msa: 'tp53-p53-orthologs.fa',
  tree: 'tp53-p53.nh',
  clinvarTrack: 'hg38-tp53-clinvar-pathogenic',
}

// The Src-family kinases beside SRC. The Select transcript NM_198291.3 has the
// CDS of NM_005417.5, whose 536-residue translation is the SRC_HUMAN row
// (UniProt P12931).
export const proteinLinked = linkedSession({
  id: 'lgv-src',
  loc: 'chr20:37,344,685-37,406,050',
  transcript: 'NM_198291.3',
  row: 'SRC_HUMAN',
  msa: 'kinase.aln',
  tree: 'kinase.nh',
})

// The RAF family on BRAF V600. The BRAF_HUMAN row (UniProt P15056) is the
// translation of NM_004333.6, whose codon 600 is chr7:140,753,335-140,753,337.
export const brafV600 = linkedSession({
  id: 'lgv-braf',
  loc: 'chr7:140,753,295-140,753,377',
  highlight: 'chr7:140,753,335-140,753,337',
  clinvarTrack: 'hg38-braf-clinvar-pathogenic',
  transcript: 'NM_004333.6',
  row: 'BRAF_HUMAN',
  mark: { start: 600, end: 600, label: 'V600' },
  msa: 'braf.aln',
  tree: 'braf.nh',
})

// p53 across vertebrates on R248, whose codon is chr17:7,674,219-7,674,221.
export const tp53R248 = linkedSession({
  ...p53Alignment,
  id: 'lgv-tp53',
  loc: 'chr17:7,674,189-7,674,251',
  highlight: 'chr17:7,674,219-7,674,221',
  mark: { start: 248, end: 248, label: 'R248' },
})

// TP53, the p53 alignment and the AlphaFold structure, opened on the nuclear
// export signal: residues 339-350 in UniProt P04637's MOTIF features, codons
// chr17:7,670,659-7,670,694. `initialSelection` is the same range in 0-based
// half-open structure residues. The ProteinView connects to the genome view
// its `connectedViewId` names and searches the tracks of `connectedView` for
// `transcriptId`.
const tp53Motif = linkedPair({
  ...p53Alignment,
  id: 'lgv-tp53-3d',
  loc: 'chr17:7,670,259-7,671,094',
  mark: { start: 339, end: 350, label: 'Nuclear export signal' },
})
export const tp53Protein3d = specUrl(
  {
    views: [
      ...tp53Motif.views,
      {
        type: 'ProteinView',
        connectedViewId: 'lgv-tp53-3d',
        connectedView: tp53Motif.genome,
        transcriptId: 'NM_000546.6',
        url: 'https://alphafold.ebi.ac.uk/files/AF-P04637-F1-model_v6.cif',
        zoomToBaseLevel: false,
        height: 500,
        initialSelection: { start: 338, end: 350 },
      },
    ],
    layout: {
      direction: 'horizontal',
      children: [
        { views: [0, 1], size: 58 },
        { views: [2], size: 42 },
      ],
    },
  },
  COMBINED_CONFIG,
)
