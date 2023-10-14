import React from 'react'
import { observer } from 'mobx-react'

// locals
import { IBoxTrack, MsaViewModel } from '../model'
import BoxTrackBlock from './BoxTrackBlock'

const BoxTrack = observer(function ({
  model,
  track,
}: {
  model: MsaViewModel
  track: IBoxTrack
}) {
  const { blocksX, msaAreaWidth } = model
  const { height } = track.model
  return (
    <div
      style={{
        position: 'relative',
        height,
        width: msaAreaWidth,
        overflow: 'hidden',
      }}
    >
      {blocksX.map(bx => (
        <BoxTrackBlock track={track} key={bx} model={model} offsetX={bx} />
      ))}
    </div>
  )
})

export default BoxTrack
