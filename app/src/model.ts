import { MSAModel } from "react-msaview";
import { types, Instance } from "mobx-state-tree";

const App = types
  .model({
    msaview: MSAModel,
    nglSelection: types.optional(types.string, ""),
  })
  .actions((self) => ({
    setNGLSelection(sel: any) {
      self.nglSelection = sel;
    },
  }));

export default App;
export type AppModel = Instance<typeof App>;
