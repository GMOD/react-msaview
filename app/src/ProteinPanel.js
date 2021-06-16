import React, { useCallback, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Button, Select, MenuItem, TextField, Grid } from "@material-ui/core";
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
  const [isMouseHovering, setMouseHovering] = useState(false);
  const [selectionValue, setSelectionValue] = useState("");
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
        selected.map((selection) => {
          return stage.loadFile(`data://${selection.pdb.pdb}.pdb`);
        })
      );
      setRes(res);

      stage.signals.hovered.add((pickingProxy) => {
        if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
          const atom = pickingProxy.atom || pickingProxy.closestBondAtom;
          console.log(atom.resno, selected[0].pdb.startPos);
          model.setMouseoveredColumn(
            atom.resno - selected[0].pdb.startPos,
            atom.chainname,
            pickingProxy.picker.structure.name
          );
        }
      });
    })();
  }, [JSON.stringify(selected), stage]);

  useEffect(() => {
    if (stage) {
      res.forEach((elt) => {
        elt.removeAllRepresentations();
        elt.addRepresentation(type, { sele: selectionValue });
      });
      stage.autoView();
    }
  }, [type, res, stage, selectionValue]);

  useEffect(() => {
    if (!isMouseHovering) {
      const annots = [];
      res.forEach((elt, index) => {
        if (annotation) {
          elt.removeAnnotation(annotation[index]);
        }
        if (mouseCol !== undefined) {
          const { startPos } = selected[0].pdb;

          let k;
          const rn = elt.structure.residueStore.count;
          const rp = elt.structure.getResidueProxy();
          for (let i = 0; i < rn; ++i) {
            rp.index = i;
            if (rp.resno === mouseCol + startPos - 1) {
              k = rp;
              break;
            }
          }

          if (k) {
            const ap = elt.structure.getAtomProxy();
            ap.index = k.atomOffset;

            annots.push(
              elt.addAnnotation(ap.positionToVector3(), k.qualifiedName())
            );
          }
        }
        stage.viewer.requestRender();
      });
      setAnnotation(annots);
    }
  }, [model, mouseCol, isMouseHovering]);

  return model.selected.length ? (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button onClick={() => model.clearSelection()} variant="contained">
          Clear
        </Button>

        <div style={{ width: 20 }} />
        <Select value={type} onChange={(event) => setType(event.target.value)}>
          <MenuItem value={"cartoon"}>cartoon</MenuItem>
          <MenuItem value={"ball+stick"}>ball+stick</MenuItem>
        </Select>
        <div style={{ width: 20 }} />
        <TextField
          variant="outlined"
          label="Selection"
          value={selectionValue}
          onChange={(event) => setSelectionValue(event.target.value)}
        />
      </div>

      <div
        ref={stageElementRef}
        style={{ width: 600, height: 400 }}
        onMouseEnter={() => setMouseHovering(true)}
        onMouseLeave={() => setMouseHovering(false)}
      />
    </div>
  ) : null;
});
