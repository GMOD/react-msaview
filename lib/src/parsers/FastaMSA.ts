function parseSmallFasta(text: string) {
  return text
    .split('>')
    .filter(t => /\S/.test(t))
    .map(entryText => {
      const [defLine, ...seqLines] = entryText.split('\n')
      const [id, ...description] = defLine.split(' ')
      const descriptionStr = description.join(' ')
      const seqLinesStr = seqLines.join('')
      const sequence = seqLinesStr.replace(/\s/g, '')
      return { id, description: descriptionStr, sequence }
    })
}
export default class FastaMSA {
  private MSA: { seqdata: { [key: string]: string } }
  constructor(text: string) {
    this.MSA = {
      seqdata: Object.fromEntries(
        parseSmallFasta(text).map((m, i) => [`${m.id}-${i}`, m.sequence]),
      ),
    }
  }

  getMSA() {
    return this.MSA
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

  getDetails() {
    return {}
  }

  getTree() {
    return {
      id: 'root',
      noTree: true,
      branchset: this.getNames().map(name => ({
        id: name,
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
