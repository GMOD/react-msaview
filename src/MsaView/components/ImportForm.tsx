import PluginManager from "@jbrowse/core/PluginManager";

import { smallTree, smallMSA } from "./data/seq2";

import largeTree from "./data/largetree";

export default function(pluginManager: PluginManager) {
  const { jbrequire } = pluginManager;
  const { observer } = jbrequire("mobx-react");
  const React = jbrequire("react");
  const { useState } = React;
  const { openLocation } = jbrequire("@jbrowse/core/util/io");
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
    const [file, setFile] = useState();

    return (
      <Container className={classes.importFormContainer}>
        <Grid container spacing={10} justify="center" alignItems="center">
          <Grid item>
            <Typography>Open a MSA file</Typography>
            <FileSelector
              location={file}
              setLocation={setFile}
              localFileAllowed
            />
          </Grid>

          <Grid item>
            <Button
              onClick={async () => {
                try {
                  if (file) {
                    const data = await openLocation(file).readFile("utf8");
                    model.setData(data);
                  }
                } catch (e) {
                  model.setError(e);
                }
              }}
              variant="contained"
              color="primary"
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
                  230k COVID-19
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
            </ul>
          </Grid>
        </Grid>
      </Container>
    );
  });
}
