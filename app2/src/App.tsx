import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { isAlive, onSnapshot } from 'mobx-state-tree'
import { MSAView } from 'react-msaview'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'
import useMeasure from '@jbrowse/core/util/useMeasure'

// locals
import AppGlobal, { AppModel } from './model'

const urlParams = new URLSearchParams(window.location.search)
const val = urlParams.get('data')

const mymodel = AppGlobal.create(
  val
    ? JSON.parse(val)
    : {
        msaview: {
          type: 'MsaView',
        },
      },
)

let lastTime = 0
onSnapshot(mymodel, snap => {
  const now = Date.now()
  if (now - lastTime >= 1000) {
    lastTime = now
    const url = new URL(window.document.URL)
    url.searchParams.set('data', JSON.stringify(snap))
    window.history.replaceState(null, '', url.toString())
  }
})

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

// used in ViewContainer files to get the width
function useWidthSetter(view: { setWidth: (arg: number) => void }) {
  const [ref, { width }] = useMeasure()
  useEffect(() => {
    if (width && isAlive(view)) {
      // sets after a requestAnimationFrame
      // https://stackoverflow.com/a/58701523/2129219 avoids ResizeObserver
      // loop error being shown during development
      requestAnimationFrame(() => {
        view.setWidth(width)
      })
    }
  }, [view, width])
  return ref
}

async function timeout(ms: number) {
  await new Promise(res => setTimeout(res, ms))
}

const App = observer(function () {
  const [sequence, setSequence] = useState('')

  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState(false)

  return (
    <div>
      <form
        onSubmit={event => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          ;(async () => {
            try {
              setError(undefined)
              setLoading(true)
              event.preventDefault()

              const res = await textfetch(
                'https://api.esmatlas.com/foldSequence/v1/pdb/',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: sequence,
                },
              )

              const { id } = await jsonfetch(
                'https://search.foldseek.com/api/ticket',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    q: res,
                    mode: '3diaa',
                    email: 'colin.diesh@gmail.com',
                    'database[]': ['pdb100'].toString(),
                  }),
                },
              )

              while (true) {
                const data = await jsonfetch(
                  `https://search.foldseek.com/api/ticket/${id}`,
                )
                const { status } = data

                if (status === 'ERROR') {
                  throw new Error('Received ERROR from foldseek API')
                } else if (status === 'RUNNING' || status === 'PENDING') {
                  await timeout(1000)
                } else if (status === 'COMPLETE') {
                  console.log({ data })
                  break
                } else {
                  throw new Error(`Unknown status ${status}`)
                }
              }
              const result = await jsonfetch(
                `https://search.foldseek.com/api/result/${id}/0`,
              )
              console.log({ result })
            } catch (e) {
              console.error(e)
              setError(e)
            } finally {
              setLoading(false)
            }
          })()
        }}
      >
        {error ? <div style={{ color: 'red' }}>{`${error}`}</div> : null}
        {loading ? <div>Loading...</div> : null}
        <div>
          <label htmlFor="query">Enter sequence:</label>
        </div>
        <textarea
          id="query"
          cols={80}
          rows={20}
          value={sequence}
          onChange={event => {
            setSequence(event.target.value)
          }}
        />
        <div>
          <button
            type="button"
            onClick={() => {
              setSequence('>FASTA\nMPKIIEAIYENGVFKPLQKVDLKEGE')
            }}
          >
            Example
          </button>
          <button disabled={loading} type="submit">
            Submit
          </button>
        </div>
      </form>
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
