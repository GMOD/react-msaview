import React, { useCallback, useMemo, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Button, Select, MenuItem, TextField } from "@material-ui/core";
import { StaticDatasource, DatasourceRegistry } from "ngl";
import { AppModel } from "./model";
import { Stage, Component, useComponent, useStage } from "react-ngl";

DatasourceRegistry.add(
  "data",
  new StaticDatasource("https://files.rcsb.org/download/")
);

const ProteinComponent = observer(
  ({
    model,
    isMouseHovering,
  }: {
    model: AppModel;
    isMouseHovering: boolean;
  }) => {
    const component = useComponent();
    const stage = useStage();

    const [annotation, setAnnotation] = useState<any>([]);
    const { mouseCol, selectedStructures } = model.msaview;

    useEffect(() => {
      if (!isMouseHovering) {
        let annots: any;
        if (annotation) {
          component.removeAnnotation(annotation);
        }
        if (mouseCol !== undefined && selectedStructures.length) {
          const { startPos } = selectedStructures[0].structure;

          let k;
          const rn = component.structure.residueStore.count;
          const rp = component.structure.getResidueProxy();
          for (let i = 0; i < rn; ++i) {
            rp.index = i;
            if (rp.resno === mouseCol + startPos - 1) {
              k = rp;
              break;
            }
          }

          if (k) {
            const ap = component.structure.getAtomProxy();
            ap.index = k.atomOffset;

            annots = component.addAnnotation(
              ap.positionToVector3(),
              k.qualifiedName()
            );
          }
        }

        stage.viewer.requestRender();
        setAnnotation(annots);
      }
    }, [model, mouseCol, isMouseHovering, JSON.stringify(selectedStructures)]);

    return <></>;
  }
);

const ProteinElement = observer(
  ({
    model,
    isMouseHovering,
  }: {
    model: AppModel;
    isMouseHovering: boolean;
  }) => {
    const stage = useStage();
    const myListener = useCallback(() => {}, []);

    const reprList = useMemo(() => {
      return [{ type: "cartoon" }] as any;
    }, []);

    useEffect(() => {
      stage.signals.hovered.add(myListener);
      return () => stage.signals.hovered.remove(myListener);
    }, [myListener, stage.signals.hovered]);

    return (
      <Component path="rcsb://4hhb" reprList={reprList}>
        <ProteinComponent model={model} isMouseHovering={isMouseHovering} />
      </Component>
    );
  }
);

export const ProteinPanel = observer(({ model }: { model: AppModel }) => {
  const [type, setType] = useState("cartoon");
  const { msaview, nglSelection } = model;
  const { selectedStructures } = msaview;
  const [isMouseHovering, setMouseHovering] = useState(false);

  // const stageElementRef = useCallback((element) => {
  //   if (element) {
  //     const currentStage = new Stage(element);
  //     setStage(currentStage);
  //   }
  // }, []);

  // useEffect(() => {
  //   return () => {
  //     if (stage) {
  //       stage.dispose();
  //     }
  //   };
  // }, [stage]);

  // useEffect(() => {
  //   // Handle window resizing
  //   window.addEventListener("resize", () => {
  //     if (stage) {
  //       stage.handleResize();
  //     }
  //   });
  // }, [stage]);

  // useEffect(() => {
  //   (async () => {
  //     if (!selectedStructures.length || !stage) {
  //       return;
  //     }

  //     const res = await Promise.all(
  //       selectedStructures.map((selection) =>
  //         stage.loadFile(`data://${selection.structure.pdb}.pdb`)
  //       )
  //     );

  //     stage.signals.hovered.add((pickingProxy: any) => {
  //       if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
  //         const atom = pickingProxy.atom || pickingProxy.closestBondAtom;
  //         msaview.setMouseoveredColumn(
  //           atom.resno - selectedStructures[0].structure.startPos,
  //           atom.chainname,
  //           pickingProxy.picker.structure.name
  //         );
  //       }
  //     });
  //     setRes(res);
  //   })();
  // }, [JSON.stringify(selectedStructures), stage]);

  // useEffect(() => {
  //   if (stage) {
  //     res.forEach((elt) => {
  //       elt.removeAllRepresentations();
  //       elt.addRepresentation(type, { sele: nglSelection });
  //     });
  //     stage.autoView();
  //   }
  // }, [type, res, stage, nglSelection]);

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
        onMouseOver={() => setMouseHovering(true)}
        onMouseLeave={() => setMouseHovering(false)}
      >
        <Stage width="600px" height="400px">
          <ProteinElement model={model} isMouseHovering={isMouseHovering} />
        </Stage>
      </div>
    </div>
  ) : null;
});
