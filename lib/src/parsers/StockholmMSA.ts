import Stockholm from 'stockholm-js'
import parseNewick from '../parseNewick'

import { generateNodeIds } from '../util'
type StockholmEntry = {
  gf: {
    DE?: string[]
    NH?: string[]
  }
  gs: {
    AC: Record<string, string>
    DR: Record<string, string>
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

  getSeqCoords() {}

  getStructures() {
    /* PFAM format for embedding PDB IDs in Stockholm files */
    const pdbRegex = /PDB; +(\S+) +(\S); ([0-9]+)-([0-9]+)/
    const ent = this.MSA
    const vals = Object.values(ent.gs.DR)
      .map((dr) => pdbRegex.exec(dr))
      .filter((f) => !!f)
      .map((match) => {
        const pdb = match[1].toLowerCase()
        const chain = match[2]
        const startPos = +match[3]
        const endPos = +match[4]
        return { pdb, chain, startPos, endPos }
      })
    console.log({ vals })
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
