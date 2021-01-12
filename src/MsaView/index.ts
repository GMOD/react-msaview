import modelFactory from './model'
import ReactComponentFactory from './components/MsaView'

export default ({ jbrequire }: { jbrequire: Function }) => {
  const ViewType = jbrequire('@jbrowse/core/pluggableElementTypes/ViewType')
  return new ViewType({
    name: 'MsaView',
    stateModel: jbrequire(modelFactory),
    ReactComponent: jbrequire(ReactComponentFactory),
  })
}
