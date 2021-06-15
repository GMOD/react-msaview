import React, { useCallback, useRef, useState, useEffect } from "react";
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

const global = MSAModel.create({
  type: "MsaView",
  height: 550,
  ...JSON.parse(val),
});

global.setWidth(window.innerWidth);

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
  global.setWidth(window.innerWidth);
});

const ProteinPanel = observer(({ model }) => {
  const tooltipRef = useRef();
  const [type, setType] = useState("cartoon");
  const [res, setRes] = useState([]);
  const [annotation, setAnnotation] = useState();
  const [stage, setStage] = useState();
  const { selected, mouseCol } = model;

  const stageElementRef = useCallback((element) => {
    if (element) {
      const currentStage = new Stage(element);
      setStage(currentStage);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stage) {
        stage.dispose();
      }
    };
  }, [stage]);

  useEffect(() => {
    if (!selected.length || !stage) {
      return;
    }
    (async () => {
      // Create NGL Stage object

      // Handle window resizing
      window.addEventListener("resize", () => {
        stage.handleResize();
      });

      const res = await Promise.all(
        selected.map((selection) =>
          stage.loadFile(`data://${selection.pdb}.pdb`)
        )
      );
      setRes(res);

      stage.signals.hovered.add((pickingProxy) => {
        if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
          const atom = pickingProxy.atom || pickingProxy.closestBondAtom;
          model.setMouseoveredColumn(
            atom.resno,
            atom.chainname,
            pickingProxy.picker.structure.name
          );
        }
      });
    })();
  }, [JSON.stringify(selected), stage]);

  useEffect(() => {
    res?.forEach((elt) => {
      elt.removeAllRepresentations();
      elt.addRepresentation(type);
    });
    stage?.autoView();
  }, [type, res]);

  useEffect(() => {
    const annots = [];
    res?.forEach((elt, index) => {
      if (annotation) {
        elt.removeAnnotation(annotation[index]);
      }
      const tooltip = tooltipRef.current;
      const cp = elt.structure.getResidueProxy(mouseCol);
      const ap = elt.structure.getAtomProxy();
      ap.index = cp.atomOffset;
      var elm = document.createElement("div");
      elm.innerText = "hello";
      elm.style.color = "black";
      elm.style.backgroundColor = "red";
      elm.style.padding = "8px";

      annots.push(elt.addAnnotation(ap.positionToVector3(), elm));
      if (
        elt.structure.pickingProxy &&
        (pickingProxy.atom || pickingProxy.bond)
      ) {
        var atom = pickingProxy.atom || pickingProxy.closestBondAtom;
        var mp = pickingProxy.mouse.position;
        tooltip.innerText = "ATOM: " + atom.qualifiedName();
        tooltip.style.bottom = window.innerHeight - mp.y + 3 + "px";
        tooltip.style.left = mp.x + 3 + "px";
        tooltip.style.display = "block";
      } else {
        tooltip.style.display = "none";
      }
      elt.autoView();
    });
    setAnnotation(annots);
  }, [model, mouseCol]);

  return model.selected.length ? (
    <div>
      <Button onClick={() => model.clearSelection()} variant="contained">
        Clear
      </Button>
      <Select value={type} onChange={(event) => setType(event.target.value)}>
        <MenuItem value={"cartoon"}>cartoon</MenuItem>
        <MenuItem value={"ball+stick"}>ball+stick</MenuItem>
      </Select>
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "fixed",
          zIndex: 10,
          pointerEvents: "none",
          backgroundColor: "rgba( 0, 0, 0, 0.6 )",
          color: "lightgrey",
          padding: "8px",
          fontFamily: "sans-serif",
        }}
      />
      <div
        id="viewport"
        ref={stageElementRef}
        style={{ width: 600, height: 400 }}
      />
    </div>
  ) : null;
});

const App = observer(({ model }) => {
  return (
    <div>
      <div style={{ border: "1px solid black", margin: 20 }}>
        <MSAView model={model} />
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
