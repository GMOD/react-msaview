# Usage

## Using react-msaview NPM package as a React component

Install react-msaview. Your app should have @jbrowse/core, @mui/material, react,
react-dom since react-msaview uses these as peerDependencies

```sh

$ yarn add react-msaview

```

## Using the react-msaview NPM component, point at raw data

```typescript
import { observer } from 'mobx-react'
import { MSAView, MSAModel } from 'msaview'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'

function App() {
  const theme = createJBrowseTheme()

  const model = MSAModel.create({
    type: "MsaView",
    data: {
      msa: 'string containing stockholm, clustalw, or multi-fasta msa here',
      tree: 'string containing newick formatted tree here'
    }
  });

  // choose MSA width, calculate width of div/rendering area if needed beforehand
  model.setWidth(1800)

  return (
    <ThemeProvider theme={theme}>
      <div style={{ border: '1px solid black', margin: 20 }}>
        <MSAView model={model} />
      </div>
    </ThemeProvider>
  )
}
```

## Using the react-msaview NPM component, point at remote files

```typescript
import { observer } from 'mobx-react'
import { MSAView, MSAModel } from 'msaview'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'

function App() {
  const theme = createJBrowseTheme()

  const model = MSAModel.create({
    type: "MsaView",
    msaFilehandle: { uri: 'http://path/to/msa.stock' },
    treeFilehandle: { uri: 'http://path/to/tree.nh' }
  });

  // choose MSA width, calculate width of div/rendering area if needed beforehand
  model.setWidth(1800)

  return (
    <ThemeProvider theme={theme}>
      <div style={{ border: '1px solid black', margin: 20 }}>
        <MSAView model={model} />
      </div>
    </ThemeProvider>
  )
}
```

## Using react-msaview in a plain HTML file with UMD bundle, point at URLs

```html
<html>
  <head>
    <script
      crossorigin
      src="https://unpkg.com/react-msaview/bundle/index.js"
    ></script>
  </head>
  <body>
    <div id="root" />
    <script>
      const { React, createRoot, MSAView, MSAModelF } = window.ReactMSAView

      // can pass msaFilehandle and treeFilehandle if you want to
      // point at a URL of a MSA (stockholm, multi-fasta, or clustalw format)
      // and tree (mewick format)
      const model = MSAModel.create({
        type: 'MsaView',
        msaFilehandle: { uri: 'http://path/to/msa.stock' },
        treeFilehandle: { uri: 'http://path/to/tree.nh' },
      })

      // option 2. pass a string of an msa/tree directly to the "data" field if
      // not pointing to a URL
      const model = MSAModel.create({
        type: 'MsaView',
        data: {
          msa: 'string containing stockholm, clustalw, or multi-fasta msa here',
          tree: 'string containing newick formatted tree here',
        },
      })

      // choose MSA width, calculate width of div/rendering area if needed beforehand
      model.setWidth(1800)
      const root = createRoot(document.getElementById('root'))
      root.render(React.createElement(MSAView, { model }))
    </script>
  </body>
</html>
```

## Using react-msaview in a plain HTML file with UMD bundle, point at raw data

```html
<html>
  <head>
    <script
      crossorigin
      src="https://unpkg.com/react-msaview/bundle/index.js"
    ></script>
  </head>
  <body>
    <div id="root" />
    <script>
      const { React, createRoot, MSAView, MSAModelF } = window.ReactMSAView
      // pass the data directly to the "data" field of the model
      const model = MSAModel.create({
        type: 'MsaView',
        data: {
          msa: /* raw string of clustalw, stockholm, or multi-fasta alignment here */,
          tree: /* optional newick formatted tree */
        },
      })

      // choose MSA width, calculate width of div/rendering area if needed beforehand
      model.setWidth(1800)
      const root = createRoot(document.getElementById('root'))
      root.render(React.createElement(MSAView, { model }))
    </script>
  </body>
</html>
```

## API

See here for complete auto-generated API docs for the MSA view model
https://github.com/GMOD/react-msaview/blob/main/lib/apidocs/MsaView.md

You can also look at lib/src/model.ts for the full model source code

The React-MSAView package uses this 'model' extensively, instead of a 'prop'
based API

It is helpful to be knowledgeable of the way mobx+react inter-operate: you can
write components that "observe" (by wrapping a component with the mobx-react
observe function) the state of the model using React and mobx-state-tree

For example, if you wanted to know what base the user was hovering over. You can
get an intro to basic React and mobx-state-tree + observer concepts in this
short tutorial, and the concepts will apply to this codebase as well
https://gist.github.com/cmdcolin/94d1cbc285e6319cc3af4b9a8556f03f
