import PluginManager from "@jbrowse/core/PluginManager";
export default function(pluginManager: PluginManager) {
  const { jbrequire } = pluginManager;
  const { observer } = jbrequire("mobx-react");
  const React = jbrequire("react");
  const { useState } = React;
  const { openLocation } = jbrequire("@jbrowse/core/util/io");
  const { makeStyles } = jbrequire("@material-ui/core/styles");
  const Button = jbrequire("@material-ui/core/Button");
  const Container = jbrequire("@material-ui/core/Container");
  const Grid = jbrequire("@material-ui/core/Grid");
  const Typography = jbrequire("@material-ui/core/Typography");
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
        <Grid container spacing={1} justify="center" alignItems="center">
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
        </Grid>
      </Container>
    );
  });
}
