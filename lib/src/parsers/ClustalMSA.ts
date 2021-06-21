import { parse } from 'clustal-js'
export default class ClustalMSA {
  private MSA: ReturnType<typeof parse>

  constructor(text: string) {
    this.MSA = parse(text)
  }

  getMSA() {
    return this.MSA
  }

  getRow(name: string) {
    return this.MSA.alns.find((aln) => aln.id === name)?.seq.split('')
  }

  getWidth() {
    return this.MSA.alns[0].seq.length
  }

  getDetails() {
    return this.MSA.header
  }

  getNames() {
    return this.MSA.alns.map((aln) => aln.id)
  }

  getStructures() {
    return {}
  }

  get alignmentNames() {
    return []
  }

  getTree() {
    return {
      id: 'root',
      noTree: true,
      branchset: this.getNames().map((name) => ({ id: name, name })),
    }
  }

  get seqConsensus() {
    return this.MSA.consensus
  }
  get secondaryStructureConsensus() {
    return undefined
  }

  get tracks() {
    return this.seqConsensus
      ? [
          {
            id: 'seqConsensus',
            name: 'Sequence consensus',
            data: this.seqConsensus,
            customColorScheme: {
              '*': 'white',
              ':': 'grey',
              '.': 'darkgrey',
              ' ': 'black',
            },
          },
        ]
      : []
  }
}
