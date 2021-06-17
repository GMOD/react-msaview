import React, { useCallback, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Button, Select, MenuItem, TextField } from "@material-ui/core";
import { Stage, StaticDatasource, DatasourceRegistry } from "ngl";
import { AppModel } from "./model";

DatasourceRegistry.add(
  "data",
  new StaticDatasource("https://files.rcsb.org/download/")
);

export const ProteinPanel = observer(({ model }: { model: AppModel }) => {
  const [type, setType] = useState("cartoon");
  const [res, setRes] = useState<any[]>([]);
  const [annotation, setAnnotation] = useState<any[]>();
  const [stage, setStage] = useState();
  const [isMouseHovering, setMouseHovering] = useState(false);
  const { msaview, nglSelection } = model;
  const { selectedStructures, mouseCol } = msaview;

  const serializedStructures = JSON.stringify(selectedStructures);

  const stageElementRef = useCallback((element) => {
    if (element) {
      const currentStage = new Stage(element);
      setStage(currentStage);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stage !== null) {
        //@ts-ignore
        stage.dispose();
      }
    };
  }, [stage]);

  useEffect(() => {
    (async () => {
      if (!selectedStructures.length || !stage) {
        return;
      }
      // Handle window resizing
      window.addEventListener("resize", () => {
        //@ts-ignore not sure why complaining here
        stage.handleResize();
      });

      const res = await Promise.all(
        selectedStructures.map((selection) => {
          //@ts-ignore not sure why complaining here
          return stage.loadFile(`data://${selection.structure.pdb}.pdb`);
        })
      );
      setRes(res);

      //@ts-ignore
      stage.signals.hovered.add((pickingProxy) => {
        if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
          const atom = pickingProxy.atom || pickingProxy.closestBondAtom;
          msaview.setMouseoveredColumn(
            atom.resno - selectedStructures[0].structure.startPos,
            atom.chainname,
            pickingProxy.picker.structure.name
          );
        }
      });
    })();
  }, [JSON.stringify(selectedStructures), stage]);

  useEffect(() => {
    if (stage) {
      res.forEach((elt) => {
        elt.removeAllRepresentations();
        elt.addRepresentation(type, { sele: nglSelection });
      });
      //@ts-ignore
      stage.autoView();
    }
  }, [type, res, stage, nglSelection]);

  useEffect(() => {
    if (!isMouseHovering) {
      const annots: any[] = [];
      res.forEach((elt, index) => {
        if (annotation) {
          //@ts-ignore
          elt.removeAnnotation(annotation[index]);
        }
        if (mouseCol !== undefined) {
          const { startPos } = selectedStructures[0].structure;

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

        //@ts-ignore
        stage.viewer.requestRender();
      });
      setAnnotation(annots);
    }
  }, [model, mouseCol, isMouseHovering]);

  return selectedStructures.length ? (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          onClick={() => msaview.clearSelectedStructures()}
          variant="contained"
        >
          Clear
        </Button>

        <div style={{ width: 20 }} />
        <Select
          value={type}
          onChange={(event) => setType(event.target.value as string)}
        >
          <MenuItem value={"cartoon"}>cartoon</MenuItem>
          <MenuItem value={"ball+stick"}>ball+stick</MenuItem>
        </Select>
        <div style={{ width: 20 }} />
        <TextField
          variant="outlined"
          label="Selection"
          value={nglSelection}
          onChange={(event) => model.setNGLSelection(event.target.value)}
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
