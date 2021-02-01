import PluginManager from "@jbrowse/core/PluginManager";
import ImportFormComponent from "./ImportForm";
import colorSchemes from "./colorSchemes";

const defaultColorScheme = "maeditor";
const colorScheme = colorSchemes[defaultColorScheme];

export default (pluginManager: PluginManager) => {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { observer } = jbrequire("mobx-react");
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

  const space = 10;
  const MSA = observer(({ model }: { model: any }) => {
    const { msa, tree, theme } = model;
    if (!msa) {
      return null;
    }

    return (
      <>
        {tree.leaves().map((node: any) => {
          const {
            x,
            y,
            data: { name },
          } = node;
          const ypos = y + 300;
          const curr = msa.alns.find((aln: any) => aln.id === name);
          return curr.seq.split("").map((letter: string, index: number) => {
            const color = (colorScheme as any)[letter];
            const contrast = color
              ? theme.palette.getContrastText(color)
              : "none";
            return (
              <React.Fragment key={`${name}-${index}`}>
                <rect
                  x={ypos + index * space}
                  y={x - space}
                  width={space}
                  height={space}
                  fill={color || "none"}
                />
                <text x={ypos + index * space} y={x} fill={contrast}>
                  {letter}
                </text>
              </React.Fragment>
            );
          });
        })}
      </>
    );
  });

  return observer(({ model }: { model: any }) => {
    const { height, initialized, margin, totalHeight } = model;
    const treeWidth = 300;

    if (!initialized) {
      return <ImportForm model={model} />;
    }

    return (
      <div style={{ height, overflow: "auto" }}>
        <svg style={{ height: totalHeight, width: treeWidth }}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <TreeCanvas model={model} />
            <g transform={`translate(${treeWidth} 0)`}>
              <MSA model={model} />
            </g>
          </g>
        </svg>
      </div>
    );
  });
};
