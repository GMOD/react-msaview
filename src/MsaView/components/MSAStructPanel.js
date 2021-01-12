/* eslint-disable react/prop-types */
import pv from "bio-pv";

const styles = {
  panel: {
    flexShrink: "0",
    display: "flex",
    flexDirection: "column",
  },
  structures: {
    display: "flex",
    flexDirection: "row",
    overflowX: "scroll",
    overflowY: "auto",
  },
};

export default function(pluginManager: any) {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { withStyles } = jbrequire("@material-ui/core/styles");

  const { Select, MenuItem, FormControlLabel, Checkbox } = jbrequire(
    "@material-ui/core",
  );
  const MSAStruct = jbrequire(require("./MSAStruct"));

  class MSAStructPanel extends React.Component {
    constructor(props) {
      super(props);
      const { initConfig } = this.props;

      this.state = {
        config: initConfig,
        viewMode: "cartoon",
        colorScheme: "ssSuccession",
      };
    }

    render() {
      const {
        classes,
        structures,
        handleCloseStructure,
        updateStructure,
        handleMouseoverResidue,
      } = this.props;
      const { viewMode, colorScheme, config } = this.state;
      const { showMouseoverLabel } = config;
      return structures.length ? (
        <div className={classes.panel}>
          <div>
            <Select
              value={viewMode}
              onChange={this.handleSelectViewType.bind(this)}
            >
              <MenuItem value="cartoon">Cartoons</MenuItem>
              <MenuItem value="tube">Tube</MenuItem>
              <MenuItem value="spheres">Spheres</MenuItem>
              <MenuItem value="ballsAndSticks">Balls and sticks</MenuItem>
            </Select>

            <Select
              value={colorScheme}
              onChange={this.handleSelectColorScheme.bind(this)}
            >
              <MenuItem value="uniform">Uniform</MenuItem>
              <MenuItem value="byChain">Chain</MenuItem>
              <MenuItem value="bySS">Secondary structure</MenuItem>
              <MenuItem value="ssSuccession">
                Secondary structure gradient
              </MenuItem>
              <MenuItem value="rainbow">Rainbow</MenuItem>
            </Select>

            <FormControlLabel
              control={
                <Checkbox
                  checked={showMouseoverLabel}
                  onChange={this.handleMouseoverLabelConfig.bind(this)}
                />
              }
              label="Show label on hover"
            />
          </div>

          <div className={classes.structures}>
            {structures.map(structure => {
              return (
                <MSAStruct
                  key={structure.key}
                  structure={structure}
                  config={config}
                  setViewType={() => this.setViewType(structure)}
                  updateStructure={info => updateStructure(structure, info)}
                  handleCloseStructure={handleCloseStructure}
                  handleMouseoverResidue={(chain, pdbSeqPos) =>
                    handleMouseoverResidue(structure, chain, pdbSeqPos)
                  }
                />
              );
            })}
          </div>
        </div>
      ) : (
        ""
      );
    }

    handleMouseoverLabelConfig(event) {
      const { config } = this.state;
      this.setState({
        ...config,
        showMouseoverLabel: event.target.checked,
      });
    }

    redrawStructureDelay() {
      return 500;
    }

    setViewType(structure, viewMode, colorScheme) {
      viewMode = viewMode || this.state.viewMode;
      colorScheme = colorScheme || this.state.colorScheme;
      const { pdb, viewer } = structure;
      if (viewer) {
        viewer.clear();
        const geometry = viewer.renderAs("protein", pdb, viewMode, {
          color: pv.color[colorScheme](),
        });
        this.props.updateStructure(structure, { geometry });
      }
      this.props.structures.forEach(s => {
        this.props.updateStructure(s, { trueAtomColor: {} });
      });
      this.requestRedrawStructures();
    }

    handleSelectViewType(evt) {
      const viewMode = evt.target.value;
      this.setState({ viewMode });
      this.props.structures.forEach(s => this.setViewType(s, viewMode));
    }

    handleSelectColorScheme(evt) {
      const colorScheme = evt.target.value;
      this.setState({ colorScheme });
      this.props.structures.forEach(s =>
        this.setViewType(s, undefined, colorScheme),
      );
    }

    addLabelToStructuresOnMouseover(column) {
      const labelConfig = this.state.config.label || {
        font: "sans-serif",
        fontSize: 12,
        fontColor: "#f62",
        fillStyle: "white",
        backgroundAlpha: 0.4,
      };
      const atomHighlightColor = this.state.config.atomHighlightColor || "red";
      this.props.structures.forEach(s => {
        const colToSeqPos = this.props.alignIndex.alignColToSeqPos[s.node];
        const seqCoords = this.props.seqCoords[s.node] || { startPos: 1 };
        if (colToSeqPos) {
          const seqPos = colToSeqPos[column];
          this.removeMouseoverLabels(s);
          if (!Array.isArray(s.structureInfo)) {
            s.structureInfo.chains.forEach(chainInfo => {
              const pdbSeqPos = seqPos + seqCoords.startPos;
              if (
                (!chainInfo.startPos || pdbSeqPos >= chainInfo.startPos) &&
                (!chainInfo.endPos || pdbSeqPos <= chainInfo.endPos)
              ) {
                const pdbChain = chainInfo.chain;
                if (s.pdb) {
                  const residues = s.pdb.residueSelect(res => {
                    return (
                      res.num() === pdbSeqPos &&
                      (typeof pdbChain === "undefined" ||
                        res.chain().name() === pdbChain)
                    );
                  });
                  if (residues) {
                    residues.eachResidue(res => {
                      console.log({ res });
                      const label = `mouseover${s.mouseoverLabel.length + 1}`;
                      console.log(this.state.config);
                      if (true) {
                        s.viewer.label(
                          label,
                          res.qualifiedName(),
                          res.centralAtom().pos(),
                          labelConfig,
                        );
                      }
                      res.atoms().forEach(atom => {
                        if (!s.trueAtomColor[atom.index()]) {
                          const atomColor = [0, 0, 0, 0];
                          s.geometry.getColorForAtom(atom, atomColor);
                          s.trueAtomColor[atom.index()] = atomColor;
                        }
                      });
                      this.setColorForAtoms(
                        s.geometry,
                        res.atoms(),
                        atomHighlightColor,
                      );
                      s.mouseoverLabel.push({ label, res });
                    });
                  }
                }
              }
            });
          }
        }
      });
      this.requestRedrawStructures();
    }

    removeLabelFromStructuresOnMouseout() {
      this.props.structures.forEach(s => {
        this.removeMouseoverLabels(s);
      });
      this.requestRedrawStructures();
    }

    removeMouseoverLabels(structure) {
      structure.mouseoverLabel.forEach(labelInfo => {
        if (true) {
          structure.viewer.rm(labelInfo.label);
        }
        const byColor = {};
        labelInfo.res.atoms().forEach(atom => {
          const trueColor = structure.trueAtomColor[atom.index()];
          const colorString = trueColor.toString();
          byColor[colorString] = byColor[colorString] || {
            trueColor,
            atoms: [],
          };
          byColor[colorString].atoms.push(atom);
        });
        Object.keys(byColor).forEach(col =>
          this.setColorForAtoms(
            structure.geometry,
            byColor[col].atoms,
            byColor[col].trueColor,
          ),
        );
      });
      structure.mouseoverLabel = [];
    }

    setColorForAtoms(go, atoms, color) {
      const view = go.structure().createEmptyView();
      atoms.forEach(atom => view.addAtom(atom));
      go.colorBy(pv.color.uniform(color), view);
    }

    // delayed request to redraw structure
    requestRedrawStructures() {
      this.props.setTimer("redraw", this.redrawStructureDelay(), () => {
        this.props.structures
          .filter(s => s.viewer)
          .forEach(s => s.viewer.requestRedraw());
      });
    }
  }

  return withStyles(styles)(MSAStructPanel);
}
