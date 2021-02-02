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
  const { IconButton, Typography } = jbrequire("@material-ui/core");
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
    const { MSA, pxPerBp: space } = model;
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
          return MSA.getRow(name)?.map((letter: string, index: number) => {
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
    const { treeWidth, done, showBranchLen, initialized, margin } = model;

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
              }}
            >
              <FolderOpenIcon />
            </IconButton>
            <label htmlFor="showbranch">Show branch len?</label>
            <input
              type="checkbox"
              checked={showBranchLen}
              id="showbranch"
              onChange={() => model.toggleBranchLen()}
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
              <svg
                style={{ height: totalHeight + margin.top, width: msaWidth }}
              >
                <g transform={`translate(0 ${margin.top})`}>
                  <MSA model={model} />
                </g>
              </svg>
            </div>
          </div>
        </div>
      );
    }
  });
};
