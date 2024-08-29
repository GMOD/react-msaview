import { useState } from 'react'
import { observer } from 'mobx-react'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'

import useSWR from 'swr'
import ReactMSAView from './ReactMSAView'
import Button from './Button'

async function jsonfetch(url: string, arg?: RequestInit) {
  const res = await fetch(url, arg)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${await res.text()}`)
  }

  return res.json()
}

async function textfetch(url: string, arg?: RequestInit) {
  const res = await fetch(url, arg)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${await res.text()}`)
  }

  return res.text()
}

async function fetcher(url: string) {
  return {
    msa: await textfetch(`${url}.aln.emf`),
    tree: await textfetch(`${url}.nh.emf`),
  }
}

const App = observer(function () {
  const [val, setVal] = useState('')
  const [treeFamId, setTreeFamId] = useState('')
  const { data, isLoading, error } = useSWR(
    `./treefam_family_data/${treeFamId}`,
    fetcher,
  )

  return (
    <div>
      <div className="m-2 p-2">
        <label htmlFor="query">Enter TreeFam ID:</label>
        <input
          id="query"
          className="bg-gray-200 shadow border rounded"
          type="text"
          value={val}
          onChange={event => {
            setVal(event.target.value)
          }}
        />

        <Button
          onClick={() => {
            setVal('TF105041')
            setTreeFamId('TF105041')
          }}
        >
          Example
        </Button>
        <Button
          onClick={() => {
            setTreeFamId(val)
          }}
        >
          Submit
        </Button>
      </div>
      {error ? (
        <div style={{ color: 'red' }}>{`${error}`}</div>
      ) : isLoading ? (
        <div>Loading...</div>
      ) : data ? (
        <ReactMSAView msa={data.msa} tree={data.tree} />
      ) : null}
    </div>
  )
})

const MainApp = () => {
  const theme = createJBrowseTheme()
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  )
}

export default MainApp
