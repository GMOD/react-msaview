import { parseEmfTree } from 'emf-js'

export default class EmfTree {
  data: ReturnType<typeof parseEmfTree>

  constructor(text: string) {
    this.data = parseEmfTree(text)
  }
}
