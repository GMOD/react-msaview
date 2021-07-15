import React, { useState } from 'react'
import { IconButton, Select, Typography } from '@material-ui/core'
import { MsaViewModel } from '../model'
import { observer } from 'mobx-react'

import SettingsDialog from './SettingsDlg'
import AboutDialog from './AboutDlg'
import DetailsDialog from './DetailsDlg'
import AddTrackDialog from './AddTrackDlg'

//icons
import AddIcon from '@material-ui/icons/Add'
import FolderOpenIcon from '@material-ui/icons/FolderOpen'
import SettingsIcon from '@material-ui/icons/Settings'
import HelpIcon from '@material-ui/icons/Help'
import AssignmentIcon from '@material-ui/icons/Assignment'

const InfoArea = observer(({ model }: { model: MsaViewModel }) => {
  const { mouseOverRowName, mouseCol } = model
  return (
    <div>
      <Typography display="inline">Row name: {mouseOverRowName}</Typography>
      <span style={{ marginLeft: 10 }} />
      <Typography display="inline">Position: {mouseCol}</Typography>
    </div>
  )
})

const Header = observer(({ model }: { model: MsaViewModel }) => {
  const [addTrackDialogVisible, setAddTrackDialogVisible] = useState(false)
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false)
  const [aboutDialogVisible, setAboutDialogVisible] = useState(false)
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false)
  const { currentAlignment, alignmentNames } = model

  return (
    <div style={{ display: 'flex' }}>
      <IconButton
        onClick={() => {
          model.setData({ tree: '', msa: '' })
          model.setTreeFilehandle(undefined)
          model.setMSAFilehandle(undefined)
          model.setScrollY(0)
          model.setScrollX(0)
          model.setCurrentAlignment(0)
        }}
      >
        <FolderOpenIcon />
      </IconButton>
      <IconButton onClick={() => setSettingsDialogVisible(true)}>
        <SettingsIcon />
      </IconButton>

      <IconButton onClick={() => setDetailsDialogVisible(true)}>
        <AssignmentIcon />
      </IconButton>

      <IconButton onClick={() => setAddTrackDialogVisible(true)}>
        <AddIcon />
      </IconButton>

      {settingsDialogVisible ? (
        <SettingsDialog
          open
          model={model}
          onClose={() => setSettingsDialogVisible(false)}
        />
      ) : null}

      {aboutDialogVisible ? (
        <AboutDialog open onClose={() => setAboutDialogVisible(false)} />
      ) : null}

      {detailsDialogVisible ? (
        <DetailsDialog
          open
          model={model}
          onClose={() => setDetailsDialogVisible(false)}
        />
      ) : null}

      {addTrackDialogVisible ? (
        <AddTrackDialog
          open
          model={model}
          onClose={() => setAddTrackDialogVisible(false)}
        />
      ) : null}

      {alignmentNames.length > 0 ? (
        <Select
          native
          value={currentAlignment}
          onChange={event => {
            model.setCurrentAlignment(+(event.target.value as string))
            model.setScrollX(0)
            model.setScrollY(0)
          }}
        >
          {alignmentNames.map((option, index) => (
            <option key={`${option}-${index}`} value={index}>
              {option}
            </option>
          ))}
        </Select>
      ) : null}

      <InfoArea model={model} />

      <div style={{ flex: 1 }} />
      <IconButton onClick={() => setAboutDialogVisible(true)}>
        <HelpIcon />
      </IconButton>
    </div>
  )
})

export default Header
