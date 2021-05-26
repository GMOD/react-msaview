# react-msaview

Demo app https://gmod.github.io/react-msaview

This repo also supports https://github.com/GMOD/jbrowse-plugin-msaview which is a jbrowse 2 plugin for viewing MSAs

This repo is a yarn monorepo with a "example" directory hosting a create-react-app which is what the github pages link above shows

It then has the "lib" directory which is published as react-msaview on NPM

## Features

- Vertical virtualized scrolling of phylogenetic tree
- Vertical and horizontal virtualized scrolling of multiple sequence alignment
- View metadata about alignment from MSA headers (e.g. stockholm)
- Collapse subtrees with click action on branches which also hides gaps that
  were introduced by that subtree in the rest of the alignment
- Allows "zooming out" by setting tiny rowHeight/colWidth settings
- Allows changing color schemes, with jalview, clustal, and other color schemes
- Allows toggling the branch length rendering for the phylogenetic tree
- Can share sessions with other users which will send relevant settings and
  links to files to automatically open your results
- The tree or the MSA panel can be loaded separately from each other

## File format supports

- FASTA formatted for MSA (e.g. gaps already inserted)
- Stockholm files (e.g. .stock file, with or without embedded newick tree, uses
  stockholm-js parser. also supports "multi-stockholm" files with multiple
  alignments embedded in a single file)
- Clustal files (e.g. .aln file, uses clustal-js parser)
- Newick (tree can be loaded separately as a .nh file)

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
