import model from "./model";
export default ({ jbrequire }: { jbrequire: Function }) => {
  const modelFactory = jbrequire(model);
  const ViewType = jbrequire("@jbrowse/core/pluggableElementTypes/ViewType");
  const ReactComponentFactory = jbrequire(require("./components/MsaView"));
  return new ViewType({
    name: "MsaView",
    stateModel: jbrequire(modelFactory),
    ReactComponent: jbrequire(ReactComponentFactory),
  });
};
