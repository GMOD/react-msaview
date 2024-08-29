import { useState } from 'react'
import { observer } from 'mobx-react'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'

import useSWR from 'swr'
import ReactMSAView from './ReactMSAView'

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
  return textfetch(`${url}.aln.emf`)
}

const App = observer(function () {
  const [val, setVal] = useState('')
  const [treeFamId, setTreeFamId] = useState('')
  const { data, isLoading, error } = useSWR(
    `./treefam_family_data/${treeFamId}`,
    fetcher,
  )
  console.log({ data, isLoading, error })

  return (
    <div>
      {error ? (
        <div style={{ color: 'red' }}>{`${error}`}</div>
      ) : isLoading ? (
        <div>Loading...</div>
      ) : data ? (
        <ReactMSAView data={data} />
      ) : null}
      <div>
        <label htmlFor="query">Enter TreeFam ID:</label>
        <input
          id="query"
          type="text"
          value={val}
          onChange={event => {
            setVal(event.target.value)
          }}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => {
            setVal('TF105041')
          }}
        >
          Example
        </button>
        <button
          type="button"
          onClick={() => {
            setTreeFamId(val)
          }}
        >
          Submit
        </button>
      </div>
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
