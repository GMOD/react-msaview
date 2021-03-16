import PluginManager from "@jbrowse/core/PluginManager";
import { MsaViewModel } from "../model";

export default function(pluginManager: PluginManager) {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { observer } = jbrequire("mobx-react");
  const { Dialog, DialogTitle, DialogContent } = pluginManager.lib[
    "@material-ui/core"
  ];
  const { Attributes } = pluginManager.lib[
    "@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail"
  ];

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
      const { alignmentDetails } = model;

      return (
        <Dialog onClose={() => onClose()} open={open}>
          <DialogTitle>Metadata</DialogTitle>
          <DialogContent>
            <Attributes attributes={alignmentDetails} />
          </DialogContent>
        </Dialog>
      );
    },
  );
}
