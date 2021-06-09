import * as Clustal from 'clustal-js'
export default class ClustalMSA {
  private MSA: {
    header: Record<string, any>
    alns: { id: string; seq: string }[]
  }

  constructor(text: string) {
    this.MSA = Clustal.parse(text)
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
}
