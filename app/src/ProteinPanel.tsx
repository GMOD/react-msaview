import React, { useCallback, useMemo, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Button, Select, MenuItem, TextField } from "@material-ui/core";
import { StaticDatasource, DatasourceRegistry } from "ngl";
import { AppModel } from "./model";
import { Stage, StructureComponent, useComponent, useStage } from "react-ngl";

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
    reprType,
    nglSelection,
    pdbFile,
  }: {
    model: AppModel;
    isMouseHovering: boolean;
    reprType: string;
    nglSelection: string;
    pdbFile: string;
  }) => {
    const stage = useStage();
    const myListener = useCallback(() => {}, []);
    // useEffect(() => {
    //   if (stage) {
    //     setTimeout(() => {
    //       stage.autoView();
    //     }, 100);
    //   }
    // }, []);

    const reprList = useMemo(() => {
      return [{ type: reprType }] as any;
    }, [reprType]);

    useEffect(() => {
      stage.signals.hovered.add(myListener);
      return () => stage.signals.hovered.remove(myListener);
    }, [myListener, stage.signals.hovered]);

    return (
      <StructureComponent
        path={pdbFile}
        reprList={reprList}
        selection={nglSelection}
        onLoad={() => stage.autoView()}
      >
        <ProteinComponent model={model} isMouseHovering={isMouseHovering} />
      </StructureComponent>
    );
  }
);

export const ProteinPanel = observer(({ model }: { model: AppModel }) => {
  const [reprType, setReprType] = useState("cartoon");
  const { msaview, nglSelection } = model;
  const { selectedStructures } = msaview;
  const [isMouseHovering, setMouseHovering] = useState(false);

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
  //
  //
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
          value={reprType}
          onChange={(event) => setReprType(event.target.value as string)}
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
          <ProteinElement
            model={model}
            reprType={reprType}
            isMouseHovering={isMouseHovering}
            nglSelection={nglSelection}
            pdbFile={`data://${selectedStructures[0].structure.pdb}.pdb`}
          />
        </Stage>
      </div>
    </div>
  ) : null;
});
