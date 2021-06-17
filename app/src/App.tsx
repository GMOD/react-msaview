import React from "react";
import { observer } from "mobx-react";
import { onSnapshot } from "mobx-state-tree";
import { MSAView } from "react-msaview";
import { createJBrowseTheme } from "@jbrowse/core/ui/theme";
import { ThemeProvider } from "@material-ui/core/styles";
import { throttle } from "lodash";
import AppGlobal, { AppModel } from "./model";

import { ProteinPanel } from "./ProteinPanel";

const urlParams = new URLSearchParams(window.location.search);
const val = urlParams.get("data");

const mymodel = AppGlobal.create(
  val ? JSON.parse(val) : { msaview: { type: "MsaView" } }
);

mymodel.msaview.setWidth(window.innerWidth);

onSnapshot(
  mymodel,
  throttle((snap) => {
    const url = new URL(window.document.URL);
    url.searchParams.set("data", JSON.stringify(snap));
    window.history.replaceState(null, "", url.toString());
  }, 500)
);

// Handle window resizing
window.addEventListener("resize", () => {
  mymodel.msaview.setWidth(window.innerWidth);
});

const App = observer(({ model }: { model: AppModel }) => {
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

const MainApp = () => {
  const theme = createJBrowseTheme();
  return (
    <ThemeProvider theme={theme}>
      <App model={mymodel} />
    </ThemeProvider>
  );
};

export default MainApp;
