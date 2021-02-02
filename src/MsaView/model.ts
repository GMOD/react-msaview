import BaseViewModel from "@jbrowse/core/pluggableElementTypes/models/BaseViewModel";
import PluginManager from "@jbrowse/core/PluginManager";
import { parse } from "clustal-js";
import * as d3 from "d3";
import parseNewick from "./parseNewick";
import temptreeSeq from "./seq2";

export const temptree =
  "(((UniProt/Swiss-Prot|P26898|IL2RA_SHEEP:0.24036,(UniProt/Swiss-Prot|P41690|IL2RA_FELCA:0.17737,(UniProt/Swiss-Prot|P01589|IL2RA_HUMAN:0.03906,UniProt/Swiss-Prot|Q5MNY4|IL2RA_MACMU:0.03787):0.13033):0.04964):0.02189,UniProt/Swiss-Prot|P01590|IL2RA_MOUSE:0.23072):0.06814,(((UniProt/Swiss-Prot|Q95118|IL2RG_BOVIN:0.09600,UniProt/Swiss-Prot|P40321|IL2RG_CANFA:0.09845):0.25333,UniProt/Swiss-Prot|Q29416|IL2_CANFA:-0.35055):0.10231,(UniProt/Swiss-Prot|P26896|IL2RB_RAT:0.33631,UniProt/Swiss-Prot|Q7JFM4|IL2_AOTVO:-0.33631):0.10166):0.01607,(UniProt/Swiss-Prot|Q8BZM1|GLMN_MOUSE:0.32378,UniProt/Swiss-Prot|P36835|IL2_CAPHI:-0.32378):0.09999)";

export default function stateModelFactory(pluginManager: PluginManager) {
  const { jbrequire } = pluginManager;
  const { types } = pluginManager.lib["mobx-state-tree"];
  const { ElementId } = jbrequire("@jbrowse/core/util/types/mst");
  return types.compose(
    BaseViewModel,
    types
      .model("MsaView", {
        id: ElementId,
        type: types.literal("MsaView"),
        height: 600,
        treeWidth: 100,
        data: types.optional(
          types
            .model({
              tree: types.maybe(types.string),
              msa: types.maybe(types.string),
            })
            .actions((self: any) => ({
              setTree(tree?: string) {
                self.tree = tree;
              },
              setMSA(msa?: string) {
                self.msa = msa;
              },
            })),
          { tree: temptree, msa: temptreeSeq },
        ),
      })
      .volatile(() => ({
        error: undefined as Error | undefined,
        volatileWidth: 0,
        margin: { left: 20, top: 20 },
      }))
      .actions((self: any) => ({
        setError(error?: Error) {
          self.error = error;
        },

        setData(msa?: string, tree?: string) {
          self.data.setTree(tree);
          self.data.setMSA(msa);
        },
        setTree(tree?: string) {
          self.data.tree = tree;
        },
        setWidth(width: number) {
          self.volatileWidth = width;
        },
      }))
      .views((self: any) => ({
        get initialized() {
          return self.volatileWidth > 0 && (self.data.msa || self.data.tree);
        },

        get menuItems() {
          return [];
        },

        get msa() {
          return self.data.msa && parse(self.data.msa);
        },
        get width() {
          return self.volatileWidth;
        },

        get newickTree() {
          return parseNewick(self.data.tree);
        },

        get root() {
          const root = d3
            //@ts-ignore
            .hierarchy(this.newickTree, d => d.branchset)
            .sum(d => (d.branchset ? 0 : 1))
            .sort(
              (a: any, b: any) =>
                a.value - b.value || d3.ascending(a.data.length, b.data.length),
            );

          return root;
        },

        get tree() {
          const cluster = d3
            .cluster()
            .size([this.totalHeight, self.treeWidth])
            .separation((_1: any, _2: any) => 1);
          cluster(this.root);
          return this.root;
        },

        get nodePositions() {
          return this.tree.leaves().map((d: any) => {
            return { name: d.data.name, x: d.x, y: d.y };
          });
        },

        get totalHeight() {
          return this.root.leaves().length * 20;
        },
      })),
  );
}

// export type MsaViewStateModel = ReturnType<typeof stateModelFactory>;
// export type MsaViewModel = Instance<MsaViewStateModel>;
