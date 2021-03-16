const globals = require("@jbrowse/core/ReExports/list").default;
const { createJBrowsePluginTsdxConfig } = require("@jbrowse/development-tools");

module.exports = {
  rollup(config, options) {
    const conf = createJBrowsePluginTsdxConfig(config, options, globals);
    // conf.externals = [];
    // conf.externals.push("react");
    // conf.externals.push("react-dom");
    // conf.externals.push("react-is");
    // conf.externals.push("@material-ui/utils");
    return conf;
  },
};
