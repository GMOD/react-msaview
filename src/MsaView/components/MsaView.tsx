import PluginManager from "@jbrowse/core/PluginManager";
import ImportFormComponent from "./ImportForm";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import { MsaViewModel } from "../model";
import SettingsIcon from "@material-ui/icons/Settings";
import SettingsDlg from "./SettingsDlg";
import Tree from "./Tree";
import MSA from "./MSA";

export default (pluginManager: PluginManager) => {
  const { jbrequire } = pluginManager;
  const React = pluginManager.lib["react"];
  const { useState } = React;
  const { observer } = pluginManager.lib["mobx-react"];
  const { IconButton, Typography, MenuItem, Select } = pluginManager.lib[
    "@material-ui/core"
  ];
  const ImportForm = jbrequire(ImportFormComponent);
  const SettingsDialog = jbrequire(SettingsDlg);
  const TreeCanvas = jbrequire(Tree);
  const MSACanvas = jbrequire(MSA);

  return observer(({ model }: { model: MsaViewModel }) => {
    const { done, initialized } = model;
    const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);

    if (!initialized) {
      return <ImportForm model={model} />;
    } else if (!done) {
      return <Typography variant="h4">Loading...</Typography>;
    } else {
      const { height, currentAlignmentName, alignmentNames } = model;

      return (
        <div style={{ height }}>
          <div style={{ display: "block" }}>
            <IconButton
              onClick={() => {
                model.setData({ tree: "", msa: "" });
                model.setTreeFilehandle(undefined);
                model.setMSAFilehandle(undefined);
                model.setScrollY(0);
                model.setScrollX(0);
              }}
            >
              <FolderOpenIcon />
            </IconButton>
            <IconButton
              onClick={() => {
                setSettingsDialogVisible(true);
              }}
            >
              <SettingsIcon />
            </IconButton>
            <SettingsDialog
              open={settingsDialogVisible}
              model={model}
              onClose={() => setSettingsDialogVisible(false)}
            />
            {alignmentNames.length > 0 ? (
              <Select
                native
                value={model.currentAlignment}
                onChange={event => {
                  console.log(event.target.value);
                  //@ts-ignore
                  model.setCurrentAlignment(+event.target.value);
                }}
              >
                {alignmentNames.map((option, index) => (
                  <option value={index}>{option}</option>
                ))}
              </Select>
            ) : null}
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
            }}
          >
            <TreeCanvas model={model} />
            <MSACanvas model={model} />
          </div>
        </div>
      );
    }
  });
};
