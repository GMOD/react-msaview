import PluginManager from "@jbrowse/core/PluginManager";
import ImportFormComponent from "./ImportForm";

// import colorSchemes from "./colorSchemes";

// const defaultColorScheme = "maeditor";

// const colorScheme = colorSchemes[defaultColorScheme];

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

  // const space = 10;
  // const MSA = observer(({ model }: { model: any }) => {
  //   const { width, height, msa, tree } = model;
  //   console.log({ tree, msa });
  //   return (
  //     <>
  //       {tree.leaves().map(node => {
  //         const {
  //           x,
  //           y,
  //           data: { name },
  //         } = node;
  //         const ypos = y + 300;
  //         const curr = msa.alns.find(aln => aln.id === name);
  //         return curr.seq.split("").map((letter, index) => {
  //           const color = colorScheme[letter];
  //           // const contrast = color ? theme.palette.getContrastText(color) : 'none'
  //           return (
  //             <React.Fragment key={`${name}-${index}`}>
  //               <rect
  //                 x={ypos + index * space}
  //                 y={x - space}
  //                 width={space}
  //                 height={space}
  //                 fill={color || "none"}
  //               />
  //               <text x={ypos + index * space} y={x}>
  //                 {letter}
  //               </text>
  //             </React.Fragment>
  //           );
  //         });
  //       })}
  //     </>
  //   );
  // });

  return observer(({ model }: { model: any }) => {
    const { width, height, initialized, margin, totalHeight } = model;

    if (!initialized) {
      return <ImportForm model={model} />;
    }

    return (
      <div style={{ height, width, overflow: "auto" }}>
        <svg style={{ height: totalHeight, width }}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <TreeCanvas model={model} />
          </g>
        </svg>
      </div>
    );
  });
};
