import PluginManager from "@jbrowse/core/PluginManager";

import { smallTree, smallMSA } from "./data/seq2";

import largeTree from "./data/largetree";

export default function(pluginManager: PluginManager) {
  const { jbrequire } = pluginManager;
  const { observer } = jbrequire("mobx-react");
  const React = jbrequire("react");
  const { useState } = React;
  const { makeStyles } = jbrequire("@material-ui/core/styles");
  const { Button, Container, Grid, Typography, Link } = jbrequire(
    "@material-ui/core",
  );
  const { FileSelector } = jbrequire("@jbrowse/core/ui");

  const useStyles = makeStyles((theme: any) => ({
    importFormContainer: {
      padding: theme.spacing(2),
    },
    importFormEntry: {
      minWidth: 180,
    },
  }));

  return observer(({ model }: { model: any }) => {
    const classes = useStyles();
    const [msaFile, setMsaFile] = useState();
    const [treeFile, setTreeFile] = useState();

    return (
      <Container className={classes.importFormContainer}>
        <div style={{ width: "50%" }}>
          <Typography>
            Open an MSA file (stockholm or clustal format) and/or a tree file
            (newick format).
          </Typography>
          <Typography color="error">
            Note: you can open up just an MSA or just a tree, both are not
            required. Some MSA files e.g. stockholm format have an embedded tree
            also and this is fine, and opening a separate tree file is not
            required.
          </Typography>
        </div>

        <Grid container spacing={10} justify="center" alignItems="center">
          <Grid item>
            <Typography>MSA file or URL</Typography>
            <FileSelector
              location={msaFile}
              setLocation={setMsaFile}
              localFileAllowed
            />
            <Typography>Tree file or URL</Typography>
            <FileSelector
              location={treeFile}
              setLocation={setTreeFile}
              localFileAllowed
            />
          </Grid>

          <Grid item>
            <Button
              onClick={() => {
                if (msaFile) {
                  model.setMSAFilehandle(msaFile);
                }
                if (treeFile) {
                  model.setTreeFilehandle(treeFile);
                }
              }}
              variant="contained"
              color="primary"
              disabled={!msaFile && !treeFile}
            >
              Open
            </Button>
          </Grid>

          <Grid item>
            <Typography>Examples</Typography>
            <ul>
              <li>
                <Link
                  href="#"
                  onClick={() => {
                    model.setData({ msa: "", tree: largeTree });
                  }}
                >
                  230k COVID-19 samples (tree only)
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  onClick={() => {
                    model.setData({ msa: smallMSA, tree: smallTree });
                  }}
                >
                  Small protein+tree
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  onClick={() => {
                    model.setMSAFilehandle({
                      uri:
                        "https://ihh.github.io/abrowse/build/pfam-cov2.stock",
                    });
                  }}
                >
                  PFAM SARS-CoV2 multi-stockholm
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  onClick={() => {
                    model.setMSAFilehandle({
                      uri:
                        "https://jbrowse.org/genomes/multiple_sequence_alignments/Lysine.stock",
                    });
                  }}
                >
                  Lysine stockholm file
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  onClick={() => {
                    model.setMSAFilehandle({
                      uri:
                        "https://jbrowse.org/genomes/multiple_sequence_alignments/PF01601_full.txt",
                    });
                  }}
                >
                  PF01601 stockholm file (SARS-CoV2 spike protein)
                </Link>
              </li>
            </ul>
          </Grid>
        </Grid>
      </Container>
    );
  });
}
