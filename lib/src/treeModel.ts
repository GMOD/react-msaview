import { types } from 'mobx-state-tree'

/**
 * #stateModel Tree
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

export const Tree = types
  .model({
    /**
     * #property
     * right-align the labels
     */
    labelsAlignRight: false,

    /**
     * #property
     * width of the area the tree is drawn in, px
     */
    treeAreaWidth: types.optional(types.number, 400),

    /**
     * #property
     * width of the tree within the treeArea, px
     */
    treeWidth: types.optional(types.number, 300),

    /**
     * #getter
     * synchronization that matches treeWidth to treeAreaWidth
     */
    treeWidthMatchesArea: true,

    /**
     * #property
     * use "branch length" e.g. evolutionary distance to draw tree branch
     * lengths. if false, the layout is a "cladogram" that does not take into
     * account evolutionary distances
     */
    showBranchLen: true,

    /**
     * #property
     * draw tree, boolean
     */
    drawTree: true,

    /**
     * #property
     * draw clickable node bubbles on the tree
     */
    drawNodeBubbles: true,
  })
  .actions(self => ({
    /**
     * #action
     * synchronize the treewidth and treeareawidth
     */
    setTreeWidthMatchesArea(arg: boolean) {
      self.treeWidthMatchesArea = arg
    },

    /**
     * #action
     * set tree area width (px)
     */
    setTreeAreaWidth(n: number) {
      self.treeAreaWidth = n
    },
    /**
     * #action
     * set tree width (px)
     */
    setTreeWidth(n: number) {
      self.treeWidth = n
    },

    /**
     * #action
     */
    setLabelsAlignRight(arg: boolean) {
      self.labelsAlignRight = arg
    },
    /**
     * #action
     */
    setDrawTree(arg: boolean) {
      self.drawTree = arg
    },

    /**
     * #action
     */
    setShowBranchLen(arg: boolean) {
      self.showBranchLen = arg
    },

    /**
     * #action
     */
    setDrawNodeBubbles(arg: boolean) {
      self.drawNodeBubbles = arg
    },
  }))
