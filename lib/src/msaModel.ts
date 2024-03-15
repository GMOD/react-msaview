import { types } from 'mobx-state-tree'

/**
 * #stateModel MSA
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

export const MSA = types
  .model({
    /**
     * #property
     * draw MSA tiles with a background color
     */
    bgColor: true,

    /**
     * #property
     * default color scheme name
     */
    colorSchemeName: 'maeditor',
  })
  .actions(self => ({
    /**
     * #action
     * set color scheme name
     */
    setColorSchemeName(name: string) {
      self.colorSchemeName = name
    },

    /**
     * #action
     */
    setBgColor(arg: boolean) {
      self.bgColor = arg
    },
  }))
