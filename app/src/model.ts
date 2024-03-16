import { MSAModelF } from 'react-msaview'
import { types, Instance } from 'mobx-state-tree'

const App = types
  .model({
    msaview: MSAModelF(),
    nglSelection: types.optional(types.string, ''),
  })
  .actions(self => ({
    setNGLSelection(sel: string) {
      self.nglSelection = sel
    },
  }))

export default App
export type AppModel = Instance<typeof App>
