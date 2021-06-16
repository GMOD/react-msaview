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
    if (stage) {
      res.forEach((elt) => {
        elt.removeAllRepresentations();
        elt.addRepresentation(type, { sele: "21-37" });
      });
      stage.autoView();
    }
  }, [type, res, stage]);

  useEffect(() => {
    const annots = [];
    res.forEach((elt, index) => {
      if (annotation) {
        elt.removeAnnotation(annotation[index]);
      }
      if (mouseCol !== undefined) {
        const { startPos, endPos } = selected[0].pdb;
        // console.log(mouseCol, selected[0].pdb.startPos, selected[0].pdb.endPos);
        // let r = "";
        // elt.structure.eachResidue((ent) => {
        //   r += ent.getResname1();
        // });
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

        // console.log({ e: elt.structure });
        // console.log("bef", res.resname, startPos + mouseCol - 1, mouseCol);
        // res.resno = 21;
        // console.log("af", res.resname);
        // elt.structure.eachResidue((r) => {
        //   console.log(r.index, r.resno, r.resname);
        // });
        // console.log(
        //   elt,
        //   res.resname,
        //   res.resno,
        //   res.qualifiedName(),
        //   startPos + mouseCol - 3
        // );
        // console.log(index, "l2", elt.structure.getSequence().join(""));
        // for (let i = 0; i < 50; i++) {
        //   console.log(
        //     i,
        //     selected[0].pdb.startPos,
        //     selected[0].pdb.endPos,
        //     elt.structure.getResidueProxy(i).qualifiedName()
        //   );
        // }
        // const cp = elt.structure.getResidueProxy(
        //   (mouseCol || 0) + selected[0].pdb.startPos
        // );
        //
        if (k) {
          const ap = elt.structure.getAtomProxy();
          ap.index = k.atomOffset;

          annots.push(
            elt.addAnnotation(ap.positionToVector3(), cp.qualifiedName())
          );
        }
      }
      stage.viewer.requestRender();
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

      <div ref={stageElementRef} style={{ width: 600, height: 400 }} />
    </div>
  ) : null;
});
