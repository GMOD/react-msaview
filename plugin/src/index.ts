import Plugin from "@jbrowse/core/Plugin";
import PluginManager from "@jbrowse/core/PluginManager";
import { version } from "../package.json";
import {
  AbstractSessionModel,
  isAbstractMenuManager,
} from "@jbrowse/core/util";
import GridOn from "@material-ui/icons/GridOn";
import { MSAModel, MSAView } from "msaview";
import ViewType from "@jbrowse/core/pluggableElementTypes/ViewType";

export default class MsaViewPlugin extends Plugin {
  name = "MsaViewPlugin";
  version = version;

  install(pluginManager: PluginManager) {
    //pluginManager.addViewType(
    //  () =>
    //    new ViewType({
    //      name: "MsaView",
    //      //@ts-ignore
    //      stateModel: MSAModel,
    //      ReactComponent: MSAView,
    //    }),
    //);
  }

  configure(pluginManager: PluginManager) {
    // if (isAbstractMenuManager(pluginManager.rootModel)) {
    //   pluginManager.rootModel.appendToSubMenu(["File", "Add"], {
    //     label: "Multiple sequence alignment view",
    //     icon: GridOn,
    //     onClick: (session: AbstractSessionModel) => {
    //       session.addView("MsaView", {});
    //     },
    //   });
    // }
  }
}
