# react-msaview

## Demo

See https://gmod.github.io/react-msaview

This page is a deployment of the `app` directory in this repo, which uses the
`react-msaview` NPM package as a minimal example app

## Screenshot

![](docs/media/image20.png)

## Docs

See [user guide](docs/user_guide.md)

## Developers

To begin run git clone the repo and run `yarn && yarn start`

This will actually in parallel start the code in the lib directory (containing
the npm package named react-msaview) and the app directory (containing a
create-react-app demo app)

## Using react-msaview in an external app

Install react-msaview. Your app should have @jbrowse/core, @material-ui/core,
react, react-dom since react-msaview uses these as peerDependencies

\$ yarn add react-msaview

Example script

```
import { observer } from "mobx-react";
import { MSAView, MSAModel } from "msaview";
import { createJBrowseTheme } from "@jbrowse/core/ui/theme";
import { ThemeProvider } from "@material-ui/core/styles";

function App() {
  const theme = createJBrowseTheme();
  const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView" });
  model.setWidth(1800);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ border: "1px solid black", margin: 20 }}>
        <MSAView model={model} />
      </div>
    </ThemeProvider>
  );
}

```

## Notes

This repo also supports https://github.com/GMOD/jbrowse-plugin-msaview which is
a jbrowse 2 plugin for viewing MSAs

This repo also builds on abrowse (https://github.com/ihh/abrowse) and
phylo-react (https://www.npmjs.com/package/phylo-react)
