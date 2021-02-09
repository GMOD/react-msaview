import BaseViewModel from "@jbrowse/core/pluggableElementTypes/models/BaseViewModel";
import PluginManager from "@jbrowse/core/PluginManager";
import * as Clustal from "clustal-js";
import * as d3 from "d3";
import parseNewick from "./parseNewick";
import Stockholm from "stockholm-js";
import { Instance } from "mobx-state-tree";

let str = JSON.stringify;

class ClustalMSA {
  private MSA: any;
  constructor(text: string) {
    this.MSA = Clustal.parse(text);
  }

  getMSA() {
    return this.MSA;
  }

  getRow(name: string) {
    return this.MSA.alns.find((aln: any) => aln.id === name)?.seq.split("");
  }

  getWidth() {
    return this.MSA.alns[0].seq.length;
  }

  getTree() {
    return {
      name: "root",
      noTree: true,
      branchset: this.MSA.alns.map((aln: any) => ({
        name: aln.id,
      })),
    };
  }
}

class StockholmMSA {
  private MSA: any;
  constructor(text: string) {
    const res = Stockholm.parseAll(text);
    this.MSA = res[0];
  }

  getMSA() {
    return this.MSA;
  }

  getRow(name: string) {
    return this.MSA?.seqdata[name]?.split("");
  }

  getWidth() {
    const name = Object.keys(this.MSA?.seqdata)[0];
    return this.getRow(name).length;
  }

  getTree() {
    const tree = this.MSA?.gf?.NH?.[0];
    return tree
      ? generateNodeNames(parseNewick(tree))
      : {
          name: "root",
          noTree: true,
          branchset: Object.keys(this.MSA.seqdata).map((name: any) => ({
            name,
          })),
        };
  }
}

function setBrLength(d: any, y0: number, k: number) {
  d.len = (y0 += Math.max(d.data.length || 0, 0)) * k;
  if (d.children) {
    d.children.forEach((d: any) => {
      setBrLength(d, y0, k);
    });
  }
}

function maxLength(d: any): number {
  return (
    (d.data.length || 1) + (d.children ? d3.max(d.children, maxLength) : 0)
  );
}

// note: we don't use this.root because it won't update in response to changes
// in realWidth/totalHeight here otherwise, needs to generate a new object
function getRoot(tree: any) {
  return d3
    .hierarchy(tree, d => d.branchset)
    .sum(d => (d.branchset ? 0 : 1))
    .sort((a, b) => {
      return d3.ascending(a.data.length || 1, b.data.length || 1);
    });
}

function generateNodeNames(tree: any, parent = "node", depth = 0, index = 0) {
  if (tree.name === "") {
    tree.name = `${parent}-${depth}-${index}`;
  }
  if (tree.branchset?.length) {
    tree.branchset.forEach((b: any, index: number) =>
      generateNodeNames(b, tree.name, depth + 1, index),
    );
  }

  return tree;
}
function filter(tree: any, collapsed: string[]) {
  const { branchset, ...rest } = tree;
  if (collapsed.includes(tree.name)) {
    return rest;
  } else if (tree.branchset) {
    return {
      ...rest,
      branchset: branchset.map((b: any) => filter(b, collapsed)),
    };
  } else {
    return tree;
  }
}

export const blockSize = 1000;

