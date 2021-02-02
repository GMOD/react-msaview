import PluginManager from "@jbrowse/core/PluginManager";
import ImportFormComponent from "./ImportForm";
import colorSchemes from "./colorSchemes";
import Color from "color";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";

const defaultColorScheme = "maeditor";
const colorScheme = colorSchemes[defaultColorScheme];

export default (pluginManager: PluginManager) => {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { observer } = jbrequire("mobx-react");
  const { useTheme } = jbrequire("@material-ui/core/styles");
  const { IconButton } = jbrequire("@material-ui/core");
  const ImportForm = jbrequire(ImportFormComponent);

  const TreeCanvas = observer(({ model }: { model: any }) => {
    const { hierarchy } = model;
    return (
      <>
        <g fill="none" stroke="#000">
          {hierarchy.links().map(({ source, target }: any) => {
            const { x: sx, y: sy } = source;
            const { x: tx, y: ty } = target;
            const path = `M${sy} ${sx}V${tx}H${ty}`;
            return <path key={path} d={path} />;
          })}
        </g>

        {hierarchy.leaves().map((node: any) => {
          const {
            x,
            y,
            data: { name },
          } = node;
          return (
            <text key={`${name}-${x}-${y}`} x={y} y={x + 4}>
              {name}
            </text>
          );
        })}
      </>
    );
  });

  const space = 16;
  const height = 20;
  const MSA = observer(({ model }: { model: any }) => {
    const { MSA } = model;
    const theme = useTheme();
    if (!MSA) {
      return null;
    }

    const { hierarchy } = model;

    return (
      <g transform={`translate(0 6)`}>
        {hierarchy.leaves().map((node: any) => {
          const {
            x,
            data: { name },
          } = node;
          // const ypos = y;
          return MSA.getRow(name).map((letter: string, index: number) => {
            const color = (colorScheme as any)[letter];
            const contrast = color
              ? theme.palette.getContrastText(Color(color).hex())
              : "black";
            return (
              <React.Fragment key={`${name}-${index}`}>
                <rect
                  x={index * space}
                  y={x - height}
                  width={space}
                  height={height}
                  fill={color || "none"}
                />
                <text
                  x={index * space + space / 2}
                  y={x - height / 4}
                  fill={contrast}
                  dominantBaseline="middle"
                  textAnchor="middle"
                >
                  {letter}
                </text>
              </React.Fragment>
            );
          });
        })}
      </g>
    );
  });

  return observer(({ model }: { model: any }) => {
    const { treeWidth, height, initialized, margin } = model;
    if (!initialized) {
      return <ImportForm model={model} />;
    }

    const { totalHeight } = model;

    return (
      <div style={{ height, overflow: "auto", display: "flex" }}>
        <div>
          <IconButton
            onClick={() => {
              model.setData({ tree: "", msa: "" });
            }}
          >
            <FolderOpenIcon />
          </IconButton>
        </div>
        <svg style={{ height: totalHeight + margin.top, width: treeWidth }}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <TreeCanvas model={model} />
          </g>
        </svg>
        <div style={{ width: 20 }} />
        <svg style={{ height: totalHeight + margin.top, width: 1000 }}>
          <g transform={`translate(0 ${margin.top})`}>
            <MSA model={model} />
          </g>
        </svg>
      </div>
    );
  });
};
