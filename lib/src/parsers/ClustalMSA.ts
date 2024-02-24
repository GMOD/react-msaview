import { parse } from 'clustal-js'
import { NodeWithIds } from '../util'
export default class ClustalMSA {
  private MSA: ReturnType<typeof parse>

  constructor(text: string) {
    this.MSA = parse(text)
  }

  getMSA() {
    return this.MSA
  }

  getRow(name: string) {
    return this.MSA.alns.find(aln => aln.id === name)?.seq || ''
  }

  getWidth() {
    return this.MSA.alns[0].seq.length
  }

  getRowData() {
    return undefined
  }

  getHeader() {
    return this.MSA.header
  }

  getNames() {
    return this.MSA.alns.map(aln => aln.id)
  }

  getStructures() {
    return {}
  }

  get alignmentNames() {
    return []
  }

  getTree(): NodeWithIds {
    return {
      id: 'root',
      name: 'root',
      noTree: true,
      branchset: this.getNames().map(name => ({
        id: name,
        name,
        branchset: [],
      })),
    }
  }

  get seqConsensus() {
    return this.MSA.consensus
  }
  get secondaryStructureConsensus() {
    return undefined
  }

  get tracks() {
    return []
  }
}
