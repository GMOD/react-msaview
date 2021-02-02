import PluginManager from "@jbrowse/core/PluginManager";
import ImportFormComponent from "./ImportForm";
import colorSchemes from "./colorSchemes";
import Color from "color";

const defaultColorScheme = "maeditor";
const colorScheme = colorSchemes[defaultColorScheme];

export default (pluginManager: PluginManager) => {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { observer } = jbrequire("mobx-react");
  const { useTheme } = jbrequire("@material-ui/core/styles");
  const ImportForm = jbrequire(ImportFormComponent);

  const TreeCanvas = observer(({ model }: { model: any }) => {
    const { tree } = model;
    return (
      <>
        <g fill="none" stroke="#000">
          {tree.links().map(({ source, target }: any) => {
            const { x: sx, y: sy } = source;
            const { x: tx, y: ty } = target;
            const path = `M${sy} ${sx}V${tx}H${ty}`;
            return <path key={path} d={path} />;
          })}
        </g>

        {tree.leaves().map((node: any) => {
          const {
            x,
            y,
            data: { name },
          } = node;
          return (
            <text key={`${name}-${x}-${y}`} x={y} y={x}>
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
    const { msa, tree } = model;

    const theme = useTheme();
    // const session = getSession(model);
    // const theme = createJBrowseTheme(getConf(session, "theme"));
    if (!msa) {
      return null;
    }

    return (
      <g transform={`translate(0 2)`}>
        {tree.leaves().map((node: any) => {
          const {
            x,
            data: { name },
          } = node;
          // const ypos = y;
          const curr = msa.alns.find((aln: any) => aln.id === name);

          return curr.seq.split("").map((letter: string, index: number) => {
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
    const { height, initialized, margin, totalHeight } = model;
    const treeWidth = 300;

    if (!initialized) {
      return <ImportForm model={model} />;
    }

    return (
      <div style={{ height, overflow: "auto", display: "flex" }}>
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
