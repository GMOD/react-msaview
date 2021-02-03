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
    const {
      hierarchy,
      showBranchLen,
      collapsed,
      treeWidth: width,
      totalHeight: height,
      margin,
    } = model;
    const ref = useRef();
    const h = Math.min(height, 2000);

    useEffect(() => {
      if (!ref.current) {
        return;
      }

      const ctx = ref.current.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.translate(margin.left, margin.top);
      ctx.clearRect(0, 0, width, h);
      hierarchy.links().forEach(({ source, target }: any) => {
        const y = showBranchLen ? "len" : "y";
        const { x: sx, [y]: sy } = source;
        const { x: tx, [y]: ty } = target;
        ctx.beginPath();
        ctx.moveTo(sy, sx);
        ctx.lineTo(sy, tx);
        ctx.lineTo(ty, tx);
        ctx.stroke();
      });
      hierarchy.links().forEach(({ source, target }: any, index: number) => {
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

        ctx.strokeStyle = "black";
        ctx.fillStyle = collapsed.includes(sourceName) ? "black" : "white";
        ctx.beginPath();
        ctx.arc(sy, sx, 3.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        if (collapsed.includes(target.data.name)) {
          ctx.fillStyle = collapsed.includes(targetName) ? "black" : "white";
          ctx.beginPath();
          ctx.arc(ty, tx, 3.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      });

      ctx.fillStyle = "black";
      hierarchy.leaves().forEach((node: any) => {
        const { x, y, data, len } = node;
        const { name } = data;
        ctx.fillText(name, showBranchLen ? len : y, x + 4);
      });
    }, [
      collapsed,
      hierarchy,
      width,
      h,
      margin.left,
      margin.top,
      showBranchLen,
    ]);

    return (
      <canvas
        width={width}
        height={h + margin.top}
        style={{ width, height: h + margin.top }}
        ref={ref}
      />
    );
  });

  const LETTER_HEIGHT = 20;
  const MSA = observer(({ model }: { model: any }) => {
    const { MSA, pxPerBp, bgColor, margin } = model;
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
      ctx.translate(0, 8 + margin.top);
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
            ctx.fillRect(
              index * pxPerBp,
              x - LETTER_HEIGHT,
              pxPerBp,
              LETTER_HEIGHT,
            );
          }
          ctx.fillStyle = bgColor ? contrast : color || "black";
          ctx.fillText(
            letter,
            index * pxPerBp + pxPerBp / 2,
            x - LETTER_HEIGHT / 4,
          );
        });
      });
    }, [MSA, bgColor, pxPerBp, hierarchy, theme.palette]);

    return <canvas ref={ref} style={{ width: "100%", height: "100%" }} />;
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
      const { totalHeight, height, msaWidth } = model;

      return (
        <div style={{ height, overflow: "auto" }}>
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
            <TreeCanvas model={model} />
            <div
              style={{
                width: "100%",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  height: totalHeight + margin.top,
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
