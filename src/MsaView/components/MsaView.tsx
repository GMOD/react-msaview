import PluginManager from "@jbrowse/core/PluginManager";
import ImportFormComponent from "./ImportForm";
import colorSchemes from "./colorSchemes";
import Color from "color";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import SettingsIcon from "@material-ui/icons/Settings";

const defaultColorScheme = "maeditor";
const colorScheme = colorSchemes[defaultColorScheme];

export default (pluginManager: PluginManager) => {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { useEffect, useRef, useState } = React;
  const { observer } = jbrequire("mobx-react");
  const { useTheme } = jbrequire("@material-ui/core/styles");
  const {
    IconButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    FormControlLabel,
    Checkbox,
  } = jbrequire("@material-ui/core");
  const ImportForm = jbrequire(ImportFormComponent);

  const TreeCanvas = observer(({ model }: { model: any }) => {
    const { hierarchy, showBranchLen, collapsed } = model;

    return (
      <>
        <g fill="none" stroke="#000">
          <>
            {hierarchy.links().map(({ source, target }: any) => {
              const y = showBranchLen ? "len" : "y";
              const { x: sx, [y]: sy } = source;
              const { x: tx, [y]: ty } = target;
              const path = `M${sy} ${sx}V${tx}H${ty}`;
              return <path key={path} d={path} />;
            })}
            {hierarchy.links().map(({ source, target }: any, index: number) => {
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

              return (
                <React.Fragment key={`${sx},${sy}-${index}`}>
                  <circle
                    cx={sy}
                    cy={sx}
                    r={3.5}
                    fill={collapsed.includes(sourceName) ? "black" : "white"}
                    stroke="black"
                    onClick={() => {
                      model.data.toggleCollapsed(sourceName);
                    }}
                  />
                  {collapsed.includes(target.data.name) ? (
                    <circle
                      cx={ty}
                      cy={tx}
                      r={3.5}
                      fill={collapsed.includes(targetName) ? "black" : "white"}
                      stroke="black"
                      onClick={() => {
                        model.data.toggleCollapsed(targetName);
                      }}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </>
        </g>

        {hierarchy.leaves().map((node: any) => {
          const { x, y, data, len } = node;
          const { name } = data;

          return (
            <text
              key={`${name}-${x}-${y}`}
              x={showBranchLen ? len : y}
              y={x + 4}
              style={{ pointerEvents: "none" }}
            >
              {name}
            </text>
          );
        })}
      </>
    );
  });

  const height = 20;
  const MSA = observer(({ model }: { model: any }) => {
    const { MSA, pxPerBp, bgColor } = model;
    const theme = useTheme();
    const ref = useRef();
    if (!MSA) {
      return null;
    }

    const { hierarchy } = model;
    useEffect(() => {
      if (!ref.current) {
        return;
      }

      const { width: w, height: h } = ref.current.getBoundingClientRect();

      ref.current.width = w;
      ref.current.height = h;

      const ctx = ref.current.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.clearRect(0, 0, w, h);
      //fudge factor
      ctx.translate(0, 8);
      ctx.textAlign = "center";

      hierarchy.leaves().map((node: any) => {
        const {
          x,
          data: { name },
        } = node;
        return MSA.getRow(name)?.map((letter: string, index: number) => {
          const color = (colorScheme as any)[letter];
          const contrast = color
            ? theme.palette.getContrastText(Color(color).hex())
            : "black";
          if (bgColor) {
            ctx.fillStyle = color || "white";
            ctx.fillRect(index * pxPerBp, x - height, pxPerBp, height);
          }
          ctx.fillStyle = bgColor ? contrast : color || "black";
          ctx.fillText(letter, index * pxPerBp + pxPerBp / 2, x - height / 4);
        });
      });
    }, [MSA, bgColor, pxPerBp, hierarchy, theme.palette]);

    return <canvas style={{ width: "100%", height: "100%" }} ref={ref} />;
  });

  const SettingsDialog = observer(
    ({
      model,
      onClose,
      open,
    }: {
      model: any;
      onClose: Function;
      open: boolean;
    }) => {
      return (
        <Dialog onClose={() => onClose()} open={open}>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <FormControlLabel
              control={
                <Checkbox
                  checked={model.showBranchLen}
                  onChange={() => model.toggleBranchLen()}
                />
              }
              label="Show branch length"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={model.bgColor}
                  onChange={() => model.toggleBgColor()}
                />
              }
              label="Color background"
            />
          </DialogContent>
        </Dialog>
      );
    },
  );
  return observer(({ model }: { model: any }) => {
    const { treeWidth, done, initialized, margin } = model;
    const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);

    if (!initialized) {
      return <ImportForm model={model} />;
    } else if (!done) {
      return <Typography variant="h4">Loading...</Typography>;
    } else {
      const { totalHeight, msaWidth } = model;

      return (
        <div>
          <div style={{ display: "block" }}>
            <IconButton
              onClick={() => {
                model.setData({ tree: "", msa: "" });
                model.setTreeFilehandle(undefined);
                model.setMSAFilehandle(undefined);
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
              height: totalHeight + margin.top + 25,
              overflow: "auto",
              display: "flex",
            }}
          >
            <svg style={{ height: totalHeight + margin.top, width: treeWidth }}>
              <g transform={`translate(${margin.left}, ${margin.top})`}>
                <TreeCanvas model={model} />
              </g>
            </svg>
            <div style={{ width: 20 }} />
            <div
              style={{
                width: "100%",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  height: totalHeight + margin.top,
                  paddingTop: margin.top,
                  width: msaWidth,
                }}
              >
                <MSA model={model} />
              </div>
            </div>
          </div>
        </div>
      );
    }
  });
};
