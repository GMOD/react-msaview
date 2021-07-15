import RBush from 'rbush'

export default class Layout {
  public rectangles: Map<
    string,
    {
      minY: number
      maxY: number
      minX: number
      maxX: number
      id: string
      data: any
    }
  >

  public maxHeightReached: boolean

  private maxHeight: number

  private rbush: RBush<{ id: string }>

  private pTotalHeight: number

  constructor({
    maxHeight = 10000,
  }: {
    maxHeight?: number
  } = {}) {
    this.maxHeightReached = false
    this.rbush = new RBush()
    this.rectangles = new Map()
    this.maxHeight = Math.ceil(maxHeight)
    this.pTotalHeight = 0 // total height, in units of bitmap squares (px/pitchY)
  }

  /**
   * @returns top position for the rect, or Null if laying
   *  out the rect would exceed maxHeighe
   */
  addRect(
    id: string,
    left: number,
    right: number,
    height: number,
    data: any,
  ): number | null {
    // add to rbush
    const existingRecord = this.rectangles.get(id)
    if (existingRecord) {
      return existingRecord.minY
    }

    let currHeight = 0
    while (
      this.rbush.collides({
        minX: left,
        minY: currHeight,
        maxX: right,
        maxY: currHeight + height,
      }) &&
      currHeight <= this.maxHeight
    ) {
      currHeight += 1
    }

    const record = {
      minX: left,
      minY: currHeight,
      maxX: right,
      maxY: currHeight + height,
      id,
      data,
    }
    this.rbush.insert(record)
    this.rectangles.set(id, record)
    this.pTotalHeight = Math.max(this.pTotalHeight, currHeight)
    return currHeight
  }

  hasSeen(id: string): boolean {
    return this.rectangles.has(id)
  }

  getByCoord(x: number, y: number) {
    const rect = { minX: x, minY: y, maxX: x + 1, maxY: y + 1 }
    return this.rbush.collides(rect)
      ? this.rbush.search(rect)[0].name
      : undefined
  }

  getByID(id: string) {
    const rect = this.rectangles.get(id)
    if (rect) {
      const { minX, maxX, minY, maxY } = rect
      return [minX, minY, maxX, maxY]
    }

    return undefined
  }

  get totalHeight() {
    return this.pTotalHeight
  }
}
