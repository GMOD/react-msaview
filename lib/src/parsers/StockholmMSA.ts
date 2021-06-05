import Stockholm from 'stockholm-js'
import parseNewick from '../parseNewick'

import { generateNodeIds } from '../util'
type StockholmEntry = {
  gf: {
    DE?: string[]
    NH?: string[]
  }
  seqdata: { [key: string]: string }
}

export default class StockholmMSA {
  private data: StockholmEntry[]
  private MSA: StockholmEntry

  constructor(text: string, currentAlignment: number) {
    const res = Stockholm.parseAll(text)
    this.data = res
    this.MSA = res[currentAlignment]
  }

  getMSA() {
    return this.MSA
  }

  getRow(name: string) {
    return this.MSA?.seqdata[name]?.split('')
  }

  getWidth() {
    const name = Object.keys(this.MSA?.seqdata)[0]
    return this.getRow(name).length
  }

  get alignmentNames() {
    return this.data.map(
      (aln, index) => aln.gf.DE?.[0] || `Alignment ${index + 1}`,
    )
  }

  getDetails() {
    return this.MSA.gf
  }

  getNames() {
    return Object.keys(this.MSA.seqdata)
  }

  getTree() {
    const tree = this.MSA?.gf?.NH?.[0]
    return tree
      ? generateNodeIds(parseNewick(tree))
      : {
          id: 'root',
          noTree: true,
          branchset: this.getNames().map((name) => ({
            id: name,
            name,
          })),
        }
  }
}
