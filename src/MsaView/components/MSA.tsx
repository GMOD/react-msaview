import PluginManager from "@jbrowse/core/PluginManager";
import normalizeWheel from "normalize-wheel";
import Color from "color";
import colorSchemes from "../colorSchemes";
import { transform } from "../util";
import { MsaViewModel } from "../model";

export default function(pluginManager: PluginManager) {
  const React = pluginManager.lib["react"];
  const { useEffect, useRef, useMemo } = React;
  const { observer } = pluginManager.lib["mobx-react"];
  const { useTheme } = pluginManager.lib["@material-ui/core/styles"];

  const MSABlock = observer(
    ({
      model,
      offsetX,
      offsetY,
    }: {
      model: MsaViewModel;
      offsetX: number;
      offsetY: number;
    }) => {
      const {
        MSA,
        colWidth,
        bgColor,
        columns,
        rowHeight,
        scrollY,
        scrollX,
        hierarchy,
        colorSchemeName,
        blockSize,
      } = model;

      const theme = useTheme();
      const colorScheme = colorSchemes[colorSchemeName];
      const colorContrast = useMemo(
        () =>
          transform(colorScheme, ([letter, color]: any) => [
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
        ctx.font = ctx.font.replace(
          /\d+px/,
          `${Math.max(8, rowHeight - 12)}px`,
        );

        const leaves = hierarchy.leaves();
        const b = blockSize;

        // slice vertical rows, e.g. tree leaves, avoid negative slice
        const yStart = Math.max(0, Math.floor((offsetY - 10) / rowHeight));
        const yEnd = Math.max(0, Math.floor((offsetY + b + 10) / rowHeight));

        // slice horizontal visible letters, avoid negative slice
        const xStart = Math.max(0, Math.floor((offsetX - 10) / colWidth));
        const xEnd = Math.max(0, Math.floor((offsetX + b + 10) / colWidth));
        const visibleLeaves = leaves.slice(yStart, yEnd);
        visibleLeaves.forEach((node: any) => {
          const {
            x: y,
            data: { name },
          } = node;

          const str = columns[name].slice(xStart, xEnd);
          for (let i = 0; i < str.length; i++) {
            const letter = str[i];
            const color = colorScheme[letter.toUpperCase()];
            if (bgColor) {
              const x = i * colWidth + offsetX;
              ctx.fillStyle = color || "white";
              ctx.fillRect(x, y - rowHeight, colWidth, rowHeight);
            }
          }
        });

        if (rowHeight >= 10 && colWidth >= rowHeight / 2) {
          visibleLeaves.forEach((node: any) => {
            const {
              x: y,
              data: { name },
            } = node;

            const str = columns[name].slice(xStart, xEnd);
            for (let i = 0; i < str.length; i++) {
              const letter = str[i];
              const color = colorScheme[letter.toUpperCase()];
              const contrast = colorContrast[letter.toUpperCase()] || "black";
              const x = i * colWidth + offsetX;

              //note: -rowHeight/4 matches +rowHeight/4 in tree
              ctx.fillStyle = bgColor ? contrast : color || "black";
              ctx.fillText(letter, x + colWidth / 2, y - rowHeight / 4);
            }
          });
        }
      }, [
        MSA,
        columns,
        colorScheme,
        colorContrast,
        bgColor,
        rowHeight,
        colWidth,
        hierarchy,
        offsetX,
        offsetY,
        blockSize,
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
    const ref = useRef<HTMLDivElement>(null);
    const scheduled = useRef(false);
    const deltaX = useRef(0);
    const deltaY = useRef(0);

    if (!MSA) {
      return null;
    }

    useEffect(() => {
      const curr = ref.current;
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
    let blocks: any[] = [];
    blocksY.forEach(blockY =>
      blocksX.forEach(blockX => {
        const key = `${blockX}_${blockY}`;
        blocks.push(
          <MSABlock
            key={key}
            model={model}
            offsetX={blockX}
            offsetY={blockY}
          />,
        );
      }),
    );
    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          height,
          width: width - treeWidth,
          overflow: "hidden",
        }}
      >
        {blocks}
      </div>
    );
  });

  return MSACanvas;
}
