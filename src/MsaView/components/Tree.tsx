import PluginManager from "@jbrowse/core/PluginManager";
import { blockSize, MsaViewModel } from "../model";
import normalizeWheel from "normalize-wheel";

export default function(pluginManager: PluginManager) {
  const { observer } = pluginManager.lib["mobx-react"];
  const React = pluginManager.lib["react"];
  const { useEffect, useRef } = React;
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
      const ref = useRef<HTMLCanvasElement>(null);
      const clickRef = useRef<HTMLCanvasElement>(null);
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
        if (!ref.current || !clickRef.current) {
          return;
        }
        const ctx = ref.current.getContext("2d");
        const clickCtx = clickRef.current.getContext("2d");
        if (!ctx || !clickCtx) {
          return;
        }

        // do operations in parallel on ctx, clickCtx
        [ctx, clickCtx].forEach(context => {
          context.resetTransform();
          context.clearRect(0, 0, width, blockSize);
          context.translate(margin.left, -offset);
        });

        ctx.font = ctx.font.replace(/\d+px/, `${rowHeight - 12}px`);

        hierarchy.links().forEach(({ source, target }: any) => {
          const y = showBranchLen ? "len" : "y";
          const { x: sy, [y]: sx } = source;
          const { x: ty, [y]: tx } = target;

          const y1 = Math.min(sy, ty);
          const y2 = Math.max(sy, ty);
          //1d line intersection
          //https://eli.thegreenplace.net/2008/08/15/intersection-of-1d-segments
          if (offset + blockSize >= y1 && y2 >= offset) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, ty);
            ctx.lineTo(tx, ty);
            ctx.stroke();
          }
        });
        if (rowHeight >= 10) {
          hierarchy.links().forEach(({ source, target }: any) => {
            const y = showBranchLen ? "len" : "y";
            const {
              x: sy,
              [y]: sx,
              data: { name: sourceName },
            } = source;
            const {
              x: ty,
              [y]: tx,
              data: { name: targetName },
            } = target;

            //-5 and +5 for boundaries
            if (sy > offset - 5 && sy < offset + blockSize + 5) {
              ctx.strokeStyle = "black";
              //@ts-ignore complains about includes...
              ctx.fillStyle = collapsed.includes(sourceName)
                ? "black"
                : "white";
              ctx.beginPath();
              ctx.arc(sx, sy, 3.5, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();

              clickCtx.fillStyle = "red";
              clickCtx.beginPath();
              clickCtx.arc(sx, sy, 3.5, 0, 2 * Math.PI);
              clickCtx.fill();

              //@ts-ignore complains about includes...
              if (collapsed.includes(targetName)) {
                ctx.fillStyle = "black";
                ctx.beginPath();
                ctx.arc(tx, ty, 3.5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
              }
            }
          });

          ctx.fillStyle = "black";
          hierarchy.leaves().forEach((node: any) => {
            const { x: y, y: x, data, len } = node;
            const { name } = data;
            //-5 and +5 for boundaries
            if (y > offset - 5 && y < offset + blockSize + 5) {
              //+rowHeight/4 synchronizes with -rowHeight/4 in msa
              ctx.fillText(name, showBranchLen ? len : x, y + rowHeight / 4);
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
        <>
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
            onClick={event => {
              const x = event.nativeEvent.offsetX;
              const y = event.nativeEvent.offsetY;
              if (!clickRef.current) {
                return;
              }
              const ctx = clickRef.current.getContext("2d");
              if (!ctx) {
                return;
              }
              const { data } = ctx.getImageData(x, y, 1, 1);
              const r = data[0];
              const g = data[1];
              const b = data[2];
              const a = data[3];
              console.log(r, g, b, a);
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
    const delta = useRef(0);
    const { treeWidth: width, height, blocksY } = model;

    useEffect(() => {
      const curr = divRef.current;
      if (!curr) {
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

  return TreeCanvas;
}
