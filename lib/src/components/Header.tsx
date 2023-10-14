import React, { useState } from 'react'
import { IconButton, Select, Typography } from '@mui/material'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// locals
import { MsaViewModel } from '../model'
import SettingsDialog from './SettingsDlg'
import AboutDialog from './AboutDlg'
import DetailsDialog from './DetailsDlg'
import TracklistDialog from './TracklistDlg'

// icons
import FolderOpen from '@mui/icons-material/FolderOpen'
import Settings from '@mui/icons-material/Settings'
import Help from '@mui/icons-material/Help'
import Assignment from '@mui/icons-material/Assignment'
import List from '@mui/icons-material/List'
import MoreVert from '@mui/icons-material/MoreVert'
import ZoomIn from '@mui/icons-material/ZoomIn'
import ZoomOut from '@mui/icons-material/ZoomOut'

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
  const [settingsDialogViz, setSettingsDialogViz] = useState(false)
  const [aboutDialogViz, setAboutDialogViz] = useState(false)
  const [detailsDialogViz, setDetailsDialogViz] = useState(false)
  const [tracklistDialogViz, setTracklistDialogViz] = useState(false)
  const { currentAlignment, alignmentNames } = model

  return (
    <div style={{ display: 'flex' }}>
      <IconButton
        onClick={async () => {
          try {
            model.setData({ tree: '', msa: '' })
            await model.setTreeFilehandle(undefined)
            await model.setMSAFilehandle(undefined)
            model.setScrollY(0)
            model.setScrollX(0)
            model.setCurrentAlignment(0)
          } catch (e) {
            console.error(e)
            model.setError(e)
          }
        }}
      >
        <FolderOpen />
      </IconButton>
      <IconButton onClick={() => setSettingsDialogViz(true)}>
        <Settings />
      </IconButton>
      <IconButton onClick={() => setDetailsDialogViz(true)}>
        <Assignment />
      </IconButton>
      <IconButton onClick={() => setTracklistDialogViz(true)}>
        <List />
      </IconButton>
      {settingsDialogViz ? (
        <SettingsDialog
          open
          model={model}
          onClose={() => setSettingsDialogViz(false)}
        />
      ) : null}
      {aboutDialogViz ? (
        <AboutDialog open onClose={() => setAboutDialogViz(false)} />
      ) : null}
      {detailsDialogViz ? (
        <DetailsDialog
          open
          model={model}
          onClose={() => setDetailsDialogViz(false)}
        />
      ) : null}

      {tracklistDialogViz ? (
        <TracklistDialog
          open
          model={model}
          onClose={() => setTracklistDialogViz(false)}
        />
      ) : null}
      {alignmentNames.length > 0 ? (
        <Select
          native
          value={currentAlignment}
          size="small"
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
      <IconButton
        onClick={() => {
          model.setColWidth(Math.ceil(model.colWidth * 1.5))
          model.setRowHeight(Math.ceil(model.rowHeight * 1.5))
        }}
      >
        <ZoomIn />
      </IconButton>
      <IconButton
        onClick={() => {
          model.setColWidth(Math.max(1, Math.floor(model.colWidth * 0.75)))
          model.setRowHeight(Math.max(1, Math.floor(model.rowHeight * 0.75)))
        }}
      >
        <ZoomOut />
      </IconButton>
      <CascadingMenuButton
        menuItems={[
          {
            label: 'Decrease row height',
            onClick: () =>
              model.setRowHeight(Math.max(1, model.rowHeight * 0.75)),
          },
          {
            label: 'Increase row height',
            onClick: () => model.setRowHeight(model.rowHeight * 1.5),
          },
          {
            label: 'Decrease col width',
            onClick: () =>
              model.setColWidth(Math.max(1, model.colWidth * 0.75)),
          },
          {
            label: 'Increase col width',
            onClick: () => model.setColWidth(model.colWidth * 1.5),
          },
        ]}
      >
        <MoreVert />
      </CascadingMenuButton>
      <InfoArea model={model} />
      <div style={{ flex: 1 }} />
      <IconButton onClick={() => setAboutDialogViz(true)}>
        <Help />
      </IconButton>
    </div>
  )
})

export default Header
