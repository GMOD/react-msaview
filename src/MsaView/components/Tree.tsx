import PluginManager from "@jbrowse/core/PluginManager";
import { blockSize, MsaViewModel } from "../model";
import normalizeWheel from "normalize-wheel";

const radius = 3.5;
const d = radius * 2;

function randomColor() {
  return [
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
  ];
}

type StrMap = { [key: string]: string };

export default function(pluginManager: PluginManager) {
  const { observer } = pluginManager.lib["mobx-react"];
  const React = pluginManager.lib["react"];
  const { useEffect, useRef, useState } = React;
  const TreeBlock = observer(
    ({
      model,
      height,
      offsetY,
    }: {
      model: MsaViewModel;
      height: number;
      offsetY: number;
    }) => {
      const ref = useRef<HTMLCanvasElement>(null);
      const clickRef = useRef<HTMLCanvasElement>(null);
      const [colorMap, setColorMap] = useState<StrMap>({});
      const {
        hierarchy,
        rowHeight,
        scrollY,
        treeWidth: width,
        showBranchLen,
        collapsed,
        margin,
        noTree,
      } = model;

      useEffect(() => {
        if (!ref.current || !clickRef.current) {
          return;
        }
        const ctx = ref.current.getContext("2d");
        const clickCtx = clickRef.current.getContext("2d");
        if (!ctx || !clickCtx) {
          return;
        }
        const colorHash: StrMap = {};
        // do operations in parallel on ctx, clickCtx
        [ctx, clickCtx].forEach(context => {
          context.resetTransform();
          context.clearRect(0, 0, width, blockSize);
          context.translate(margin.left, -offsetY);
        });

        ctx.font = ctx.font.replace(
          /\d+px/,
          `${Math.max(12, rowHeight - 12)}px`,
        );

        if (!noTree) {
          hierarchy.links().forEach(({ source, target }: any) => {
            const y = showBranchLen ? "len" : "y";
            const { x: sy, [y]: sx } = source;
            const { x: ty, [y]: tx } = target;

            const y1 = Math.min(sy, ty);
            const y2 = Math.max(sy, ty);
            //1d line intersection to check if line crosses block at all, this is
            //an optimization that allows us to skip drawing most tree links
            //outside the block
            if (offsetY + blockSize >= y1 && y2 >= offsetY) {
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx, ty);
              ctx.lineTo(tx, ty);
              ctx.stroke();
            }
          });

          hierarchy.descendants().forEach(node => {
            const val = showBranchLen ? "len" : "y";
            const {
              //@ts-ignore
              x: y,
              //@ts-ignore
              [val]: x,
              data: { name },
            } = node;

            //-5 and +5 to make sure it gets drawn across block boundaries
            if (y > offsetY - 5 && y < offsetY + blockSize + 5) {
              ctx.strokeStyle = "black";
              ctx.fillStyle = collapsed.includes(name) ? "black" : "white";
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();

              const col = randomColor();
              const [r, g, b] = col;
              colorHash[`${col}`] = name;

              clickCtx.fillStyle = `rgb(${r},${g},${b})`;
              clickCtx.fillRect(x - radius, y - radius, d, d);
            }
          });
        }

        if (rowHeight >= 10) {
          ctx.fillStyle = "black";
          hierarchy.leaves().forEach((node: any) => {
            const { x: y, y: x, data, len } = node;
            const { name } = data;
            //-5 and +5 to make sure to draw across block boundaries
            if (y > offsetY - 5 && y < offsetY + blockSize + 5) {
              //x:+d makes the text a little to the right of the node
              //y:+rowHeight/4 synchronizes with -rowHeight/4 in msa (kinda weird)
              ctx.fillText(
                name,
                (showBranchLen ? len : x) + d,
                y + rowHeight / 4,
              );
            }
          });
        }
        setColorMap(colorHash);
      }, [
        collapsed,
        rowHeight,
        margin.left,
        hierarchy,
        offsetY,
        width,
        showBranchLen,
        noTree,
      ]);
      return (
        <>
          <canvas
            width={width}
            height={height}
            style={{
              width,
              height,
              top: scrollY + offsetY,
              left: 0,
              position: "absolute",
            }}
            onMouseMove={event => {
              if (!ref.current) {
                return;
              }
              const x = event.nativeEvent.offsetX;
              const y = event.nativeEvent.offsetY;
              if (!clickRef.current) {
                return;
              }
              const clickCtx = clickRef.current.getContext("2d");
              if (!clickCtx) {
                return;
              }
              const { data } = clickCtx.getImageData(x, y, 1, 1);

              const col = [data[0], data[1], data[2]];
              const name = colorMap[`${col}`];
              if (name) {
                ref.current.style.cursor = "pointer";
              } else {
                ref.current.style.cursor = "default";
              }
            }}
            onClick={event => {
              const x = event.nativeEvent.offsetX;
              const y = event.nativeEvent.offsetY;
              if (!clickRef.current) {
                return;
              }
              const clickCtx = clickRef.current.getContext("2d");
              if (!clickCtx) {
                return;
              }
              const { data } = clickCtx.getImageData(x, y, 1, 1);
              const col = [data[0], data[1], data[2]];
              const name = colorMap[`${col}`];
              if (name) {
                model.data.toggleCollapsed(name);
              }
            }}
            ref={ref}
          />
          <canvas
            style={{ display: "none" }}
            width={width}
            height={height}
            ref={clickRef}
          />
        </>
      );
    },
  );
  const TreeCanvas = observer(({ model }: { model: MsaViewModel }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const scheduled = useRef(false);
    const deltaY = useRef(0);
    const { treeWidth: width, height, blocksY } = model;

    useEffect(() => {
      const curr = divRef.current;
      if (!curr) {
        return;
      }
      function onWheel(origEvent: WheelEvent) {
        const event = normalizeWheel(origEvent);
        deltaY.current += event.pixelY;

        if (!scheduled.current) {
          scheduled.current = true;
          requestAnimationFrame(() => {
            model.doScrollY(-deltaY.current);
            deltaY.current = 0;
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
            offsetY={block}
            height={blockSize}
          />
        ))}
      </div>
    );
  });

  return TreeCanvas;
}
