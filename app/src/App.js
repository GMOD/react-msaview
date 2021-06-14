import React, { useRef, useState, useEffect } from "react";
import { Button, Select, MenuItem } from "@material-ui/core";
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
  height: 550,
  ...JSON.parse(val),
});

model.setWidth(window.innerWidth);

const ProteinPanel = observer(({ model }) => {
  const ref = useRef();
  const [type, setType] = useState("cartoon");
  const [res, setRes] = useState([]);
  const [stage, setStage] = useState();
  const { selected, mouseCol } = model;

  useEffect(() => {
    if (!selected.length) {
      return;
    }
    (async () => {
      // Create NGL Stage object
      var stage = new Stage("viewport");
      setStage(stage);

      // Handle window resizing
      window.addEventListener("resize", () => {
        stage.handleResize();
        model.setWidth(window.innerWidth);
      });

      // Code for example: interactive/hover-tooltip
      // create tooltip element and add to document body

      const res = await Promise.all(
        selected.map((selection) =>
          stage.loadFile(`data://${selection.pdb}.pdb`)
        )
      );
      setRes(res);

      stage.signals.hovered.add(function (pickingProxy) {
        if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
          var atom = pickingProxy.atom || pickingProxy.closestBondAtom;
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
    res?.forEach((elt) => {
      elt.removeAllRepresentations();
      elt.addRepresentation(type);
    });
    stage?.autoView();
  }, [type, res]);

  useEffect(() => {
    if (mouseCol !== undefined) {
      res.forEach((elt) => {
        elt.addRepresentation("label", { sele: `@${mouseCol}` });
        stage.autoView();
      });
    }
  }, [res, mouseCol]);

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
  return model.selected.length ? (
    <div>
      <Button onClick={() => model.clearSelection()} variant="contained">
        Clear
      </Button>
      <Select value={type} onChange={(event) => setType(event.target.value)}>
        <MenuItem value={"cartoon"}>cartoon</MenuItem>
        <MenuItem value={"ball+stick"}>ball+stick</MenuItem>
      </Select>
      <div id="viewport" ref={ref} style={{ width: 600, height: 400 }} />
    </div>
  ) : null;
});

function App() {
  return (
    <div>
      <div style={{ border: "1px solid black", margin: 20 }}>
        <MSAView model={model} />
      </div>
      <ProteinPanel model={model} />
    </div>
  );
}

export default () => {
  const theme = createJBrowseTheme();
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
};
