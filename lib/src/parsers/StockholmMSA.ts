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
  gc?: {
    SS_cons?: string
    seq_cons?: string
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
    return {
      General: this.MSA.gf,
      Accessions: this.MSA.gs?.AC,
      Dbxref: this.MSA.gs?.DR,
    }
  }

  getRowDetails(rowName: string) {
    return {
      name: rowName,
      accession: this.MSA.gs?.AC[rowName],
      dbxref: this.MSA.gs?.DR[rowName],
    }
  }

  getNames() {
    return Object.keys(this.MSA.seqdata)
  }

  getSeqCoords() {}

  getStructures() {
    const pdbRegex = /PDB; +(\S+) +(\S); ([0-9]+)-([0-9]+)/
    const ent = this.MSA
    return Object.entries(ent.gs?.DR || {})
      .map(([id, dr]) => [id, pdbRegex.exec(dr)])
      .filter((item): item is [string, RegExpExecArray] => !!item[1])
      .map(([id, match]: [string, RegExpExecArray]) => {
        const pdb = match[1].toLowerCase()
        const chain = match[2]
        const startPos = +match[3]
        const endPos = +match[4]
        return { id, pdb, chain, startPos, endPos }
      })
      .reduce((a, b) => {
        const { id, ...rest } = b
        if (!a[id]) {
          a[id] = []
        }
        a[id].push(rest)
        return a
      }, {} as Record<string, { pdb: string; chain: string; startPos: number; endPos: number }[]>)
  }

  getTree() {
    const tree = this.MSA?.gf?.NH?.[0]
    return tree
      ? generateNodeIds(parseNewick(tree))
      : {
          id: 'root',
          noTree: true,
          branchset: this.getNames().map(name => ({
            id: name,
            name,
          })),
        }
  }

  get seqConsensus() {
    return this.MSA.gc?.seq_cons
  }
  get secondaryStructureConsensus() {
    return this.MSA.gc?.SS_cons
  }

  get tracks() {
    return [
      {
        id: 'seqConsensus',
        name: 'Sequence consensus',
        data: this.seqConsensus,
        customColorScheme: {},
      },
      {
        id: 'secondaryStruct',
        name: 'Secondary-structure',
        data: this.secondaryStructureConsensus,
        customColorScheme: {
          '>': 'pink',
          '<': 'lightblue',
        },
      },
    ]
  }
}
