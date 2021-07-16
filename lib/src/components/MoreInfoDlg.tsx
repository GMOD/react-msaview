import React from 'react'
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core'
import { observer } from 'mobx-react'
import { Attributes } from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'

export default observer(
  ({ info, onClose }: { info: any; onClose: () => void }) => {
    return (
      <Dialog onClose={() => onClose()} open>
        <DialogTitle>Metadata</DialogTitle>
        <DialogContent>
          <Attributes attributes={info} />
        </DialogContent>
      </Dialog>
    )
  },
)
