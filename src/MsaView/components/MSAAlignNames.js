/* eslint-disable react/prop-types */

const styles = {
  alignmentNames: {
    marginLeft: "2px",
    marginRight: "2px",
    overflowX: "scroll",
    overflowY: "hidden",
    flexShrink: "0",
    whiteSpace: "nowrap",
  },
  alignmentNamesContent: {
    position: "relative",
  },
  alignmentName: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  alignmentNameLink: {
    color: "blue",
    cursor: "pointer",
    textDecoration: "underline",
    "&:active": {
      color: "red",
    },
  },
};

export default function(pluginManager: any) {
  const { jbrequire } = pluginManager;
  const React = jbrequire("react");
  const { withStyles } = jbrequire("@material-ui/core/styles");

  class MSAAlignNames extends React.Component {
    render() {
      const {
        data: { structure = {} },
        computedFontConfig,
        treeIndex,
        config,
        computedView,
        treeLayout,
        classes,
      } = this.props;
      const { nameDivWidth } = config;
      const { nameFontName, nameFontSize } = computedFontConfig;

      const { nodeHeight } = treeLayout;

      return (
        <div
          className={classes.alignmentNames}
          style={{
            fontFamily: nameFontName,
            fontSize: `${nameFontSize}px`,
            maxWidth: nameDivWidth,
          }}
        >
          <div
            className={classes.alignmentNamesContent}
            style={{ top: -this.props.scrollTop }}
          >
            {treeIndex.nodes
              .filter(node => computedView.nodeVisible[node])
              .map((node, row) => {
                const style = { height: `${nodeHeight[node]}px` };
                const scale = this.props.view.nodeScale[node];
                if (typeof scale !== "undefined" && scale !== 1) {
                  style.transform = `scale(1,${scale})`;
                  style.opacity = scale;
                }
                return (
                  <div
                    className={classes.alignmentName}
                    key={node}
                    style={style}
                  >
                    {structure[node] ? (
                      <span
                        className={classes.alignmentNameLink}
                        onClick={() => this.props.handleNameClick(node)}
                        style={{
                          fontFamily: nameFontName,
                          fontSize: `${nameFontSize}px`,
                        }}
                      >
                        {node}
                      </span>
                    ) : (
                      <span> {node} </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
  }

  return withStyles(styles)(MSAAlignNames);
}
