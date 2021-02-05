import PluginManager from "@jbrowse/core/PluginManager";
import { MsaViewModel } from "../model";
import colorSchemes from "./colorSchemes";

export default function(pluginManager: PluginManager) {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { observer } = jbrequire("mobx-react");
  const { useState } = React;
  const {
    Button,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    FormControlLabel,
    MenuItem,
    TextField,
  } = jbrequire("@material-ui/core");

  return observer(
    ({
      model,
      onClose,
      open,
    }: {
      model: MsaViewModel;
      onClose: Function;
      open: boolean;
    }) => {
      const {
        rowHeight: rowHeightInit,
        pxPerBp: pxPerBpInit,
        colorSchemeName: colorSchemeNameInit,
      } = model;
      const [rowHeight, setRowHeight] = useState(rowHeightInit);
      const [pxPerBp, setPxPerBp] = useState(pxPerBpInit);
      const [colorScheme, setColorSchemeName] = useState(colorSchemeNameInit);
      return (
        <Dialog onClose={() => onClose()} open={open}>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <FormControlLabel
              control={
                <Checkbox
                  checked={model.showBranchLen}
                  onChange={() => model.toggleBranchLen()}
                />
              }
              label="Show branch length"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={model.bgColor}
                  onChange={() => model.toggleBgColor()}
                />
              }
              label="Color background"
            />
            <br />
            <TextField
              label="Row height (px)"
              value={rowHeight}
              onChange={(event: any) => setRowHeight(event.target.value)}
            />
            <TextField
              label="Column width (px)"
              value={pxPerBp}
              onChange={(event: any) => setPxPerBp(event.target.value)}
            />
            <br />

            <TextField
              select
              label="Color scheme"
              value={colorScheme}
              onChange={(event: any) => setColorSchemeName(event.target.value)}
            >
              {Object.keys(colorSchemes).map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <br />
            <br />
            <br />
            <Button
              onClick={() => {
                model.setRowHeight(+rowHeight);
                model.setPxPerBp(+pxPerBp);
                model.setColorSchemeName(colorScheme);
                onClose();
              }}
              variant="contained"
              color="primary"
            >
              Submit
            </Button>
          </DialogContent>
        </Dialog>
      );
    },
  );
}
