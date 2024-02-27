import { MSAModel } from 'react-msaview'
import { types, Instance, addDisposer } from 'mobx-state-tree'
import TimeTraveller from '@jbrowse/core/util/TimeTraveller'
import { autorun } from 'mobx'

const App = types
  .model({
    /**
     * #property
     */
    msaview: MSAModel,
    /**
     * #property
     */
    nglSelection: types.optional(types.string, ''),
    /**
     * #property
     */
    history: types.optional(TimeTraveller, { targetPath: '../msaview' }),
  })
  .actions(self => ({
    /**
     * #action
     */
    setNGLSelection(sel: string) {
      self.nglSelection = sel
    },
  }))
  .actions(self => ({
    // similar to HistoryManagementMixin in @jbrowse/app-core
    afterCreate() {
      document.addEventListener('keydown', e => {
        if (
          self.history.canRedo &&
          // ctrl+shift+z or cmd+shift+z
          (((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ') ||
            // ctrl+y
            (e.ctrlKey && !e.shiftKey && e.code === 'KeyY')) &&
          document.activeElement?.tagName.toUpperCase() !== 'INPUT'
        ) {
          self.history.redo()
        }
        if (
          self.history.canUndo &&
          // ctrl+z or cmd+z
          (e.ctrlKey || e.metaKey) &&
          !e.shiftKey &&
          e.code === 'KeyZ' &&
          document.activeElement?.tagName.toUpperCase() !== 'INPUT'
        ) {
          self.history.undo()
        }
      })
      addDisposer(
        self,
        autorun(() => {
          if (self.msaview) {
            // we use a specific initialization routine after msaview is
            // created to get it to start tracking itself sort of related
            // issue here
            // https://github.com/mobxjs/mobx-state-tree/issues/1089#issuecomment-441207911
            self.history.initialize()
          }
        }),
      )
    },
  }))

export default App
export type AppModel = Instance<typeof App>
