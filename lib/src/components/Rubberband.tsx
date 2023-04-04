import React, { useRef, useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'
import { Popover, Tooltip, Typography, alpha } from '@mui/material'
import { Menu } from '@jbrowse/core/ui'

// icons
import AssignmentIcon from '@mui/icons-material/Assignment'

const useStyles = makeStyles()(theme => {
  const background =
    'tertiary' in theme.palette && theme.palette.tertiary
      ? alpha(theme.palette.tertiary.main, 0.7)
      : alpha(theme.palette.primary.main, 0.7)
  return {
    rubberband: {
      height: '100%',
      background,
      position: 'absolute',
      zIndex: 10,
      textAlign: 'center',
      overflow: 'hidden',
    },
    rubberbandControl: {
      cursor: 'crosshair',
      width: '100%',
      minHeight: 8,
    },
    rubberbandText: {
      color: theme.palette.tertiary
        ? theme.palette.tertiary.contrastText
        : theme.palette.primary.contrastText,
    },
    popover: {
      mouseEvents: 'none',
      cursor: 'crosshair',
    },
    paper: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
    guide: {
      pointerEvents: 'none',
      height: '100%',
      width: 1,
      position: 'absolute',
      zIndex: 10,
    },
  }
})

const VerticalGuide = observer(function ({
  model,
  coordX,
}: {
  model: any
  coordX: number
}) {
  const { treeAreaWidth } = model
  const { classes } = useStyles()
  return (
    <>
      <Tooltip open placement="top" title={`${model.pxToBp(coordX) + 1}`} arrow>
        <div
          style={{
            left: coordX + treeAreaWidth,
            position: 'absolute',
            height: 1,
          }}
        />
      </Tooltip>
      <div
        className={classes.guide}
        style={{
          left: coordX + treeAreaWidth,
          background: 'red',
        }}
      />
    </>
  )
})

function Rubberband({
  model,
  ControlComponent = <div />,
}: {
  model: any
  ControlComponent?: React.ReactElement
}) {
  const { treeAreaWidth } = model
  const [startX, setStartX] = useState<number>()
  const [currentX, setCurrentX] = useState<number>()

  // clientX and clientY used for anchorPosition for menu
  // offsetX used for calculations about width of selection
  const [anchorPosition, setAnchorPosition] = useState<{
    offsetX: number
    clientX: number
    clientY: number
  }>()
  const [guideX, setGuideX] = useState<number | undefined>()
  const controlsRef = useRef<HTMLDivElement>(null)
  const rubberbandRef = useRef(null)
  const { classes } = useStyles()
  const mouseDragging = startX !== undefined && anchorPosition === undefined

  useEffect(() => {
    function globalMouseMove(event: MouseEvent) {
      if (controlsRef.current && mouseDragging) {
        const relativeX =
          event.clientX - controlsRef.current.getBoundingClientRect().left
        setCurrentX(relativeX)
      }
    }

    function globalMouseUp(event: MouseEvent) {
      if (startX !== undefined && controlsRef.current) {
        const { clientX, clientY } = event
        const ref = controlsRef.current
        const offsetX = clientX - ref.getBoundingClientRect().left
        // as stated above, store both clientX/Y and offsetX for different
        // purposes
        setAnchorPosition({
          offsetX,
          clientX,
          clientY,
        })
        setGuideX(undefined)
      }
    }
    if (mouseDragging) {
      window.addEventListener('mousemove', globalMouseMove)
      window.addEventListener('mouseup', globalMouseUp)
      return () => {
        window.removeEventListener('mousemove', globalMouseMove)
        window.removeEventListener('mouseup', globalMouseUp)
      }
    }
    return () => {}
  }, [startX, mouseDragging, anchorPosition])

  useEffect(() => {
    if (
      !mouseDragging &&
      currentX !== undefined &&
      startX !== undefined &&
      Math.abs(currentX - startX) <= 3
    ) {
      handleClose()
    }
  }, [mouseDragging, currentX, startX, model.colWidth])

  function mouseDown(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    const relativeX =
      event.clientX -
      (event.target as HTMLDivElement).getBoundingClientRect().left
    setStartX(relativeX)
    setCurrentX(relativeX)
  }

  function mouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLDivElement
    setGuideX(event.clientX - target.getBoundingClientRect().left)
  }

  function mouseOut() {
    setGuideX(undefined)
    model.clearAnnotPos()
  }

  function handleClose() {
    setAnchorPosition(undefined)
    setStartX(undefined)
    setCurrentX(undefined)
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  function handleMenuItemClick(_: unknown, callback: Function) {
    callback()
    handleClose()
  }

  if (startX === undefined) {
    return (
      <>
        {guideX !== undefined ? (
          <VerticalGuide model={model} coordX={guideX} />
        ) : null}
        <div
          data-testid="rubberband_controls"
          className={classes.rubberbandControl}
          role="presentation"
          ref={controlsRef}
          onMouseDown={mouseDown}
          onMouseOut={mouseOut}
          onMouseMove={mouseMove}
        >
          {ControlComponent}
        </div>
      </>
    )
  }

  const right = anchorPosition ? anchorPosition.offsetX : currentX || 0
  const left = right < startX ? right : startX
  const width = Math.abs(right - startX)
  const leftBpOffset = model.pxToBp(left)
  const rightBpOffset = model.pxToBp(left + width)
  const numOfBpSelected = Math.ceil(width / model.colWidth)

  const menuItems = [
    {
      label: 'Create annotation',
      icon: AssignmentIcon,
      onClick: () => {
        model.setOffsets(leftBpOffset, rightBpOffset)
        handleClose()
      },
    },
  ]
  return (
    <>
      {rubberbandRef.current ? (
        <>
          <Popover
            className={classes.popover}
            classes={{
              paper: classes.paper,
            }}
            open
            anchorEl={rubberbandRef.current}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            disableRestoreFocus
          >
            <Typography>{leftBpOffset + 1}</Typography>
          </Popover>
          <Popover
            className={classes.popover}
            classes={{
              paper: classes.paper,
            }}
            open
            anchorEl={rubberbandRef.current}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            disableRestoreFocus
          >
            <Typography>{rightBpOffset + 1}</Typography>
          </Popover>
        </>
      ) : null}
      <div
        ref={rubberbandRef}
        className={classes.rubberband}
        style={{ left: left + treeAreaWidth, width }}
      >
        <Typography variant="h6" className={classes.rubberbandText}>
          {numOfBpSelected.toLocaleString('en-US')} bp
        </Typography>
      </div>
      <div
        data-testid="rubberband_controls"
        className={classes.rubberbandControl}
        role="presentation"
        ref={controlsRef}
        onMouseDown={mouseDown}
        onMouseOut={mouseOut}
        onMouseMove={mouseMove}
      >
        {ControlComponent}
      </div>
      {anchorPosition ? (
        <Menu
          anchorReference="anchorPosition"
          anchorPosition={{
            left: anchorPosition.clientX,
            top: anchorPosition.clientY,
          }}
          onMenuItemClick={handleMenuItemClick}
          open={Boolean(anchorPosition)}
          onClose={handleClose}
          menuItems={menuItems}
        />
      ) : null}
    </>
  )
}
export default observer(Rubberband)
