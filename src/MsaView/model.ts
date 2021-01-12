import PluginManager from "@jbrowse/core/PluginManager";

export default function(pluginManager: PluginManager) {
  const { jbrequire } = pluginManager;
  const { types } = pluginManager.lib["mobx-state-tree"];
  const { ElementId } = jbrequire("@jbrowse/core/util/types/mst");
  const { BaseViewModel } = jbrequire(
    "@jbrowse/core/pluggableElementTypes/models",
  );

  return function stateModelFactory() {
    return types.compose(
      BaseViewModel,
      types
        .model("MsaView", {
          id: ElementId,
          type: types.literal("MsaView"),
          height: 600,
          treeWidth: 100,
          scrollTop: 0,
          alignScrollLeft: 0,
        })
        .volatile(() => ({
          error: undefined as Error | undefined,
          volatileWidth: 0,
          drawn: false,
          margin: { left: 20, top: 20 },
          hoverColumn: null,
        }))
        .actions(self => ({
          setScroll(left: number, top: number) {
            self.alignScrollLeft = left;
            self.scrollTop = top;
          },
          setHoverColumn(col: any) {
            self.hoverColumn = col;
          },
          setError(error?: Error) {
            self.error = error;
          },

          setWidth(width: number) {
            self.volatileWidth = width;
          },
          setDrawn(flag: boolean) {
            self.drawn = flag;
          },
        }))
        .views(self => ({
          get initialized() {
            return self.volatileWidth > 0;
          },
          get menuItems() {
            return [];
          },
        })),
    );
  };
}
