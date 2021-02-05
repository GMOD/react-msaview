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
      offset,
    }: {
      model: MsaViewModel;
      width: number;
      offset: number;
    }) => {
      const {
        MSA,
        pxPerBp,
        bgColor,
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
        ctx.translate(-offset, rowHeight / 2);
        ctx.textAlign = "center";
        ctx.font = ctx.font.replace(/\d+px/, `${rowHeight - 12}px`);

        hierarchy.leaves().map((node: any) => {
          const {
            x: y,
            data: { name },
          } = node;
          return MSA.getRow(name)?.map((letter: string, index: number) => {
            const color = (colorScheme as any)[letter];
            if (bgColor) {
              const x = index * pxPerBp;
              if (x > offset - 10 && x < offset + width + 10) {
                ctx.fillStyle = color || "white";
                ctx.fillRect(x, y - rowHeight, pxPerBp, rowHeight);
              }
            }
          });
        });

        if (rowHeight >= 10 && pxPerBp >= 7) {
          hierarchy.leaves().map((node: any) => {
            const {
              x: y,
              data: { name },
            } = node;

            return MSA.getRow(name)?.map((letter: string, index: number) => {
              const color = (colorScheme as any)[letter];
              const contrast = colorContrast[letter] || "black";
              const x = index * pxPerBp;
              if (x > offset - 10 && x < offset + width + 10) {
                ctx.fillStyle = bgColor ? contrast : color || "black";
                ctx.fillText(letter, x + pxPerBp / 2, y - rowHeight / 4);
              }
            });
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
        offset,
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
            top: scrollY,
            left: scrollX + offset,
            width: blockSize,
            height: blockSize,
          }}
        />
      );
    },
  );

  const MSACanvas = observer(({ model }: { model: MsaViewModel }) => {
    const { MSA, width, height, treeWidth, blocksX } = model;
    const divRef = useRef<HTMLDivElement>(null);
    const scheduled = useRef(false);
    const delta = useRef(0);

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
        delta.current += event.pixelX;

        if (!scheduled.current) {
          scheduled.current = true;
          requestAnimationFrame(() => {
            model.doScrollX(-delta.current);
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
          position: "relative",
          height,
          width: width - treeWidth,
          overflow: "hidden",
        }}
      >
        {blocksX.map(block => (
          <MSABlock
            key={block}
            model={model}
            offset={block}
            width={blockSize}
          />
        ))}
      </div>
    );
  });
  return MSACanvas;
}
