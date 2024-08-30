import { MSAModelF } from 'react-msaview'
import { types, Instance } from 'mobx-state-tree'

const App = types.model({
  msaview: MSAModelF(),
})

export default App
export type AppModel = Instance<typeof App>
