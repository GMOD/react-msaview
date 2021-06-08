import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { MSAView, MSAModel } from "react-msaview";
import { createJBrowseTheme } from "@jbrowse/core/ui/theme";
import { Stage, Component } from "react-ngl";

import { ThemeProvider } from "@material-ui/core/styles";

function App() {
  const theme = createJBrowseTheme();
  const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView" });
  model.setWidth(1800);
  console.log(model.pdbSelection);

  const reprList = useMemo(() => [{ type: "cartoon" }], []);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ border: "1px solid black", margin: 20 }}>
        <MSAView model={model} />
        {model.pdbSelection ? (
          <div>
            <Stage width="600px" height="400px">
              <Component path="rcsb://4hhb" reprList={reprList} />
            </Stage>
          </div>
        ) : null}
      </div>
    </ThemeProvider>
  );
}

export default observer(App);
