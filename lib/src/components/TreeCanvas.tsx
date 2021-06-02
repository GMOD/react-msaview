import React, { useEffect, useRef, useState } from "react";
import { Menu, MenuItem } from "@material-ui/core";
import normalizeWheel from "normalize-wheel";
import { observer } from "mobx-react";
import { MsaViewModel } from "../model";

const extendBounds = 5;
const radius = 3.5;
const d = radius * 2;

function randomColor() {
  return [
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
  ];
}

type StrMap = { [key: string]: { id: string; name: string } };
interface TooltipData {
  name: string;
  id: string;
  x: number;
  y: number;
}
const TreeBlock = observer(
  ({ model, offsetY }: { model: MsaViewModel; offsetY: number }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const clickRef = useRef<HTMLCanvasElement>(null);
    const [colorMap, setColorMap] = useState<StrMap>({});
    const [hovering, setHovering] = useState<TooltipData>();
    const {
      hierarchy,
      rowHeight,
      scrollY,
      treeWidth: width,
      showBranchLen,
      collapsed,
      margin,
      noTree,
      blockSize,
      drawNodeBubbles,
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
      [ctx, clickCtx].forEach((context) => {
        context.resetTransform();
        context.clearRect(0, 0, width, blockSize);
        context.translate(margin.left, -offsetY);
      });

      const font = ctx.font;
      ctx.font = font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`);

      if (!noTree) {
        hierarchy.links().forEach(({ source, target }) => {
          const {
            x: sy,
            y: sx,
            data: { len: slen },
          } = source;
          const {
            x: ty,
            y: tx,
            data: { len: tlen },
          } = target;
          const seffx = showBranchLen ? slen : sx;
          const teffx = showBranchLen ? tlen : tx;

          const y1 = Math.min(sy, ty);
          const y2 = Math.max(sy, ty);
          //1d line intersection to check if line crosses block at all, this
          //is an optimization that allows us to skip drawing most tree links
          //outside the block
          if (offsetY + blockSize >= y1 && y2 >= offsetY) {
            ctx.beginPath();
            ctx.moveTo(seffx, sy);
            ctx.lineTo(seffx, ty);
            ctx.lineTo(teffx, ty);
            ctx.stroke();
          }
        });

        if (drawNodeBubbles) {
          hierarchy.descendants().forEach((node) => {
            const { x: y, y: x, data } = node;
            const { len, id } = data;
            const effx = showBranchLen ? len : x;

            if (
              y > offsetY - extendBounds &&
              y < offsetY + blockSize + extendBounds
            ) {
              ctx.strokeStyle = "black";
              ctx.fillStyle = collapsed.includes(id) ? "black" : "white";
              ctx.beginPath();
              ctx.arc(effx, y, radius, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();

              const col = randomColor();
              const [r, g, b] = col;
              colorHash[`${col}`] = data;

              clickCtx.fillStyle = `rgb(${r},${g},${b})`;
              clickCtx.fillRect(effx - radius, y - radius, d, d);
            }
          });
        }
      }

      if (rowHeight >= 10) {
        ctx.fillStyle = "black";
        hierarchy.leaves().forEach((node) => {
          const { x: y, y: x, data } = node;
          const { name, len } = data;
          if (
            y > offsetY - extendBounds &&
            y < offsetY + blockSize + extendBounds
          ) {
            //note: +rowHeight/4 matches with -rowHeight/4 in msa
            ctx.fillText(
              name,
              (showBranchLen ? len : x) + d,
              y + rowHeight / 4
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
      blockSize,
      drawNodeBubbles,
    ]);

    function decode(event: React.MouseEvent) {
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
      return { ...colorMap[`${col}`], x, y };
    }
    function handleClose() {
      setHovering(undefined);
    }
    return (
      <>
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            left: hovering?.x || 0,
            top: scrollY + offsetY + (hovering?.y || 0),
          }}
        />
        {hovering && hovering.id ? (
          <Menu
            anchorEl={menuRef.current}
            transitionDuration={0}
            keepMounted
            open={Boolean(menuRef.current)}
            onClose={handleClose}
          >
            <MenuItem
              dense
              onClick={() => {
                model.toggleCollapsed(hovering.id);
                handleClose();
              }}
            >
              {model.collapsed.includes(hovering.id) ? "Expand" : "Collapse"}
            </MenuItem>
          </Menu>
        ) : null}
        <canvas
          width={width}
          height={blockSize}
          style={{
            width,
            height: blockSize,
            top: scrollY + offsetY,
            left: 0,
            position: "absolute",
          }}
          onMouseMove={(event) => {
            if (!ref.current) {
              return;
            }
            const data = decode(event);
            if (data) {
              if (data.id) {
                ref.current.style.cursor = "pointer";
              } else {
                ref.current.style.cursor = "default";
              }
            }
          }}
          onClick={(event) => {
            const data = decode(event);
            if (data && data.id) {
              setHovering(data);
            }
          }}
          ref={ref}
        />
        <canvas
          style={{ display: "none" }}
          width={width}
          height={blockSize}
          ref={clickRef}
        />
      </>
    );
  }
);
const TreeCanvas = observer(({ model }: { model: MsaViewModel }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scheduled = useRef(false);
  const deltaY = useRef(0);
  const { treeWidth: width, height, blocksY } = model;

  useEffect(() => {
    const curr = ref.current;
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
      ref={ref}
      style={{
        height,
        position: "relative",
        overflow: "hidden",
        width,
      }}
    >
      {blocksY.map((block) => (
        <TreeBlock key={block} model={model} offsetY={block} />
      ))}
    </div>
  );
});

export default TreeCanvas;
