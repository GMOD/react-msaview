import modelFactory from "./model";
import ReactComponentFactory from "./components/MsaView";
import PluginManager from "@jbrowse/core/PluginManager";

export default ({ jbrequire, load }: PluginManager) => {
  const ViewType = jbrequire("@jbrowse/core/pluggableElementTypes/ViewType");

  return new ViewType({
    name: "MsaView",
    stateModel: load(modelFactory),
    ReactComponent: load(ReactComponentFactory),
  });
};
