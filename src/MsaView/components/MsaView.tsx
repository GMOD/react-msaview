import PluginManager from "@jbrowse/core/PluginManager";
import ImportFormComponent from "./ImportForm";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import { MsaViewModel } from "../model";
import SettingsIcon from "@material-ui/icons/Settings";
import InfoIcon from "@material-ui/icons/Info";
import SettingsDlg from "./SettingsDlg";
import AboutDlg from "./AboutDlg";
import Tree from "./Tree";
import MSA from "./MSA";

export default (pluginManager: PluginManager) => {
  const { jbrequire } = pluginManager;
  const React = pluginManager.lib["react"];
  const { useState } = React;
  const { observer } = pluginManager.lib["mobx-react"];
  const { IconButton, Typography, Select } = pluginManager.lib[
    "@material-ui/core"
  ];
  const ImportForm = jbrequire(ImportFormComponent);
  const SettingsDialog = jbrequire(SettingsDlg);
  const AboutDialog = jbrequire(AboutDlg);
  const TreeCanvas = jbrequire(Tree);
  const MSACanvas = jbrequire(MSA);

  return observer(({ model }: { model: MsaViewModel }) => {
    const { done, initialized } = model;
    const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
    const [aboutDialogVisible, setAboutDialogVisible] = useState(false);

    if (!initialized) {
      return <ImportForm model={model} />;
    } else if (!done) {
      return <Typography variant="h4">Loading...</Typography>;
    } else {
      const { height, currentAlignment, alignmentNames } = model;

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
                model.setCurrentAlignment(0);
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

            <IconButton
              onClick={() => {
                setAboutDialogVisible(true);
              }}
            >
              <InfoIcon />
            </IconButton>
            <SettingsDialog
              open={settingsDialogVisible}
              model={model}
              onClose={() => setSettingsDialogVisible(false)}
            />
            <AboutDialog
              open={aboutDialogVisible}
              model={model}
              onClose={() => setAboutDialogVisible(false)}
            />
            {alignmentNames.length > 0 ? (
              <Select
                native
                value={currentAlignment}
                onChange={event => {
                  //@ts-ignore
                  model.setCurrentAlignment(+event.target.value);
                  model.setScrollX(0);
                  model.setScrollY(0);
                }}
              >
                {alignmentNames.map((option, index) => (
                  <option key={option + "-" + index} value={index}>
                    {option}
                  </option>
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
