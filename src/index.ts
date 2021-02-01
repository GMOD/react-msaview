import Plugin from "@jbrowse/core/Plugin";
import PluginManager from "@jbrowse/core/PluginManager";
import {
  AbstractSessionModel,
  isAbstractMenuManager,
} from "@jbrowse/core/util";
import GridOn from "@material-ui/icons/GridOn";
import MsaViewFactory from "./MsaView";

export default class MsaViewPlugin extends Plugin {
  name = "MsaViewPlugin";

  install(pluginManager: PluginManager) {
    pluginManager.addViewType(() => pluginManager.jbrequire(MsaViewFactory));
  }

  configure(pluginManager: PluginManager) {
    if (isAbstractMenuManager(pluginManager.rootModel)) {
      pluginManager.rootModel.appendToSubMenu(["File", "Add"], {
        label: "Multiple sequence alignment view",
        icon: GridOn,
        onClick: (session: AbstractSessionModel) => {
          session.addView("MsaView", {});
        },
      });
    }
  }
}
