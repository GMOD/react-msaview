import React from "react";
import { observer } from "mobx-react";
import { types, onSnapshot } from "mobx-state-tree";
import { MSAView, MSAModel } from "react-msaview";
import { createJBrowseTheme } from "@jbrowse/core/ui/theme";
import { ThemeProvider } from "@material-ui/core/styles";
import { throttle } from "lodash";

import { ProteinPanel } from "./ProteinPanel";

const urlParams = new URLSearchParams(window.location.search);
const val = urlParams.get("data");

const global = types
  .model({
    msaview: MSAModel,
    nglSelection: types.optional(types.string, ""),
  })
  .actions((self) => ({
    setNGLSelection(sel) {
      self.nglSelection = sel;
    },
  }))
  .create(val ? JSON.parse(val) : { msaview: { type: "MsaView" } });

global.msaview.setWidth(window.innerWidth);

onSnapshot(
  global,
  throttle((snap) => {
    const url = new URL(window.document.URL);
    url.searchParams.set("data", JSON.stringify(snap));
    window.history.replaceState(null, "", url.toString());
  }, 500)
);

// Handle window resizing
window.addEventListener("resize", () => {
  global.msaview.setWidth(window.innerWidth);
});

const App = observer(({ model }) => {
  const { msaview } = model;
  return (
    <div>
      <div style={{ border: "1px solid black", margin: 20 }}>
        <MSAView model={msaview} />
      </div>
      <ProteinPanel model={model} />
    </div>
  );
});

export default () => {
  const theme = createJBrowseTheme();
  return (
    <ThemeProvider theme={theme}>
      <App model={global} />
    </ThemeProvider>
  );
};
