import { parse } from 'emf-js'
import type { NodeWithIds } from '../util'

export default class EmfMSA {
  private MSA: ReturnType<typeof parse>

  constructor(text: string) {
    this.MSA = parse(text)
  }

  getMSA() {
    return this.MSA
  }

  getRow(name: string): string {
    return this.MSA.find(aln => aln.species === name)?.seq || ''
  }

  getWidth() {
    return this.MSA[0]!.seq.length
  }

  getRowData() {
    return undefined
  }

  getHeader() {
    return ''
  }

  getNames() {
    return this.MSA.map(aln => aln.species)
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
    return undefined
  }
  get secondaryStructureConsensus() {
    return undefined
  }

  get tracks() {
    return []
  }
}
