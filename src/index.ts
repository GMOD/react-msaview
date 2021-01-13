import Plugin from "@jbrowse/core/Plugin";
import PluginManager from "@jbrowse/core/PluginManager";
import {
  AbstractSessionModel,
  isAbstractMenuManager,
} from "@jbrowse/core/util";
import MsaViewFactory from "./MsaView";

export default class MsaViewPlugin extends Plugin {
  name = "MsaViewPlugin";

  install(pluginManager: PluginManager) {
    const { jbrequire } = pluginManager;
    pluginManager.addViewType(() => jbrequire(MsaViewFactory));
  }

  configure(pluginManager: PluginManager) {
    const { rootModel } = pluginManager;
    if (isAbstractMenuManager(rootModel)) {
      rootModel.appendToSubMenu(["File", "Add"], {
        label: "Multiple sequence alignment view",
        onClick: (session: AbstractSessionModel) => {
          session.addView("MsaView", {});
        },
      });
    }
  }
}
