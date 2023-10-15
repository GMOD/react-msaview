# Usage

## Using react-msaview in an external app

Install react-msaview. Your app should have @jbrowse/core, @mui/material, react,
react-dom since react-msaview uses these as peerDependencies

```sh

$ yarn add react-msaview

```

Example script using the react-msaview package:

```typescript
import { observer } from 'mobx-react'
import { MSAView, MSAModel } from 'msaview'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'

function App() {
  const theme = createJBrowseTheme()

  const model = MSAModel.create({ id: `${Math.random()}`, type: 'MsaView' })
  // can pass msaFilehandle and treeFilehandle if you want to point at a URL of a MSA/tree
  // const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView", msaFilehandle: {uri:'http://path/to/msa.stock'} });
  // or pass a string of an msa/tree directly to the "data" field if not pointing to a URL
  // const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView", data: {msa:/*string of msa here */} });

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

## Using react-msaview in a plain HTML file with UMD bundle

```html
<html>
  <head>
    <script>
      window.global = window
    </script>
    <script
      crossorigin
      src="https://unpkg.com/react@17/umd/react.development.js"
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/react-msaview/bundle/index.js"
    ></script>
  </head>
  <body>
    <div id="root" />
    <script>
      const { MSAView, MSAModel } = window.ReactMSAView
      const model = MSAModel.create({
        id: `${Math.random()}`,
        type: 'MsaView',
      })
      // can pass msaFilehandle and treeFilehandle if you want to point at a URL of a MSA/tree
      // const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView", msaFilehandle: {uri:'http://path/to/msa.stock'} });
      // or pass a string of an msa/tree directly to the "data" field if not pointing to a URL
      // const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView", data: {msa:/*string of msa here */} });

      // choose MSA width, calculate width of div/rendering area if needed beforehand
      model.setWidth(1800)

      ReactDOM.render(
        React.createElement(MSAView, { model }),
        document.getElementById('root'),
      )
    </script>
  </body>
</html>
```

## API

The following fields can be passed as constructor aka the MSAModel.create
function

This document shows all the properties you can pass to the model.create
function, as well as getters, methods, and actions on the model.
https://github.com/GMOD/react-msaview/blob/main/lib/apidocs/MsaView.md

See lib/src/model.ts for the full model source code. It is helpful to be
knowledgeable of the way mobx+react inter-operate: you can write components that
"observe" (by wrapping a component with the mobx-react observe function) the
state of the model using React and mobx-state-tree

For example, if you wanted to know what base the user was hovering over. You can
get an intro to basic React and mobx-state-tree + observer concepts in this
short tutorial, and the concepts will apply to this codebase as well
https://gist.github.com/cmdcolin/94d1cbc285e6319cc3af4b9a8556f03f
