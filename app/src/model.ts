import { types } from 'mobx-state-tree'
import { MSAModelF } from 'react-msaview'

import type { Instance } from 'mobx-state-tree'

const App = types.model({
  msaview: MSAModelF(),
})

export default App
export type AppModel = Instance<typeof App>
