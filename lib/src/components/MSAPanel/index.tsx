import React from 'react'
import MSACanvas from './MSACanvas'
import MSAMouseoverCanvas from './MSAMouseoverCanvas'
import { MsaViewModel } from '../../model'

export default function MSAPanel({ model }: { model: MsaViewModel }) {
  return (
    <>
      <MSACanvas model={model} />
      <MSAMouseoverCanvas model={model} />
    </>
  )
}
