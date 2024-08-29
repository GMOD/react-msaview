import { useState } from 'react'
import { observer } from 'mobx-react'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'
import { ErrorMessage } from '@jbrowse/core/ui'

import useSWR from 'swr'

import ReactMSAView from './ReactMSAView'
import Button from './Button'
import Link from './Link'
import { ungzip } from 'pako'

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
async function unzipfetch(url: string, arg?: RequestInit) {
  const res = await fetch(url, arg)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${await res.text()}`)
  }
  return ungzip(await res.arrayBuffer(), { to: 'string' })
}

async function fetcher(id: string) {
  return id
    ? {
        msa: await unzipfetch(
          `https://jbrowse.org/demos/treefam_family_data/${id}.aln.emf.gz`,
        ),
        tree: await unzipfetch(
          `https://jbrowse.org/demos/treefam_family_data/${id}.nh.emf.gz`,
        ),
      }
    : undefined
}

interface TreeNode {
  children: TreeNode[]
  sequence?: {
    mol_seq: { seq: string }
    id: { accession: string }[]
  }
  taxonomy: {
    common_name: string
    scientific_name: string
  }
}

interface Row {
  id: string
  seq: string
  species: string
}

function gatherTree(tree: TreeNode, arr: Row[]) {
  if (tree.children) {
    for (const child of tree.children) {
      if (child.sequence) {
        const seq = child.sequence.mol_seq.seq
        const id = child.sequence.id[0].accession
        arr.push({
          id,
          seq,
          species: child.taxonomy.common_name || child.taxonomy.scientific_name,
        })
      }
      gatherTree(child, arr)
    }
  }
}
async function fetcher2(id: string) {
  const res = await jsonfetch(
    `https://rest.ensembl.org/genetree/id/${id}?content-type=application/json;aligned=1;sequence=pep`,
  )
  const result = [] as Row[]
  gatherTree(res.tree, result)

  return {
    tree: await textfetch(
      `https://rest.ensembl.org/genetree/id/${id}?nh_format=simple;content-type=text/x-nh`,
    ),
    msa: result.map(r => `>${r.id}\n${r.seq}`).join('\n'),
    treeMetadata: JSON.stringify(
      Object.fromEntries(result.map(r => [r.id, { genome: r.species }])),
    ),
  }
}

const App = observer(function () {
  const [val, setVal] = useState('')
  const [id, setId] = useState('')
  const [type, setType] = useState<'treeFam' | 'geneTree'>('geneTree')

  const str = type === 'treeFam' ? 'TreeFam ID' : 'GeneTree ID'
  return (
    <div>
      <div className="m-2 p-2">
        <div>
          <div className="m-2">
            <div>
              <input
                id="genetree"
                type="radio"
                checked={type === 'geneTree'}
                value="geneTree"
                onChange={event => {
                  // @ts-expect-error
                  setType(event.target.value)
                  setId('')
                }}
              />
              <label htmlFor="genetree">Ensembl Compara GeneTree</label>
            </div>
            <div>
              <input
                id="treefam"
                type="radio"
                checked={type === 'treeFam'}
                value="treeFam"
                onChange={event => {
                  // @ts-expect-error
                  setType(event.target.value)
                  setId('')
                }}
              />
              <label htmlFor="treefam">TreeFam (historical)</label>
            </div>
            <div>
              <label htmlFor="query">Enter {str}:</label>
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
                  if (type === 'treeFam') {
                    setVal('TF105041')
                    setId('TF105041')
                  } else if (type === 'geneTree') {
                    setVal('ENSGT00390000003602')
                    setId('ENSGT00390000003602')
                  }
                }}
              >
                Example
              </Button>
              <Button
                onClick={() => {
                  setId(val)
                }}
              >
                Submit
              </Button>
              {id ? (
                type === 'geneTree' ? (
                  <Link
                    href={`https://useast.ensembl.org/Multi/GeneTree/Image?gt=${id}`}
                  >
                    See at Ensembl
                  </Link>
                ) : (
                  <Link href={`http://www.treefam.org/family/${id}`}>
                    See at TreeFam
                  </Link>
                )
              ) : null}
            </div>
          </div>
        </div>
        {id ? (
          type === 'geneTree' ? (
            <GeneTreeId geneTreeId={id} />
          ) : type === 'treeFam' ? (
            <TreeFamId treeFamId={id} />
          ) : null
        ) : null}
      </div>
    </div>
  )
})

function TreeFamId({ treeFamId }: { treeFamId: string }) {
  const { data, isLoading, error } = useSWR(treeFamId, fetcher)
  return error ? (
    <ErrorMessage error={error} />
  ) : isLoading ? (
    <div>Loading...</div>
  ) : data ? (
    <ReactMSAView msa={data.msa} tree={data.tree} />
  ) : null
}

function GeneTreeId({ geneTreeId }: { geneTreeId: string }) {
  const { data, isLoading, error } = useSWR(geneTreeId, fetcher2)
  return error ? (
    <ErrorMessage error={error} />
  ) : isLoading ? (
    <div>Loading...</div>
  ) : data ? (
    <ReactMSAView
      msa={data.msa}
      tree={data.tree}
      treeMetadata={data.treeMetadata}
    />
  ) : null
}

const MainApp = () => {
  const theme = createJBrowseTheme()
  return (
    <ThemeProvider theme={theme}>
      <App />
      <div style={{ height: 300 }} />
    </ThemeProvider>
  )
}

export default MainApp
