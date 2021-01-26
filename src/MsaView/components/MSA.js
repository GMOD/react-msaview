/* eslint-disable react/prop-types,react/sort-comp */
import MSATreeFactory from "./MSATree";
import MSAAlignNamesFactory from "./MSAAlignNames";
import MSAAlignRowsFactory from "./MSAAlignRows";
import MSAStructPanelFactory from "./MSAStructPanel";

const styles = {
  MSA: {
    display: "flex",
    flexDirection: "column",
  },
  treeAlignment: {
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    borderStyle: "solid",
    borderColor: "black",
    borderWidth: "1px",
  },
};

export default function(pluginManager) {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { withStyles } = jbrequire("@material-ui/core/styles");
  const { observer } = jbrequire("mobx-react");

  const MSATree = jbrequire(MSATreeFactory);
  const MSAAlignNames = jbrequire(MSAAlignNamesFactory);
  const MSAAlignRows = jbrequire(MSAAlignRowsFactory);
  const MSAStructPanel = jbrequire(MSAStructPanelFactory);

  class MSA extends React.Component {
    constructor(props) {
      super(props);

      const view = Object.assign(this.initialView(), props.view || {});

      this.state = {
        view,
      };

      this.msaRef = React.createRef();
      this.structRef = React.createRef();
    }

    // config/defaults
    initialView() {
      return {
        collapsed: {}, // true if an internal node has been collapsed by the user
        forceDisplayNode: {}, // force a node to be displayed even if it's flagged as collapsed. Used by animation code
        nodeScale: {}, // height scaling factor for tree nodes / alignment rows. From 0 to 1 (undefined implies 1)
        columnScale: {}, // height scaling factor for alignment columns. From 0 to 1 (undefined implies 1)
        disableTreeEvents: false,
        animating: false,
        structure: { openStructures: [] },
      };
    }

    collapseAnimationFrames() {
      return 10;
    }

    collapseAnimationDuration() {
      return 200;
    }

    collapseAnimationMaxFrameSkip() {
      return 8;
    }

    mouseoverLabelDelay() {
      return 100;
    }

    resetView() {
      this.setState({ view: this.initialView() });
    }

    // get tree collapsed/open state
    getComputedView(view) {
      view = view || this.state.view;
      const { treeIndex, alignIndex } = this.props;
      const { collapsed, forceDisplayNode } = view;
      const { rowDataAsArray } = alignIndex;
      const ancestorCollapsed = {};
      const nodeVisible = {};
      const setCollapsedState = (node, parent) => {
        ancestorCollapsed[node] =
          ancestorCollapsed[parent] || collapsed[parent];
        const children = treeIndex.children[node];
        if (children) {
          children.forEach(child => setCollapsedState(child, node));
        }
      };
      setCollapsedState(treeIndex.root);
      treeIndex.nodes.forEach(
        node =>
          (nodeVisible[node] =
            !ancestorCollapsed[node] &&
            (treeIndex.children[node].length === 0 || forceDisplayNode[node])),
      );
      const columnVisible = new Array(alignIndex.columns).fill(false);
      treeIndex.nodes
        .filter(node => nodeVisible[node])
        .forEach(node => {
          if (rowDataAsArray[node]) {
            rowDataAsArray[node].forEach((c, col) => {
              if (!this.props.isGapChar(c)) {
                columnVisible[col] = true;
              }
            });
          }
        });
      return {
        ancestorCollapsed,
        nodeVisible,
        columnVisible,
        ...view,
      };
    }

    // layout tree
    layoutTree(computedView) {
      const { computedTreeConfig, treeIndex } = this.props;
      const { nodeVisible, nodeScale } = computedView;
      const {
        genericRowHeight,
        nodeHandleRadius,
        treeStrokeWidth,
        availableTreeWidth,
      } = computedTreeConfig;
      const nx = {};
      const ny = {};
      const computedRowScale = [];
      const nodeHeight = {};
      const rowHeight = [];
      let treeHeight = 0;
      // PERFORMANCE NOTE: the following is an O(N) scan in the number of tree nodes N, performed in every animation frame
      // The purpose is to figure out the visibility and (if visible) scaled height of every row, for collapse/open transitions.
      // This is then used (by MSATree) to determine which nodes are in the visible region, and should be drawn.
      // In principle this could be optimized by taking hints from the view: we could start from a node that we know is in the visible region,
      // and explore outwards from there.
      const rowY = treeIndex.nodes.map(node => {
        const scale =
          typeof nodeScale[node] !== "undefined" ? nodeScale[node] : 1;
        const rh = scale * (nodeVisible[node] ? genericRowHeight : 0);
        const y = treeHeight;
        nx[node] =
          nodeHandleRadius +
          treeStrokeWidth +
          (availableTreeWidth * treeIndex.distFromRoot[node]) /
            treeIndex.maxDistFromRoot;
        ny[node] = y + rh / 2;
        nodeHeight[node] = rh;
        computedRowScale.push(scale);
        rowHeight.push(rh);
        treeHeight += rh;
        return y;
      });
      return {
        nx,
        ny,
        computedRowScale,
        nodeHeight,
        rowHeight,
        rowY,
        treeHeight,
        computedView,
      };
    }

    // get metrics and other info about alignment font/chars, and do layout
    layoutAlignment(computedView) {
      const { alignIndex, computedFontConfig } = this.props;
      const { genericRowHeight, charFont } = computedFontConfig;
      const alignChars = alignIndex.chars;
      let charWidth = 0;
      const charMetrics = {};
      alignChars.forEach(c => {
        const measureCanvas = this.create("canvas", null, null, {
          width: genericRowHeight,
          height: genericRowHeight,
        });
        const measureContext = measureCanvas.getContext("2d");
        measureContext.font = charFont;
        charMetrics[c] = measureContext.measureText(c);
        charWidth = Math.max(charWidth, Math.ceil(charMetrics[c].width));
      });
      const charHeight = genericRowHeight;

      let nextColX = 0;
      const colX = [];
      const colWidth = [];
      const computedColScale = [];
      // PERFORMANCE NOTE: the following is an O(L) scan in the number of alignment columns L, performed in every animation frame
      // As with the O(N) scan in layoutTree(), this could be optimized by taking hints from the view,
      // i.e. starting from a column that is known to be in the visible region, and exploring outwards from there.
      for (let col = 0; col < alignIndex.columns; ++col) {
        colX.push(nextColX);
        if (computedView.columnVisible[col]) {
          let scale = computedView.columnScale[col];
          if (typeof scale === "undefined") {
            scale = 1;
          }
          computedColScale.push(scale);
          const width = scale * charWidth;
          colWidth.push(width);
          nextColX += width;
        } else {
          computedColScale.push(0);
          colWidth.push(0);
        }
      }

      return {
        charMetrics,
        charWidth,
        charHeight,
        colX,
        colWidth,
        computedColScale,
        alignWidth: nextColX,
      };
    }

    // helper to create DOM element (for measurement purposes, or non-React components)
    create(type, parent, styles, attrs) {
      const element = document.createElement(type);
      if (parent) {
        parent.appendChild(element);
      }
      if (attrs) {
        Object.keys(attrs)
          .filter(attr => typeof attrs[attr] !== "undefined")
          .forEach(attr => element.setAttribute(attr, attrs[attr]));
      }
      if (styles) {
        element.style = styles;
      }
      return element;
    }

    render() {
      const computedView = this.getComputedView();
      const treeLayout = this.layoutTree(computedView);
      const alignLayout = this.layoutAlignment(computedView);
      const { classes, model } = this.props;

      // record the dimensions for drag handling
      this.treeHeight = treeLayout.treeHeight;
      this.alignWidth = alignLayout.alignWidth;

      return (
        <div
          className={classes.MSA}
          style={{
            width: this.props.config.containerWidth,
            height: this.props.config.containerHeight,
          }}
        >
          <div
            className={classes.treeAlignment}
            ref={this.msaRef}
            onMouseDown={this.handleMouseDown.bind(this)}
            style={{
              width: this.props.config.containerWidth,
              height: treeLayout.treeAlignHeight,
            }}
          >
            <MSATree
              model={model}
              config={this.props.config}
              computedTreeConfig={this.props.computedTreeConfig}
              treeIndex={this.props.treeIndex}
              treeLayout={treeLayout}
              computedView={computedView}
              scrollTop={this.state.scrollTop}
              handleNodeClick={this.handleNodeClick.bind(this)}
            />

            <MSAAlignNames
              model={model}
              data={this.props.data}
              view={this.state.view}
              config={this.props.config}
              computedFontConfig={this.props.computedFontConfig}
              treeIndex={this.props.treeIndex}
              alignIndex={this.props.alignIndex}
              treeLayout={treeLayout}
              alignLayout={alignLayout}
              computedView={computedView}
              scrollTop={this.state.scrollTop}
              handleNameClick={this.handleNameClick.bind(this)}
            />

            <MSAAlignRows
              model={model}
              data={this.props.data}
              view={this.state.view}
              config={this.props.config}
              computedFontConfig={this.props.computedFontConfig}
              treeIndex={this.props.treeIndex}
              alignIndex={this.props.alignIndex}
              isGapChar={this.props.isGapChar}
              treeLayout={treeLayout}
              alignLayout={alignLayout}
              setClientSize={this.setAlignmentClientSize.bind(this)}
              handleScroll={this.handleAlignmentScroll.bind(this)}
              handleMouseDown={this.handleAlignmentMouseDown.bind(this)}
              handleAlignCharClick={this.handleAlignCharClick.bind(this)}
              handleAlignCharMouseOver={this.handleAlignCharMouseOver.bind(
                this,
              )}
              handleAlignCharMouseOut={this.handleAlignCharMouseOut.bind(this)}
              handleMouseLeave={() => this.delayedSetHoverColumn(null)}
              scrollLeft={model.alignScrollLeft}
              scrollTop={model.scrollTop}
              hoverColumn={model.hoverColumn}
            />
          </div>

          <MSAStructPanel
            ref={this.structRef}
            initConfig={this.props.config.structure}
            seqCoords={this.props.data.seqCoords}
            alignIndex={this.props.alignIndex}
            structures={this.state.view.structure.openStructures}
            updateStructure={this.updateStructure.bind(this)}
            handleCloseStructure={this.handleCloseStructure.bind(this)}
            handleMouseoverResidue={this.handleMouseoverStructureResidue.bind(
              this,
            )}
            setTimer={this.setTimer.bind(this)}
          />
        </div>
      );
    }

    componentDidMount() {
      window.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
      window.addEventListener("mouseup", this.handleMouseUp.bind(this));
      window.addEventListener("mousemove", this.handleMouseMove.bind(this));
      this.msaRef.current.addEventListener(
        "wheel",
        this.handleMouseWheel.bind(this),
        { passive: false },
      );
    }

    componentWillUnmount() {
      window.removeEventListener(
        "mouseleave",
        this.handleMouseLeave.bind(this),
      );
      window.removeEventListener("mouseup", this.handleMouseUp.bind(this));
      window.removeEventListener("mousemove", this.handleMouseMove.bind(this));
      this.msaRef.current.removeEventListener(
        "wheel",
        this.handleMouseWheel.bind(this),
      );
    }

    setAlignmentClientSize(w, h) {
      this.alignmentClientWidth = w;
      this.alignmentClientHeight = h;
    }

    handleNameClick(node) {
      const { structure } = this.props.data;
      this.nStructs = (this.nStructs || 0) + 1;
      let info = structure[node];
      if (Array.isArray(info) && info.length === 1) {
        info = info[0];
      }
      const newStructure = {
        node,
        structureInfo: info,
        startPos: this.props.data.seqCoords[node].startPos,
        mouseoverLabel: [],
        trueAtomColor: {},
        key: this.nStructs,
      };
      const { view } = this.state;
      view.structure.openStructures.push(newStructure);
      this.setState({ view });
    }

    updateStructure(structure, newStructure) {
      const { view } = this.state;
      view.structure.openStructures = view.structure.openStructures.map(s =>
        s === structure ? Object.assign(s, newStructure) : s,
      );
      this.setState({ view });
    }

    handleCloseStructure(structure) {
      const { view } = this.state;
      view.structure.openStructures = view.structure.openStructures.filter(
        s => s !== structure,
      );
      this.setState({ view });
    }

    // This function updates internal state when a node is opened/collapsed &
    // schedules the animation PERFORMANCE NOTE: at the moment, the layout is
    // recomputed in every animation frame Some improvement should be possible by
    // moving some of the invariant calculations out of this loop, precomputing
    // and passing them in.
    handleNodeClick(node) {
      if (this.scrolling) {
        this.scrolling = false;
        return;
      }
      if (this.state.disableTreeEvents) {
        return;
      }

      // HACK/CODE STINK: Currently there are some slightly hacky things about
      // this animation.  The "forceDisplayNode" and "collapsed" objects have the
      // following combined effect (for internal nodes): If collapsed[node] is
      // truthy, then the alignment row for that node will be rendered.  If
      // collapsed[node]===undefined and forceDisplayNode[node]===true, then the
      // node's open->collapse transition is being animated, and the node handle
      // will be rendered as collapsed.  If collapsed[node] is falsey and
      // forceDisplayNode[node] is falsey, then the node handle will be rendered
      // as collapsed.  This might be better handled by replacing the two objects
      // with a single combined state (OPEN, COLLAPSED, COLLAPSING, OPENING) Part
      // of the implementation goal has been to keep the object sparse so that
      // the default state is OPEN and the objects can start off being empty.

      // First compute the current alignment layout (i.e. the initial state
      // before the expand/collapse)
      const { treeIndex, alignIndex } = this.props;
      const computedView = this.getComputedView();
      const {
        collapsed,
        nodeScale,
        columnScale,
        forceDisplayNode,
        columnVisible,
      } = computedView;

      const alignLayout = this.layoutAlignment(computedView);
      const left = this.props.model.alignScrollLeft;
      const right = left + this.alignmentClientWidth;

      const collapseAnimationFrames = this.collapseAnimationFrames();
      let framesLeft = collapseAnimationFrames;

      // Now compute the final alignment state and layout This also includes
      // figuring out which columns are visible before AND after the animation -
      // so that we can keep the view centered around those columns As noted in
      // the comments for layoutAlignment(), a possible performance optimization
      // would be to do a lazy layout, starting with a column known to be in the
      // view, and stopping when offscreen.  This might necessitate maintaining
      // some internal state about which column is currently being used as the
      // "origin" for layout purposes.
      const wasCollapsed = collapsed[node];
      const finalCollapsed = { ...collapsed };
      if (wasCollapsed) {
        collapsed[node] = false; // when collapsed[node]=false (vs undefined), it's rendered by renderTree() as a collapsed node, but its descendants are still visible. A bit of a hack...
        delete finalCollapsed[node];
      } else {
        finalCollapsed[node] = true;
      }
      const finalForceDisplayNode = { ...forceDisplayNode };
      finalForceDisplayNode[node] = !wasCollapsed;
      const finalComputedView = this.getComputedView({
        collapsed: finalCollapsed,
        forceDisplayNode: finalForceDisplayNode,
      });
      const newlyVisibleColumns = [];
      const newlyHiddenColumns = [];
      const persistingVisibleColumns = [];
      for (let col = 0; col < alignIndex.columns; ++col) {
        if (finalComputedView.columnVisible[col] !== columnVisible[col]) {
          (finalComputedView.columnVisible[node]
            ? newlyVisibleColumns
            : newlyHiddenColumns
          ).push(col);
        }
        const colX = alignLayout.colX[col];
        const colWidth = alignLayout.colWidth[col];
        if (
          columnVisible[col] &&
          finalComputedView.columnVisible[col] &&
          colX >= left &&
          colX + colWidth < right
        ) {
          persistingVisibleColumns.push(col);
        }
      }
      // Compute the current centroid of the visible-before-and-after columns
      // Throughout the animation, we keep computing this and dynamically adjust alignScrollLeft so that it stays at the centroid of the current view
      // This ensures that the currently visible alignment region does not shift out of view because columns way offscreen to the left have disappeared or appeared.
      const centroidMinusScroll =
        this.centroidOfColumns(persistingVisibleColumns, alignLayout) -
        this.props.model.alignScrollLeft;

      let lastFrameTime = Date.now();
      const expectedTimeBetweenFrames =
        this.collapseAnimationDuration() / collapseAnimationFrames;
      // drawAnimationFrame is the closure used for the animation transition
      const drawAnimationFrame = () => {
        let disableTreeEvents;
        let animating;
        let newCollapsed = collapsed;
        if (framesLeft) {
          const scale =
            (wasCollapsed
              ? collapseAnimationFrames + 1 - framesLeft
              : framesLeft) /
            (collapseAnimationFrames + 1);
          treeIndex.descendants[node].forEach(desc => {
            nodeScale[desc] = scale;
          });
          nodeScale[node] = 1 - scale;
          newlyHiddenColumns.forEach(col => (columnScale[col] = scale));
          newlyVisibleColumns.forEach(col => (columnScale[col] = 1 - scale));
          forceDisplayNode[node] = true;
          disableTreeEvents = true; // disable further tree events while the animated transition is ongoing
          animating = true;
        } else {
          treeIndex.descendants[node].forEach(desc => {
            delete nodeScale[desc];
          });
          delete nodeScale[node];
          newlyHiddenColumns.forEach(col => delete columnScale[col]);
          newlyVisibleColumns.forEach(col => delete columnScale[col]);
          forceDisplayNode[node] = !wasCollapsed;
          newCollapsed = finalCollapsed;
          disableTreeEvents = false;
          animating = false;
        }
        const view = {
          ...this.state.view,
          collapsed: newCollapsed,
          forceDisplayNode,
          nodeScale,
          columnScale,
          disableTreeEvents,
          animating,
        };
        const computedView = this.getComputedView(view);
        const alignLayout = this.layoutAlignment(computedView);
        const alignScrollLeft = this.boundAlignScrollLeft(
          this.centroidOfColumns(persistingVisibleColumns, alignLayout) -
            centroidMinusScroll,
        );
        window.requestAnimationFrame(() => {
          this.props.model.setScroll(
            alignScrollLeft,
            this.props.model.scrollTop,
          );
          this.setState({ view });

          if (framesLeft) {
            // Note the use of collapseAnimationMaxFrameSkip to guarantee that the user sees at least one frame of the animation transition
            const currentTime = Date.now();
            const timeSinceLastFrame = currentTime - lastFrameTime;
            const timeToNextFrame = Math.max(
              0,
              expectedTimeBetweenFrames - timeSinceLastFrame,
            );
            const frameSkip = Math.min(
              this.collapseAnimationMaxFrameSkip(),
              Math.ceil(timeSinceLastFrame / expectedTimeBetweenFrames),
            );
            framesLeft = Math.max(0, framesLeft - frameSkip);
            lastFrameTime = currentTime;
            setTimeout(drawAnimationFrame, timeToNextFrame);
          }
        });
      };

      drawAnimationFrame(collapseAnimationFrames);
    }

    handleAlignmentScroll(alignScrollLeft, scrollTop) {
      if (
        alignScrollLeft !== this.props.model.alignScrollLeft ||
        scrollTop !== this.props.model.scrollTop
      ) {
        this.props.model.setScroll(alignScrollLeft, scrollTop);
      }
    }

    handleMouseWheel(evt) {
      // nonzero deltaMode is Firefox, means deltaY is in lines instead of pixels
      // can be corrected for e.g.
      // https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
      if (evt.deltaY !== 0) {
        const deltaY =
          evt.deltaY * (evt.deltaMode ? this.props.config.genericRowHeight : 1);
        evt.preventDefault();
        this.requestAnimationFrame(() => {
          this.props.model.setScroll(
            this.incAlignScrollLeft(evt.deltaX),
            this.incScrollTop(deltaY),
          );
        });
      }
    }

    handleMouseDown(evt) {
      this.mouseDown = true;
      this.lastY = evt.pageY;
    }

    handleAlignmentMouseDown(evt) {
      this.alignMouseDown = true;
      this.lastX = evt.pageX;
    }

    handleAlignCharClick(coords) {
      if (!this.panning && !this.scrolling) {
        //      console.warn('click',coords)
      }
      this.panning = this.scrolling = false;
    }

    handleAlignCharMouseOver(coords) {
      if (!this.panning && !this.scrolling) {
        this.delayedSetHoverColumn(coords.column);
        //      console.warn('mouseover',coords)
      }
    }

    handleAlignCharMouseOut(coords) {
      if (!this.panning && !this.scrolling) {
        //      console.warn('mouseout',coords)
      }
    }

    delayedSetHoverColumn(column) {
      this.setMouseoverTimer(() => {
        this.setHoverColumn(column);
      });
    }

    setMouseoverTimer(callback) {
      this.setTimer("mouseover", this.mouseoverLabelDelay(), () =>
        window.requestAnimationFrame(callback),
      );
    }

    setHoverColumn(column) {
      this.props.model.setHoverColumn(column);
      if (column === null) {
        this.structRef.current.removeLabelFromStructuresOnMouseout();
      } else {
        this.structRef.current.addLabelToStructuresOnMouseover(column);
      }
    }

    handleMouseoverStructureResidue(structure, chain, pdbSeqPos) {
      this.setMouseoverTimer(() => {
        const seqPosToCol = this.props.alignIndex.seqPosToAlignCol[
          structure.node
        ];
        const chainInfo = structure.structureInfo.chains.find(
          c => c.chain === chain,
        );
        if (
          seqPosToCol &&
          chainInfo &&
          pdbSeqPos >= chainInfo.startPos &&
          pdbSeqPos <= chainInfo.endPos
        ) {
          const seqPos = pdbSeqPos - chainInfo.startPos;
          const column = seqPosToCol[seqPos];
          this.setHoverColumn(column);
        } else {
          this.setHoverColumn(null);
        }
      });
    }

    handleMouseLeave() {
      this.alignMouseDown = false;
      this.mouseDown = false;
      this.panning = false;
      this.scrolling = false;
    }

    handleMouseUp() {
      this.alignMouseDown = false;
      this.mouseDown = false;
    }

    centroidOfColumns(cols, alignLayout) {
      return (
        cols.length &&
        cols.reduce(
          (sum, col) =>
            sum + alignLayout.colX[col] + alignLayout.colWidth[col] / 2,
          0,
        ) / cols.length
      );
    }

    incAlignScrollLeft(dx) {
      return this.boundAlignScrollLeft(this.props.model.alignScrollLeft + dx);
    }

    incScrollTop(dy) {
      return this.boundScrollTop(this.props.model.scrollTop + dy);
    }

    boundAlignScrollLeft(x) {
      return Math.max(
        0,
        Math.min(this.alignWidth - this.alignmentClientWidth, x),
      );
    }

    boundScrollTop(y) {
      return Math.max(
        0,
        Math.min(this.treeHeight - this.alignmentClientHeight, y),
      );
    }

    handleMouseMove(evt) {
      if (this.alignMouseDown || this.mousedown) {
        evt.preventDefault();
      }

      let { alignScrollLeft, scrollTop } = this.props.model;
      let updated = false;
      if (this.alignMouseDown) {
        const dx = evt.pageX - this.lastX;
        if (dx) {
          alignScrollLeft = this.incAlignScrollLeft(-dx);
          this.panning = true;
          updated = true;
        }
      } else {
        this.panning = false;
      }

      if (this.mouseDown) {
        const dy = evt.pageY - this.lastY;
        if (dy) {
          scrollTop = this.incScrollTop(-dy);
          this.scrolling = true;
          updated = true;
        }
      } else {
        this.scrolling = false;
      }

      if (updated) {
        this.requestAnimationFrame(() => {
          this.props.model.setScroll(alignScrollLeft, scrollTop);
          this.lastX = evt.pageX;
          this.lastY = evt.pageY;
        });
      }
    }

    // request animation frame
    requestAnimationFrame(callback) {
      if (this.animationTimeout) {
        window.cancelAnimationFrame(this.animationTimeout);
      }
      this.animationTimeout = window.requestAnimationFrame(callback);
    }

    // set generic timer
    setTimer(name, delay, callback) {
      this.timer = this.timer || {};
      this.clearTimer(this, name);
      this.timer[name] = window.setTimeout(() => {
        delete this.timer[name];
        callback();
      }, delay);
    }

    // clear generic timer
    clearTimer(name) {
      if (this.timer && this.timer[name]) {
        window.clearTimeout(this.timer[name]);
        delete this.timer[name];
      }
    }
  }

  return withStyles(styles)(observer(MSA));
}
