import React, { useState } from "react";
import { IconButton, Select } from "@material-ui/core";
import { MsaViewModel } from "../model";
import { observer } from "mobx-react";

import SettingsDialog from "./SettingsDlg";
import AboutDialog from "./AboutDlg";
import DetailsDialog from "./DetailsDlg";

//icons
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import SettingsIcon from "@material-ui/icons/Settings";
import InfoIcon from "@material-ui/icons/Info";
import AssignmentIcon from "@material-ui/icons/Assignment";

const Header = observer(({ model }: { model: MsaViewModel }) => {
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const [aboutDialogVisible, setAboutDialogVisible] = useState(false);
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
  const { currentAlignment, alignmentNames } = model;

  return (
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

      <IconButton
        onClick={() => {
          setDetailsDialogVisible(true);
        }}
      >
        <AssignmentIcon />
      </IconButton>
      <SettingsDialog
        open={settingsDialogVisible}
        model={model}
        onClose={() => setSettingsDialogVisible(false)}
      />
      <AboutDialog
        open={aboutDialogVisible}
        onClose={() => setAboutDialogVisible(false)}
      />

      <DetailsDialog
        open={detailsDialogVisible}
        model={model}
        onClose={() => setDetailsDialogVisible(false)}
      />
      {alignmentNames.length > 0 ? (
        <Select
          native
          value={currentAlignment}
          onChange={(event) => {
            model.setCurrentAlignment(+(event.target.value as string));
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
  );
});

export default Header;
