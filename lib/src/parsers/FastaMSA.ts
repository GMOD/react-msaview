import { NodeWithIds } from '../util'

function parseSmallFasta(text: string) {
  return text
    .split('>')
    .filter(t => /\S/.test(t))
    .map(entryText => {
      const [defLine, ...seqLines] = entryText.split('\n')
      const [id, ...description] = defLine.split(' ')
      const descriptionStr = description.join(' ')
      const seqLinesStr = seqLines.join('')
      const sequence = seqLinesStr.replaceAll(/\s/g, '')
      return { id, description: descriptionStr, sequence }
    })
}
export default class FastaMSA {
  private MSA: { seqdata: Record<string, string> }
  constructor(text: string) {
    this.MSA = {
      seqdata: Object.fromEntries(
        parseSmallFasta(text).map(m => [`${m.id}`, m.sequence]),
      ),
    }
  }

  getMSA() {
    return this.MSA
  }

  getRowData() {
    return undefined
  }

  getNames() {
    return Object.keys(this.MSA.seqdata)
  }

  getRow(name: string) {
    return this.MSA?.seqdata[name]?.split('')
  }

  getWidth() {
    const name = Object.keys(this.MSA?.seqdata)[0]
    return this.getRow(name).length
  }

  getStructures() {
    return {}
  }

  get alignmentNames() {
    return []
  }

  getHeader() {
    return {}
  }

  getTree(): NodeWithIds {
    return {
      id: 'root',
      name: 'root',
      noTree: true,
      branchset: this.getNames().map(name => ({
        id: name,
        branchset: [],
        name,
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
