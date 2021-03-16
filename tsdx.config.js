const externs = ["react", "@material-ui/core"];
module.exports = {
  rollup(config, options) {
    console.log(config);
    config.externals = externs;
    return config;
  },
};
