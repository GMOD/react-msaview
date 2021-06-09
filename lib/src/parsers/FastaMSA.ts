type StrMap = { [key: string]: string }
export default class FastaMSA {
  private MSA: { seqdata: { [key: string]: string } }
  constructor(text: string) {
    const seq: StrMap = {}
    let name = ''
    const re = /^>(\S+)/
    text.split('\n').forEach((line) => {
      const match = re.exec(line)
      if (match) {
        seq[(name = match[1])] = ''
      } else if (name) {
        seq[name] = seq[name] + line.replace(/[ \t]/g, '')
      }
    })
    this.MSA = { seqdata: seq }
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
      branchset: this.getNames().map((name) => ({
        id: name,
        name,
      })),
    }
  }
}
