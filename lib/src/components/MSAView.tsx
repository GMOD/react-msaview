import React from 'react'

import { MsaViewModel } from '../model'
import { observer } from 'mobx-react'
import { Typography } from '@material-ui/core'

import ImportForm from './ImportForm'
import TreeCanvas from './TreeCanvas'
import MSACanvas from './MSACanvas'
import Header from './Header'
export default observer(({ model }: { model: MsaViewModel }) => {
  const { done, initialized } = model
  const [mouseDown, setMouseDown] = useState(false);
  useEffect(() => {
    if (mouseDown) {
      const listener = (event: MouseEvent) => {
        model.setTreeWidth(model.treeAreaWidth + event.movementX);
      };
      const listener2 = () => {
        setMouseDown(false);
      };
      document.addEventListener('mousemove', listener);
      document.addEventListener('mouseup', listener2);
      return () => {
        document.removeEventListener('mousemove', listener);
        document.removeEventListener('mouseup', listener2);
      };
    }
    return () => {};
  }, [mouseDown]);

  if (!initialized) {
    return <ImportForm model={model} />
  } else if (!done) {
    return <Typography variant="h4">Loading...</Typography>
  } else {
    const { height } = model

    return (
      <div style={{ height, overflow: 'hidden' }}>
        <Header model={model} />
        <div
          style={{
            position: 'relative',
            display: 'flex',
          }}
        >
          <TreeCanvas model={model} />
          <div
            onMouseDown={() => {
              setMouseDown(true);
            }}
            style={{
              cursor: 'ew-resize',
              border: '1px solid rgba(100,100,100,0.5)',
            }}
          />
          <MSACanvas model={model} />
        </div>
      </div>
    )
  }
})
