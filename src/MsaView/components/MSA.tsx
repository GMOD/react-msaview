import PluginManager from "@jbrowse/core/PluginManager";
import normalizeWheel from "normalize-wheel";
import Color from "color";
import colorSchemes, { transform } from "./colorSchemes";
import { blockSize, MsaViewModel } from "../model";

export default function(pluginManager: PluginManager) {
  const React = pluginManager.lib["react"];
  const { useEffect, useRef, useMemo } = React;
  const { observer } = pluginManager.lib["mobx-react"];
  const { useTheme } = pluginManager.lib["@material-ui/core/styles"];

  const MSABlock = observer(
    ({
      model,
      width,
      offsetX,
      offsetY,
    }: {
      model: MsaViewModel;
      width: number;
      offsetX: number;
      offsetY: number;
    }) => {
      const {
        MSA,
        pxPerBp,
        bgColor,
        columns,
        margin,
        rowHeight,
        scrollY,
        scrollX,
        hierarchy,
        colorSchemeName,
      } = model;
      const theme = useTheme();
      const colorScheme = colorSchemes[colorSchemeName];
      const colorContrast = useMemo(
        () =>
          transform(colorScheme, ([letter, color]: [string, string]) => [
            letter,
            theme.palette.getContrastText(Color(color).hex()),
          ]),
        [colorScheme, theme],
      );
      const ref = useRef<HTMLCanvasElement>(null);

      if (!MSA) {
        return null;
      }

      useEffect(() => {
        if (!ref.current) {
          return;
        }

        const ctx = ref.current.getContext("2d");
        if (!ctx) {
          return;
        }
        ctx.resetTransform();
        ctx.clearRect(0, 0, blockSize, blockSize);
        ctx.translate(-offsetX, rowHeight / 2 - offsetY);
        ctx.textAlign = "center";
        ctx.font = ctx.font.replace(/\d+px/, `${rowHeight - 12}px`);

        hierarchy.leaves().map((node: any) => {
          const {
            x: y,
            data: { name },
          } = node;

          const str = columns[name];
          for (let i = 0; i < str?.length; i++) {
            const letter = str[i];
            const color = (colorScheme as any)[letter];
            if (bgColor) {
              const x = i * pxPerBp;
              if (x > offsetX - 10 && x < offsetX + width + 10) {
                ctx.fillStyle = color || "white";
                ctx.fillRect(x, y - rowHeight, pxPerBp, rowHeight);
              }
            }
          }
        });

        if (rowHeight >= 10 && pxPerBp >= rowHeight / 2) {
          hierarchy.leaves().map((node: any) => {
            const {
              x: y,
              data: { name },
            } = node;

            const str = columns[name];
            for (let i = 0; i < str?.length; i++) {
              const letter = str[i];
              const color = (colorScheme as any)[letter];
              const contrast = colorContrast[letter] || "black";
              const x = i * pxPerBp;
              if (x > offsetX - 10 && x < offsetX + width + 10) {
                ctx.fillStyle = bgColor ? contrast : color || "black";
                //-rowHeight/4 synchronizes with +rowHeight/4 in tree
                ctx.fillText(letter, x + pxPerBp / 2, y - rowHeight / 4);
              }
            }
          });
        }
      }, [
        MSA,
        colorScheme,
        colorContrast,
        bgColor,
        rowHeight,
        pxPerBp,
        hierarchy,
        offsetX,
        offsetY,
        width,
        margin.top,
        theme.palette,
      ]);

      return (
        <canvas
          ref={ref}
          width={blockSize}
          height={blockSize}
          style={{
            position: "absolute",
            top: scrollY + offsetY,
            left: scrollX + offsetX,
            width: blockSize,
            height: blockSize,
          }}
        />
      );
    },
  );

  const MSACanvas = observer(({ model }: { model: MsaViewModel }) => {
    const { MSA, width, height, treeWidth, blocksX, blocksY } = model;
    const divRef = useRef<HTMLDivElement>(null);
    const scheduled = useRef(false);
    const deltaX = useRef(0);
    const deltaY = useRef(0);

    if (!MSA) {
      return null;
    }

    useEffect(() => {
      const curr = divRef.current;
      if (!curr) {
        return;
      }
      function onWheel(origEvent: WheelEvent) {
        const event = normalizeWheel(origEvent);
        deltaX.current += event.pixelX;
        deltaY.current += event.pixelY;

        if (!scheduled.current) {
          scheduled.current = true;
          requestAnimationFrame(() => {
            model.doScrollX(-deltaX.current);
            model.doScrollY(-deltaY.current);
            deltaX.current = 0;
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
          position: "relative",
          height,
          width: width - treeWidth,
          overflow: "hidden",
        }}
      >
        {blocksX.map(blockX =>
          blocksY.map(blockY => (
            <MSABlock
              key={`${blockX}-${blockY}`}
              model={model}
              offsetX={blockX}
              offsetY={blockY}
              width={blockSize}
            />
          )),
        )}
      </div>
    );
  });
  return MSACanvas;
}
