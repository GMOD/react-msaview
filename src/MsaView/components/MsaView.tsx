import PluginManager from "@jbrowse/core/PluginManager";
import ImportFormComponent from "./ImportForm";
import { colorSchemes, colorContrasts } from "./colorSchemes";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import normalizeWheel from "normalize-wheel";
import { blockSize, MsaViewModel } from "../model";
import SettingsIcon from "@material-ui/icons/Settings";
import SettingsDlg from "./SettingsDlg";
export default (pluginManager: PluginManager) => {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { useEffect, useRef, useState } = React;
  const { observer } = jbrequire("mobx-react");
  const { useTheme } = jbrequire("@material-ui/core/styles");
  const { IconButton, Typography } = jbrequire("@material-ui/core");
  const ImportForm = jbrequire(ImportFormComponent);
  const SettingsDialog = jbrequire(SettingsDlg);

  const TreeBlock = observer(
    ({
      model,
      height,
      offset,
    }: {
      model: MsaViewModel;
      height: number;
      offset: number;
    }) => {
      const ref = useRef();
      const {
        hierarchy,
        rowHeight,
        scrollY,
        treeWidth: width,
        showBranchLen,
        collapsed,
        margin,
      } = model;
      useEffect(() => {
        const ctx = ref.current.getContext("2d");

        ctx.resetTransform();
        ctx.clearRect(0, 0, width, blockSize);
        ctx.translate(margin.left, -offset);

        hierarchy.links().forEach(({ source, target }: any) => {
          const y = showBranchLen ? "len" : "y";
          const { x: sx, [y]: sy } = source;
          const { x: tx, [y]: ty } = target;

          const y1 = offset;
          const y2 = offset + blockSize;
          const x1 = Math.min(sx, tx);
          const x2 = Math.max(sx, tx);
          //1d line intersection
          //https://eli.thegreenplace.net/2008/08/15/intersection-of-1d-segments
          if (x2 >= y1 && y2 >= x1) {
            ctx.beginPath();
            ctx.moveTo(sy, sx);
            ctx.lineTo(sy, tx);
            ctx.lineTo(ty, tx);
            ctx.stroke();
          }
        });
        if (rowHeight >= 10) {
          hierarchy.links().forEach(({ source, target }: any) => {
            const y = showBranchLen ? "len" : "y";
            const {
              x: sx,
              [y]: sy,
              data: { name: sourceName },
            } = source;
            const {
              x: tx,
              [y]: ty,
              data: { name: targetName },
            } = target;

            //-5 and +5 for boundaries
            if (sx > offset - 5 && sx < offset + blockSize + 5) {
              ctx.strokeStyle = "black";
              //@ts-ignore complains about includes...
              ctx.fillStyle = collapsed.includes(sourceName)
                ? "black"
                : "white";
              ctx.beginPath();
              ctx.arc(sy, sx, 3.5, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();

              //@ts-ignore complains about includes...
              if (collapsed.includes(targetName)) {
                ctx.fillStyle = "black";
                ctx.beginPath();
                ctx.arc(ty, tx, 3.5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
              }
            }
          });

          ctx.fillStyle = "black";
          hierarchy.leaves().forEach((node: any) => {
            const { x, y, data, len } = node;
            const { name } = data;
            //-5 and +5 for boundaries
            if (x > offset - 5 && x < offset + blockSize + 5) {
              ctx.fillText(name, showBranchLen ? len : y, x + 4);
            }
          });
        }
      }, [
        collapsed,
        rowHeight,
        margin.left,
        hierarchy,
        offset,
        width,
        showBranchLen,
      ]);
      return (
        <canvas
          width={width}
          height={height}
          style={{
            width,
            height,
            top: scrollY + offset,
            left: 0,
            position: "absolute",
          }}
          ref={ref}
        />
      );
    },
  );
  const TreeCanvas = observer(({ model }: { model: MsaViewModel }) => {
    const divRef = useRef();
    const scheduled = useRef(false);
    const delta = useRef(0);
    const { treeWidth: width, height, blocksY } = model;

    useEffect(() => {
      const curr = divRef.current;
      if (!divRef.current) {
        return;
      }
      function onWheel(origEvent: WheelEvent) {
        const event = normalizeWheel(origEvent);
        delta.current += event.pixelY;

        if (!scheduled.current) {
          scheduled.current = true;
          requestAnimationFrame(() => {
            model.doScrollY(-delta.current);
            delta.current = 0;
            scheduled.current = false;
          });
        }
        origEvent.preventDefault();
      }
      curr.addEventListener("wheel", onWheel);
      return () => {
        curr.removeEventListener("wheel", onWheel);
      };
    }, [model]);

    return (
      <div
        ref={divRef}
        style={{
          height,
          position: "relative",
          overflow: "hidden",
          width,
        }}
      >
        {blocksY.map(block => (
          <TreeBlock
            key={block}
            model={model}
            offset={block}
            height={blockSize}
          />
        ))}
      </div>
    );
  });

  const MSABlock = observer(
    ({
      model,
      width,
      offset,
    }: {
      model: MsaViewModel;
      width: number;
      offset: number;
    }) => {
      const {
        MSA,
        pxPerBp,
        bgColor,
        margin,
        rowHeight,
        scrollY,
        scrollX,
        hierarchy,
        colorSchemeName,
      } = model;
      const theme = useTheme();
      const colorScheme = colorSchemes[colorSchemeName];
      const colorContrast = colorContrasts(theme)[colorSchemeName];
      const ref = useRef();

      if (!MSA) {
        return null;
      }

      useEffect(() => {
        if (!ref.current) {
          return;
        }

        const ctx = ref.current.getContext("2d");
        if (!ctx) {
          return;
        }
        ctx.resetTransform();
        ctx.clearRect(0, 0, blockSize, blockSize);
        ctx.translate(-offset, rowHeight / 2);
        ctx.textAlign = "center";

        hierarchy.leaves().map((node: any) => {
          const {
            x: y,
            data: { name },
          } = node;
          return MSA.getRow(name)?.map((letter: string, index: number) => {
            const color = (colorScheme as any)[letter];
            if (bgColor) {
              const x = index * pxPerBp;
              if (x > offset - 10 && x < offset + width + 10) {
                ctx.fillStyle = color || "white";
                ctx.fillRect(x, y - rowHeight, pxPerBp, rowHeight);
              }
            }
          });
        });

        if (rowHeight >= 10 && pxPerBp >= 7) {
          hierarchy.leaves().map((node: any) => {
            const {
              x: y,
              data: { name },
            } = node;

            return MSA.getRow(name)?.map((letter: string, index: number) => {
              const color = (colorScheme as any)[letter];
              const contrast = colorContrast[letter] || "black";
              const x = index * pxPerBp;
              if (x > offset - 10 && x < offset + width + 10) {
                ctx.fillStyle = bgColor ? contrast : color || "black";
                ctx.fillText(letter, x + pxPerBp / 2, y - rowHeight / 4);
              }
            });
          });
        }
      }, [
        MSA,
        bgColor,
        rowHeight,
        pxPerBp,
        hierarchy,
        offset,
        width,
        margin.top,
        colorSchemeName,
        theme.palette,
      ]);

      return (
        <canvas
          ref={ref}
          width={blockSize}
          height={blockSize}
          style={{
            position: "absolute",
            top: scrollY,
            left: scrollX + offset,
            width: blockSize,
            height: blockSize,
          }}
        />
      );
    },
  );

  const MSACanvas = observer(({ model }: { model: MsaViewModel }) => {
    const { MSA, width, height, treeWidth, blocksX } = model;
    const divRef = useRef();
    const scheduled = useRef(false);
    const delta = useRef(0);

    if (!MSA) {
      return null;
    }

    useEffect(() => {
      const curr = divRef.current;
      if (!divRef.current) {
        return;
      }
      function onWheel(origEvent: WheelEvent) {
        const event = normalizeWheel(origEvent);
        delta.current += event.pixelX;

        if (!scheduled.current) {
          scheduled.current = true;
          requestAnimationFrame(() => {
            model.doScrollX(-delta.current);
            delta.current = 0;
            scheduled.current = false;
          });
        }
        origEvent.preventDefault();
      }
      curr.addEventListener("wheel", onWheel);
      return () => {
        curr.removeEventListener("wheel", onWheel);
      };
    }, [model]);

    return (
      <div
        ref={divRef}
        style={{
          position: "relative",
          height,
          width: width - treeWidth,
          overflow: "hidden",
        }}
      >
        {blocksX.map(block => (
          <MSABlock
            key={block}
            model={model}
            offset={block}
            width={blockSize}
          />
        ))}
      </div>
    );
  });

  return observer(({ model }: { model: MsaViewModel }) => {
    const { done, initialized } = model;
    const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);

    if (!initialized) {
      return <ImportForm model={model} />;
    } else if (!done) {
      return <Typography variant="h4">Loading...</Typography>;
    } else {
      const { height } = model;

      return (
        <div style={{ height }}>
          <div style={{ display: "block" }}>
            <IconButton
              onClick={() => {
                model.setData({ tree: "", msa: "" });
                model.setTreeFilehandle(undefined);
                model.setMSAFilehandle(undefined);
                model.setScrollY(0);
              }}
            >
              <FolderOpenIcon />
            </IconButton>
            <IconButton
              onClick={() => {
                setSettingsDialogVisible(true);
              }}
            >
              <SettingsIcon />
            </IconButton>
            <SettingsDialog
              open={settingsDialogVisible}
              model={model}
              onClose={() => setSettingsDialogVisible(false)}
            />
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
            }}
          >
            <TreeCanvas model={model} />
            <MSACanvas model={model} />
          </div>
        </div>
      );
    }
  });
};
