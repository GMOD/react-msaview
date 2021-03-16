import { observer } from "mobx-react";
import { MSAView, MSAModel } from "msaview";

function App() {
  const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView" });
  model.setWidth(1500);

  return <MSAView model={model} />;
}

export default observer(App);
