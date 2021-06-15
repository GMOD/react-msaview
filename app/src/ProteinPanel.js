import React, { useCallback, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Button, Select, MenuItem } from "@material-ui/core";
import { Stage, StaticDatasource, DatasourceRegistry } from "ngl";

DatasourceRegistry.add(
  "data",
  new StaticDatasource("https://files.rcsb.org/download/")
);

export const ProteinPanel = observer(({ model }) => {
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
      const cp = elt.structure.getResidueProxy(mouseCol);
      const ap = elt.structure.getAtomProxy();
      ap.index = cp.atomOffset;
      const elm = document.createElement("div");
      elm.innerText = "hello";
      elm.style.color = "black";
      elm.style.backgroundColor = "red";
      elm.style.padding = "8px";

      annots.push(elt.addAnnotation(ap.positionToVector3(), elm));

      // elt.autoView();
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
        id="viewport"
        ref={stageElementRef}
        style={{ width: 600, height: 400 }}
      />
    </div>
  ) : null;
});