function clamp(min: number, num: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

export default function stateModelFactory(pluginManager: PluginManager) {
  const { jbrequire } = pluginManager;
  const { types, addDisposer } = pluginManager.lib["mobx-state-tree"];
  const { FileLocation, ElementId } = jbrequire("@jbrowse/core/util/types/mst");
  const { openLocation } = jbrequire("@jbrowse/core/util/io");
  const { autorun } = jbrequire("mobx");
  return types.snapshotProcessor(
    types
      .compose(
        BaseViewModel,
        types
          .model("MsaView", {
            id: ElementId,
            type: types.literal("MsaView"),
            height: 680,
            treeWidth: 600,
            nameWidth: 200,
            rowHeight: 20,
            scrollY: 0,
            scrollX: 0,
            pxPerBp: 16,
            showBranchLen: true,
            bgColor: true,
            colorSchemeName: "maeditor",
            treeFilehandle: types.maybe(FileLocation),
            msaFilehandle: types.maybe(FileLocation),
            data: types.optional(
              types
                .model({
                  tree: types.maybe(types.string),
                  msa: types.maybe(types.string),
                  collapsed: types.array(types.string),
                })
                .actions(self => ({
                  setTree(tree?: string) {
                    self.tree = tree;
                  },
                  setMSA(msa?: string) {
                    self.msa = msa;
                  },
                  toggleCollapsed(node: string) {
                    if (self.collapsed.includes(node)) {
                      self.collapsed.remove(node);
                    } else {
                      self.collapsed.push(node);
                    }
                  },
                })),
              { tree: "", msa: "", collapsed: [] },
            ),
          })
          .volatile(() => ({
            error: undefined as Error | undefined,
            volatileWidth: 0,
            margin: { left: 20, top: 20 },
          }))
          .actions(self => ({
            setError(error?: Error) {
              self.error = error;
            },
            setRowHeight(n: number) {
              self.rowHeight = n;
            },
            setPxPerBp(n: number) {
              self.pxPerBp = n;
            },
            setColorSchemeName(name: string) {
              self.colorSchemeName = name;
            },
            setScrollY(n: number) {
              self.scrollY = n;
            },
            setScrollX(n: number) {
              self.scrollX = n;
            },
            setTreeWidth(n: number) {
              self.treeWidth = n;
            },
            setNameWidth(n: number) {
              self.nameWidth = n;
            },

            toggleBranchLen() {
              self.showBranchLen = !self.showBranchLen;
            },
            toggleBgColor() {
              self.bgColor = !self.bgColor;
            },

            setData(data: any) {
              self.data = data;
            },

            setWidth(width: number) {
              self.volatileWidth = width;
            },

            async setMSAFilehandle(r: any) {
              if (r?.blob) {
                const text = await openLocation(r).readFile("utf8");
                self.data.setMSA(text);
              } else {
                self.msaFilehandle = r;
              }
            },
            async setTreeFilehandle(r: any) {
              if (r?.blob) {
                const text = await openLocation(r).readFile("utf8");
                self.data.setTree(text);
              } else {
                self.treeFilehandle = r;
              }
            },

            afterAttach() {
              addDisposer(
                self,
                autorun(async () => {
                  const { treeFilehandle, msaFilehandle } = self;
                  if (treeFilehandle) {
                    const f = openLocation(treeFilehandle);
                    const result = await f.readFile("utf8");
                    self.data.setTree(result);
                  }
                  if (msaFilehandle) {
                    const f = openLocation(msaFilehandle);
                    const result = await f.readFile("utf8");
                    self.data.setMSA(result);
                  }
                }),
              );
            },
          }))
          .views(self => {
            let oldBlocksX: number[] = [];
            let oldBlocksY: number[] = [];
            let oldValX = 0;
            let oldValY = 0;
            return {
              get initialized() {
                return (
                  self.data.msa ||
                  self.data.tree ||
                  self.msaFilehandle ||
                  self.treeFilehandle
                );
              },

              get blocksX() {
                const ret =
                  -(blockSize * Math.floor(self.scrollX / blockSize)) -
                  blockSize;

                const b = [];
                for (let i = ret; i < ret + blockSize * 3; i += blockSize) {
                  b.push(i);
                }
                if (str(b) !== str(oldBlocksX) || self.pxPerBp !== oldValX) {
                  oldBlocksX = b;
                  oldValX = self.pxPerBp;
                }
                return oldBlocksX;
              },

              get blocksY() {
                const ret =
                  -(blockSize * Math.floor(self.scrollY / blockSize)) -
                  2 * blockSize;

                const b = [];
                for (let i = ret; i < ret + blockSize * 3; i += blockSize) {
                  b.push(i);
                }
                if (str(b) !== str(oldBlocksY) || self.rowHeight !== oldValY) {
                  oldBlocksY = b;
                  oldValY = self.rowHeight;
                }
                return oldBlocksY;
              },

              get collapsed() {
                return self.data.collapsed;
              },

              get done() {
                return (
                  self.volatileWidth > 0 &&
                  this.initialized &&
                  (self.data.msa || self.data.tree)
                );
              },

              get noTree() {
                return !!this.tree.noTree;
              },

              get menuItems() {
                return [];
              },

              get MSA() {
                const text = self.data.msa;
                if (text) {
                  if (Stockholm.sniff(text)) {
                    return new StockholmMSA(text);
                  } else {
                    return new ClustalMSA(text);
                  }
                }
                return null;
              },
              get width() {
                return self.volatileWidth;
              },

              get msaWidth() {
                return (
                  (this.MSA?.getWidth() - this.blanks.length) * self.pxPerBp
                );
              },

              get tree() {
                return filter(
                  self.data.tree
                    ? generateNodeNames(parseNewick(self.data.tree))
                    : this.MSA?.getTree(),
                  this.collapsed,
                );
              },

              get root() {
                return getRoot(this.tree);
              },

              get realWidth() {
                return self.treeWidth - self.nameWidth;
              },

              get blanks() {
                const nodes = this.hierarchy.leaves();
                const blanks = [];
                const strs = nodes
                  .map(({ data }) => this.MSA?.getRow(data.name))
                  .filter(f => !!f);

                for (let i = 0; i < strs[0].length; i++) {
                  let counter = 0;
                  for (let j = 0; j < strs.length; j++) {
                    if (strs[j][i] === "-") {
                      counter++;
                    }
                  }
                  if (counter === strs.length) {
                    blanks.push(i);
                  }
                }
                return blanks;
              },

              get columns() {
                const nodes = this.hierarchy.leaves();
                const rows = nodes
                  .map(({ data }) => [data.name, this.MSA?.getRow(data.name)])
                  .filter(f => !!f[1]);
                const strs = rows.map(row => row[1]);

                const ret: string[] = [];
                for (let i = 0; i < strs.length; i++) {
                  let s = "";
                  let b = 0;
                  for (let j = 0; j < strs[i].length; j++) {
                    if (j === this.blanks[b]) {
                      b++;
                    } else {
                      s += strs[i][j];
                    }
                  }
                  ret.push(s);
                }
                return Object.fromEntries(
                  rows.map((row, index) => [row[0], ret[index]]),
                );
              },

              // generates a new tree that is clustered with x,y positions
              get hierarchy() {
                const root = getRoot(this.tree);
                const cluster = d3
                  .cluster()
                  .size([this.totalHeight, this.realWidth])
                  .separation(() => 1);
                cluster(root);
                setBrLength(
                  root,
                  (root.data.length = 0),
                  this.realWidth / maxLength(root),
                );
                return root;
              },

              get totalHeight() {
                return this.root.leaves().length * self.rowHeight;
              },
            };
          }),
      )
      .actions(self => ({
        doScrollY(deltaY: number) {
          self.scrollY = clamp(
            -self.totalHeight + 10,
            self.scrollY + deltaY,
            10,
          );
        },

        doScrollX(deltaX: number) {
          self.scrollX = clamp(-self.msaWidth + 10, self.scrollX + deltaX, 0);
        },
      })),
    {
      postProcessor(result) {
        const { data, ...rest } = result;
        return rest;
      },
    },
  );
}

export type MsaViewStateModel = ReturnType<typeof stateModelFactory>;
export type MsaViewModel = Instance<MsaViewStateModel>;
