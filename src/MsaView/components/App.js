/* eslint-disable react/prop-types,react/sort-comp */

import Stockholm from "stockholm-js";
import NewickModule from "newick";
import JukesCantor from "jukes-cantor";
import RapidNeighborJoining from "neighbor-joining";
import { getAncestralReconstruction } from "./reconstruction";
import colorSchemes from "./colorSchemes";
import MSAFactory from "./MSA";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import CloseIcon from "@material-ui/icons/Close";

import { isGapChar } from "./util";

const { Newick } = NewickModule;
const styles = {
  appBar: {
    display: "flex",
    flexDirection: "row",
    fontSize: "large",
    fontStyle: "italic",
  },
  appBarTitle: {
    textAlign: "left",
    paddingTop: "2px",
    paddingLeft: "2px",
  },
  appBarLink: {
    textAlign: "right",
    flexGrow: "1",
    padding: "2px",
  },
};

export default function(pluginManager) {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { withStyles } = jbrequire("@material-ui/core/styles");
  const { IconButton, Select, MenuItem } = jbrequire("@material-ui/core");
  const MSA = jbrequire(MSAFactory);

  class App extends React.Component {
    constructor(props) {
      super(props);
      const { config: propConfig = {} } = props;
      const config = {
        ...this.defaultConfig(),
        ...propConfig,
      };
      const {
        genericRowHeight,
        nameFontSize,
        treeWidth,
        branchStrokeStyle,
        nodeHandleRadius,
        nodeHandleClickRadius,
        nodeHandleFillStyle,
        collapsedNodeHandleFillStyle,
        rowConnectorDash,
      } = config;

      // tree configuration
      const treeStrokeWidth = 1;
      const nodeHandleStrokeStyle = branchStrokeStyle;
      const availableTreeWidth =
        treeWidth - nodeHandleRadius - 2 * treeStrokeWidth;
      const computedTreeConfig = {
        treeWidth,
        availableTreeWidth,
        genericRowHeight,
        branchStrokeStyle,
        nodeHandleStrokeStyle,
        nodeHandleRadius,
        nodeHandleClickRadius,
        nodeHandleFillStyle,
        collapsedNodeHandleFillStyle,
        rowConnectorDash,
        treeStrokeWidth,
      };

      // font configuration
      const charFontName = "Menlo,monospace";
      const nameFontName = "inherit";
      const nameFontColor = "black";
      const charFont = `${genericRowHeight}px ${charFontName}`;
      const color = config.color || colorSchemes[config.colorScheme];
      const computedFontConfig = {
        charFont,
        charFontName,
        color,
        nameFontName,
        nameFontSize,
        nameFontColor,
        genericRowHeight,
      };

      // state (we will select a dataset in componentDidMount())
      this.state = {
        config,
        datasets: this.props.datasets || [],
        computedTreeConfig,
        computedFontConfig,
      };

      this.divRef = React.createRef();
      this.inputRef = React.createRef();
      this.msaRef = React.createRef();

      window.onpopstate = event => {
        if (event && event.state && event.state.data) {
          this.setDataset(event.state.data);
        } else {
          window.location.reload();
        }
      };
    }

    handleDragEnter(evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = "copy";
    }

    handleDrop(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      this.openFiles(evt.dataTransfer.files);
    }

    handleSelectFile(evt) {
      this.openFiles(evt.target.files);
      this.setState({ showOpenIcon: false });
    }

    openFiles(files) {
      return Promise.all(Array.from(files).map(file => this.openFile(file)));
    }

    openFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          const text = e.target.result;
          this.addDatasets(text, true);
          resolve();
        };
        reader.readAsText(file);
      });
    }

    addDatasets(text, autoselect) {
      const newAlignmentName = n =>
        `Alignment ${this.state.datasets.length + (n || 0) + 1}`;
      let { datasets } = this.state;
      if (this.sniffStockholmRegex.test(text)) {
        const stocks = Stockholm.parseAll(text);
        datasets = datasets.concat(
          stocks.map((stockholmjs, n) => {
            let name;
            ["DE", "ID", "AC"].forEach(tag => {
              if (!name && stockholmjs.gf[tag] && stockholmjs.gf[tag].length) {
                name = stockholmjs.gf[tag][0];
              }
            });
            name = name || newAlignmentName(n);
            const id = ["AC", "ID"].reduce(
              (id, tag) =>
                id || (stockholmjs.gf[tag] && stockholmjs.gf[tag][0]),
              undefined,
            );
            return { stockholmjs, name, id };
          }),
        );
      } else {
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            datasets = datasets.concat(json);
          } else {
            datasets.push(json);
          }
        } catch (e) {
          datasets.push({ auto: text, name: newAlignmentName() });
        }
      }
      if (datasets.length > this.state.datasets.length) {
        const firstDataset = datasets[this.state.datasets.length];
        if (autoselect) {
          this.setDataset(firstDataset, { datasets });
        } else {
          this.setState({ datasets });
        }
        if (this.msaRef.current) {
          this.msaRef.current.resetView();
        }
      }
    }

    setDataset(data, extra) {
      const datasetID = (this.datasetsLoaded = (this.datasetsLoaded || 0) + 1);
      this.indexData(data).then(dataWithIndices =>
        this.setState({
          datasetID,
          reconstructingAncestors: false,
          ...dataWithIndices,
          ...(extra || {}),
        }),
      );
    }

    async indexData(suppliedData, suppliedConfig) {
      const config = suppliedConfig || this.state.config;
      const data = await this.getData(
        config.cacheData ? suppliedData : { ...suppliedData },
        config,
      );
      const treeIndex = this.buildTreeIndex(data);
      const alignIndex = this.buildAlignmentIndex(data);
      return { data, treeIndex, alignIndex };
    }

    // regexes
    get pdbRegex() {
      return /PDB; +(\S+) +(\S); ([0-9]+)-([0-9]+)/;
    } /* PFAM format for embedding PDB IDs in Stockholm files */

    get nameEncodedCoordRegex() {
      return /\/([0-9]+)-([0-9]+)$/;
    } /* Pfam format for embedding coordinates in names (ugh) */

    get sniffStockholmRegex() {
      return /^# STOCKHOLM/;
    } /* regex for sniffing Stockholm format */

    get sniffFastaRegex() {
      return /^>/;
    } /* regex for sniffing FASTA format */

    // method to get data & build tree if necessary
    async getData(data, config) {
      if (data.url) {
        await Promise.all(
          Object.keys(data.url)
            .filter(key => !data[key])
            .map(async key => {
              const res = await fetch(data.url[key]);
              if (res.ok) {
                data[key] = await res.text();
              } else {
                throw new Error(
                  `HTTP ${res.status} ${res.statusText} ${data.url[key]}`,
                );
              }
            }),
        );
      }
      if (data.json) {
        Object.assign(
          data,
          typeof data.json === "string" ? JSON.parse(data.json) : data.json,
        );
      }
      if (data.auto) {
        if (this.sniffStockholmRegex.test(data.auto)) {
          data.stockholm = data.auto;
        } else if (this.sniffFastaRegex.test(data.auto)) {
          data.fasta = data.auto;
        } else {
          try {
            Object.assign(data, JSON.parse(data.auto));
          } catch (e) {
            // do nothing if JSON didn't parse
          }
        }
      }
      if (!(data.branches && data.rowData)) {
        // was a Stockholm-format alignment specified?
        if (data.stockholm) {
          this.unpackStockholm(data, config, data.stockholm);
        }

        // was a StockholmJS object specified?
        else if (data.stockholmjs) {
          this.unpackStockholmJS(data, config, data.stockholmjs);
        }
        // was a FASTA-format alignment specified?
        else if (data.fasta) {
          data.rowData = this.parseFasta(data.fasta);
        }

        //throw
        else {
          throw new Error("no sequence data");
        }
        // If a Newick-format tree was specified somehow (as a separate data
        // item, or in the Stockholm alignment) then parse it
        if (data.newick || data.newickjs) {
          const NewickParser = new Newick();
          const newickTree = (data.newickjs =
            data.newickjs || NewickParser.parse(data.newick));
          let nodes = 0;
          const getName = obj => (obj.name = obj.name || `node${++nodes}`);
          data.branches = [];
          const traverse = parent => {
            // auto-name internal nodes
            if (parent.branchset) {
              parent.branchset.forEach(child => {
                data.branches.push([
                  getName(parent),
                  getName(child),
                  Math.max(child.length, 0),
                ]);
                traverse(child);
              });
            }
          };
          traverse(newickTree);
          data.root = getName(newickTree);
        } else {
          // no Newick tree was specified, so build a quick-and-dirty distance
          // matrix with Jukes-Cantor, and get a tree by neighbor-joining
          const taxa = Object.keys(data.rowData).sort();
          const seqs = taxa.map(taxon => data.rowData[taxon]);
          console.warn(`Estimating phylogenetic tree (${taxa.length} taxa)...`);
          const distMatrix = JukesCantor.calcFiniteDistanceMatrix(seqs);
          const rnj = new RapidNeighborJoining.RapidNeighborJoining(
            distMatrix,
            taxa.map(name => ({ name })),
          );
          rnj.run();
          const tree = rnj.getAsObject();
          let nodes = 0;
          const getName = obj => {
            obj.taxon = obj.taxon || { name: `node${++nodes}` };
            return obj.taxon.name;
          };
          data.branches = [];
          const traverse = parent => {
            // auto-name internal nodes
            parent.children.forEach(child => {
              data.branches.push([
                getName(parent),
                getName(child),
                Math.max(child.length, 0),
              ]);
              traverse(child);
            });
          };
          traverse(tree);
          data.root = getName(tree);
        }
      }
      // this is an idempotent method; if data came from a Stockholm file, it's
      // already been called (in order to filter out irrelevant structures)
      this.guessSeqCoords(data);
      return data;
    }

    // Attempt to figure out start coords relative to database sequences by
    // parsing the sequence names This allows us to align to partial structures
    // This is pretty hacky; the user can alternatively pass these in through
    // the data.seqCoords field
    guessSeqCoords(data) {
      if (!data.seqCoords) {
        data.seqCoords = {};
      }
      Object.keys(data.rowData).forEach(name => {
        const seq = data.rowData[name];
        const len = this.countNonGapChars(seq);
        if (!data.seqCoords[name]) {
          const coordMatch = this.nameEncodedCoordRegex.exec(name);
          if (coordMatch) {
            const startPos = parseInt(coordMatch[1]);
            const endPos = parseInt(coordMatch[2]);
            if (endPos + 1 - startPos === len) {
              data.seqCoords[name] = { startPos, endPos };
            }
          }
        }
        if (!data.seqCoords[name]) {
          data.seqCoords[name] = { startPos: 1, endPos: len };
        } // if we can't guess the start coord, just assume it's the full-length sequence
      });
    }

    unpackStockholm(data, config, stockholm) {
      const stockjs = Stockholm.parse(stockholm);
      this.unpackStockholmJS(data, config, stockjs);
    }

    unpackStockholmJS(data, config, stock) {
      const structure = (data.structure = data.structure || {});
      data.rowData = stock.seqdata;
      this.guessSeqCoords(data);
      if (stock.gf.NH && !data.newick) {
        // did the Stockholm alignment include a tree?
        data.newick = stock.gf.NH.join("");
      }
      if (stock.gs.DR && !config.structure.noRemoteStructures) {
        // did the Stockholm alignment include links to PDB?
        Object.keys(stock.gs.DR).forEach(node => {
          const seqCoords = data.seqCoords[node];
          const seqLen = seqCoords.endPos - seqCoords.startPos;
          stock.gs.DR[node].forEach(dr => {
            const match = this.pdbRegex.exec(dr);
            if (match) {
              const pdb = match[1].toLowerCase();
              const chain = match[2];
              const startPos = parseInt(match[3]);
              const endPos = parseInt(match[4]);
              const pdbLen = endPos - startPos;
              const fullLengthMatch = seqLen === pdbLen;
              const sequenceOverlapsStructure =
                seqCoords.startPos <= endPos && seqCoords.endPos >= startPos;
              if (
                sequenceOverlapsStructure &&
                (fullLengthMatch || !config.noPartialStructures)
              ) {
                // check structure matches sequence
                structure[node] = structure[node] || [];
                const pdbIndex = structure[node].findIndex(s => s.pdb === pdb);
                let pdbStruct;
                if (pdbIndex < 0) {
                  pdbStruct = { pdb, chains: [] };
                  structure[node].push(pdbStruct);
                } else {
                  pdbStruct = structure[node][pdbIndex];
                }
                pdbStruct.chains.push({ chain, startPos, endPos });
              } else {
                console.warn(
                  `ignoring structure ${pdb} (${startPos}...${endPos}) since it ${
                    fullLengthMatch
                      ? `does not overlap with ${node}`
                      : `is not a full-length match to ${node} (${pdbLen}!=${seqLen})`
                  }`,
                );
              }
            }
          });
        });
      }
    }

    componentDidMount() {
      this.divRef.current.addEventListener(
        "dragover",
        this.handleDragOver.bind(this),
        false,
      );
      this.divRef.current.addEventListener(
        "dragenter",
        this.handleDragEnter.bind(this),
        false,
      );
      this.divRef.current.addEventListener(
        "drop",
        this.handleDrop.bind(this),
        false,
      );
      this.initDataset();
    }

    componentWillUnmount() {
      this.divRef.current.removeEventListener(
        "dragover",
        this.handleDragOver.bind(this),
        false,
      );
      this.divRef.current.removeEventListener(
        "dragenter",
        this.handleDragEnter.bind(this),
        false,
      );
      this.divRef.current.removeEventListener(
        "drop",
        this.handleDrop.bind(this),
      );
    }

    componentDidUpdate() {
      this.reconstructMissingNodes();
    }

    // initDataset is called once, from componentDidMount
    async initDataset() {
      if (this.props.stockholm) {
        this.addDatasets(this.props.stockholm, false);
      }
      if (this.props.dataurl) {
        await fetch(this.props.dataurl).then(async res => {
          if (res.ok) {
            this.addDatasets(await res.text(), false);
          }
        });
      }
      this.nDatasetsInitial = this.state.datasets && this.state.datasets.length;
      if (this.props.data || this.state.datasets.length) {
        this.setDataset(this.props.data || this.getInitialDataset());
      }
    }

    getInitialDataset() {
      return this.state.datasets[0];
    }

    get nAlignQueryParam() {
      return "alignnum";
    }

    get alignIdQueryParam() {
      return "alignid";
    }

    // check if any nodes are missing; if so, do ancestral sequence reconstruction
    reconstructMissingNodes() {
      const { data } = this.state;
      let promise;
      if (data) {
        const { branches } = data;
        const rowData = { ...data.rowData };
        const missingAncestors = data.branches.filter(
          b => typeof rowData[b[0]] === "undefined",
        ).length;
        if (missingAncestors && !this.state.reconstructingAncestors) {
          this.setState({ reconstructingAncestors: true });

          promise = getAncestralReconstruction({ branches, rowData }).then(
            result => {
              this.incorporateAncestralReconstruction(result.ancestralRowData);
            },
          );
        }
      } else {
        promise = Promise.resolve();
      }
      return promise;
    }

    fn2workerURL(fn) {
      const blob = new Blob([`(${fn.toString()})()`], {
        type: "application/javascript",
      });
      return URL.createObjectURL(blob);
    }

    incorporateAncestralReconstruction(ancestralRowData) {
      const { data } = this.state;
      const rowData = { ...data.rowData, ...ancestralRowData };
      Object.assign(data, { rowData });
      this.setDataset(data); // rebuilds indices
    }

    defaultColorScheme() {
      return "maeditor";
    }

    defaultConfig() {
      return {
        treeAlignHeight: 400,
        genericRowHeight: 24,
        nameFontSize: 12,
        containerHeight: "100%",
        containerWidth: "100%",
        treeWidth: 200,
        nameDivWidth: 200,
        branchStrokeStyle: "black",
        nodeHandleRadius: 4,
        nodeHandleClickRadius: 40,
        nodeHandleFillStyle: "white",
        collapsedNodeHandleFillStyle: "black",
        rowConnectorDash: [2, 2],
        structure: { width: 400, height: 400 },
        handler: {},
        colorScheme: this.defaultColorScheme(),
      };
    }

    // method to parse FASTA (simple enough to build in here)
    parseFasta(fasta) {
      const seq = {};
      let name;
      const re = /^>(\S+)/;
      fasta.split("\n").forEach(line => {
        const match = re.exec(line);
        if (match) {
          seq[(name = match[1])] = "";
        } else if (name) {
          seq[name] = seq[name] + line.replace(/[ \t]/g, "");
        }
      });
      return seq;
    }

    // index tree
    buildTreeIndex(data) {
      const { branches } = data;
      let { root } = data;
      const rootSpecified = typeof root !== "undefined";
      const roots = this.getRoots(branches);
      if (roots.length === 0 && (branches.length > 0 || !rootSpecified)) {
        throw new Error("No root nodes");
      }
      if (rootSpecified) {
        if (roots.indexOf(root) < 0) {
          throw new Error("Specified root node is not a root");
        }
      } else {
        if (roots.length !== 1) {
          throw new Error(
            "Multiple possible root nodes, and no root specified",
          );
        }
        root = roots[0];
      }
      const children = {};
      const branchLength = {};
      children[root] = [];
      branchLength[root] = 0;
      branches.forEach(branch => {
        const parent = branch[0];
        const child = branch[1];
        const len = branch[2];
        children[parent] = children[parent] || [];
        children[child] = children[child] || [];
        children[parent].push(child);
        branchLength[child] = len;
      });
      const nodes = [];
      const seenNode = {};
      const descendants = {};
      const distFromRoot = {};
      let maxDistFromRoot = 0;
      const addNode = node => {
        if (!node) {
          throw new Error("All nodes must be named");
        }
        if (seenNode[node]) {
          throw new Error(
            `All node names must be unique (duplicate '${node}')`,
          );
        }
        seenNode[node] = true;
        nodes.push(node);
      };
      const addSubtree = (node, parent) => {
        distFromRoot[node] =
          (typeof parent !== "undefined" ? distFromRoot[parent] : 0) +
          branchLength[node];
        maxDistFromRoot = Math.max(maxDistFromRoot, distFromRoot[node]);
        const kids = children[node];
        let clade = [];
        if (kids.length === 2) {
          clade = clade.concat(addSubtree(kids[0], node));
          addNode(node);
          clade = clade.concat(addSubtree(kids[1], node));
        } else {
          addNode(node);
          kids.forEach(
            child => (clade = clade.concat(addSubtree(child, node))),
          );
        }
        descendants[node] = clade;
        return [node].concat(clade);
      };
      addSubtree(root);
      return {
        root,
        branches,
        children,
        descendants,
        branchLength,
        nodes,
        distFromRoot,
        maxDistFromRoot,
      };
    }

    // get the root node(s) of a list of [parent,child,length] branches
    getRoots(branches) {
      const isNode = {};
      const hasParent = {};
      branches.forEach(branch => {
        const [p, c] = branch;
        isNode[p] = isNode[c] = hasParent[c] = true;
      });
      return Object.keys(isNode)
        .filter(n => !hasParent[n])
        .sort();
    }

    // index alignment
    buildAlignmentIndex(data) {
      const { rowData } = data;
      const rowDataAsArray = {};
      const alignColToSeqPos = {};
      const seqPosToAlignCol = {};
      const isChar = {};
      let columns;
      Object.keys(rowData).forEach(node => {
        const row = rowData[node];
        if (typeof columns !== "undefined" && columns !== row.length) {
          console.error("Inconsistent row lengths");
        }
        columns = row.length;
        const pos2col = [];
        let pos = 0;
        const rowAsArray = this.rowAsArray(row);
        alignColToSeqPos[node] = rowAsArray.map((c, col) => {
          if (typeof c === "string") {
            isChar[c] = true;
          }
          const isGap = isGapChar(c);
          if (!isGap) {
            pos2col.push(col);
          }
          return isGap ? pos : pos++;
        });
        rowDataAsArray[node] = rowAsArray;
        seqPosToAlignCol[node] = pos2col;
      });
      const chars = Object.keys(isChar).sort();
      return {
        alignColToSeqPos,
        seqPosToAlignCol,
        rowDataAsArray,
        columns,
        chars,
      };
    }

    countNonGapChars(seq) {
      return this.rowAsArray(seq).filter(c => !isGapChar(c)).length;
    }

    rowAsArray(row) {
      return typeof row === "string" ? row.split("") : row;
    }

    render() {
      const { classes, model } = this.props;
      return (
        <div className="App" ref={this.divRef}>
          <div className={classes.appBar}>
            <IconButton
              onClick={() => {
                this.setState({ showOpenIcon: true });
              }}
            >
              <FolderOpenIcon />
            </IconButton>

            {this.state.showOpenIcon ? (
              <div style={{ display: "inline" }}>
                Open a stockholm or FASTA formatted multiple sequence alignment.
                You can also drag and drop a file onto the main MSA area
                <div style={{ marginLeft: 10, display: "inline" }}>
                  <input
                    type="file"
                    ref={this.inputRef}
                    onChange={this.handleSelectFile.bind(this)}
                  />
                </div>
                <IconButton
                  onClick={() => {
                    this.setState({ showOpenIcon: false });
                  }}
                >
                  <CloseIcon />
                </IconButton>
                <Select
                  onChange={event => {
                    this.setDataset(
                      this.state.datasets.find(
                        f => f.name === event.target.value,
                      ),
                    );
                    this.setState({ showOpenIcon: false });
                  }}
                >
                  {this.state.datasets.map(dataset => (
                    <MenuItem value={dataset.name}>{dataset.name}</MenuItem>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>

          {this.state.data && (
            <MSA
              model={model}
              ref={this.msaRef}
              data={this.state.data}
              config={this.state.config}
              view={this.state.view}
              treeIndex={this.state.treeIndex}
              alignIndex={this.state.alignIndex}
              computedTreeConfig={this.state.computedTreeConfig}
              computedFontConfig={this.state.computedFontConfig}
            />
          )}
        </div>
      );
    }
  }

  return withStyles(styles)(App);
}
