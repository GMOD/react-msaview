import React, { useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { MSAView, MSAModel } from "react-msaview";
import { createJBrowseTheme } from "@jbrowse/core/ui/theme";
import { Stage, StaticDatasource, DatasourceRegistry } from "ngl";

DatasourceRegistry.add(
  "data",
  new StaticDatasource("//cdn.rawgit.com/arose/ngl/v2.0.0-dev.32/data/")
);

import { ThemeProvider } from "@material-ui/core/styles";

const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView" });
model.setWidth(1800);

function App() {
  const theme = createJBrowseTheme();
  const ref = useRef();
  const { selected } = model;
  console.log(JSON.stringify(selected), selected.toJS());

  useEffect(() => {
    // Create NGL Stage object
    var stage = new Stage("viewport");

    // Handle window resizing
    window.addEventListener("resize", (event) => stage.handleResize());

    // Code for example: interactive/hover-tooltip
    // create tooltip element and add to document body
    var tooltip = document.createElement("div");
    Object.assign(tooltip.style, {
      display: "none",
      position: "fixed",
      zIndex: 10,
      pointerEvents: "none",
      backgroundColor: "rgba( 0, 0, 0, 0.6 )",
      color: "lightgrey",
      padding: "8px",
      fontFamily: "sans-serif",
    });
    document.body.appendChild(tooltip);

    selected.forEach((selection) => {
      console.log(selected.id);
      // load a structure file
      stage.loadFile(`data://${selection.id}.mmtf`, {
        defaultRepresentation: true,
      });
    });

    // remove default hoverPick mouse action
    stage.mouseControls.remove("hoverPick");

    // listen to `hovered` signal to move tooltip around and change its text
    stage.signals.hovered.add(function (pickingProxy) {
      if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
        var atom = pickingProxy.atom || pickingProxy.closestBondAtom;
        var mp = pickingProxy.mouse.position;
        tooltip.innerText = "ATOM: " + atom.qualifiedName();
        tooltip.style.background = "red";
        tooltip.style.bottom = window.innerHeight - mp.y + 3 + "px";
        tooltip.style.left = mp.x + 3 + "px";
        tooltip.style.display = "block";
      } else {
        tooltip.style.display = "none";
      }
    });
  }, [JSON.stringify(selected)]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ border: "1px solid black", margin: 20 }}>
        <MSAView model={model} />
        {model.pdbSelection ? (
          <div id="viewport" ref={ref} style={{ width: 600, height: 400 }} />
        ) : null}
      </div>
    </ThemeProvider>
  );
}

export default observer(App);
