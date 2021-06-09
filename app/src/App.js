import React, { useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { onSnapshot } from "mobx-state-tree";
import { MSAView, MSAModel } from "react-msaview";
import { createJBrowseTheme } from "@jbrowse/core/ui/theme";
import { Stage, StaticDatasource, DatasourceRegistry } from "ngl";
import { throttle } from "lodash";

DatasourceRegistry.add(
  "data",
  new StaticDatasource("https://files.rcsb.org/download/")
);

import { ThemeProvider } from "@material-ui/core/styles";

const urlParams = new URLSearchParams(window.location.search);
const val = urlParams.get("data");

const model = MSAModel.create({
  type: "MsaView",
  ...JSON.parse(val),
});
model.setWidth(window.innerWidth);

function App() {
  const theme = createJBrowseTheme();
  const ref = useRef();
  const { selected } = model;

  useEffect(() => {
    if (!selected.length) {
      return;
    }
    (async () => {
      // Create NGL Stage object
      var stage = new Stage("viewport");

      // Handle window resizing
      window.addEventListener("resize", (event) => stage.handleResize());

      // Code for example: interactive/hover-tooltip
      // create tooltip element and add to document body

      const res = await Promise.all(
        selected.map((selection) =>
          stage.loadFile(`data://${selection.id}.pdb`)
        )
      );

      res.forEach((elt) => elt.addRepresentation("cartoon"));

      stage.autoView();

      // remove default hoverPick mouse action
      // stage.mouseControls.remove("hoverPick");

      // listen to `hovered` signal to move tooltip around and change its text
      stage.signals.hovered.add(function (pickingProxy) {
        if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
          var atom = pickingProxy.atom || pickingProxy.closestBondAtom;
          var mp = pickingProxy.mouse.position;
          model.setMouseoveredColumn(
            atom.resno,
            atom.chainname,
            pickingProxy.picker.structure.name
          );
        }
      });
    })();
  }, [JSON.stringify(selected)]);

  useEffect(() => {
    onSnapshot(
      model,
      throttle((snap) => {
        const url = new URL(window.document.URL);
        url.searchParams.set("data", JSON.stringify(snap));
        window.history.replaceState(null, "", url.toString());
      }, 500)
    );
  }, [model]);

  return (
    <ThemeProvider theme={theme}>
      <div>
        <div style={{ border: "1px solid black", margin: 20 }}>
          <MSAView model={model} />
        </div>
        {model.selected.length ? (
          <div id="viewport" ref={ref} style={{ width: 600, height: 400 }} />
        ) : null}
      </div>
    </ThemeProvider>
  );
}

export default observer(App);
