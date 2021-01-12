import Plugin from '@jbrowse/core/Plugin'

export default class MsaViewPlugin extends Plugin {
  name = 'MsaViewPlugin'

  install(pluginManager: PluginManager) {
    pluginManager.addViewType(() => pluginManager.jbrequire(MsaViewFactory))
  }

  configure(pluginManager: PluginManager) {
    if (isAbstractMenuManager(pluginManager.rootModel)) {
      pluginManager.rootModel.appendToSubMenu(['File', 'Add'], {
        label: 'Multiple sequence alignment view',
        icon: GridOn,
        onClick: (session: AbstractSessionModel) => {
          session.addView('MsaView', {})
        },
      })
    }
  }
}
