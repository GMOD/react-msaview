import { useState } from 'react'
import { observer } from 'mobx-react'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'
import { ErrorMessage } from '@jbrowse/core/ui'

import useSWR from 'swr'

import ReactMSAView from './ReactMSAView'
import Button from './Button'
import { ungzip } from 'pako'

async function textfetch(url: string, arg?: RequestInit) {
  const res = await fetch(url, arg)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${await res.text()}`)
  }
  return ungzip(await res.arrayBuffer(), { to: 'string' })
}

async function fetcher(url: string) {
  return url
    ? {
        msa: await textfetch(
          `https://jbrowse.org/demos/treefam_family_data/${url}.aln.emf.gz`,
        ),
        tree: await textfetch(
          `https://jbrowse.org/demos/treefam_family_data/${url}.nh.emf.gz`,
        ),
      }
    : undefined
}

const App = observer(function () {
  const [val, setVal] = useState('')
  const [treeFamId, setTreeFamId] = useState('')
  const { data, isLoading, error } = useSWR(treeFamId, fetcher)

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
        <ErrorMessage error={error} />
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
