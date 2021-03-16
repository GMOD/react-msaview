import { observer } from "mobx-react";
import { MSAView, MSAModel } from "msaview";
import { createJBrowseTheme } from "@jbrowse/core/ui/theme";

import { ThemeProvider } from "@material-ui/core/styles";

function App() {
  const theme = createJBrowseTheme();
  const model = MSAModel.create({ id: `${Math.random()}`, type: "MsaView" });
  model.setWidth(1800);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ border: "1px solid black", margin: 20 }}>
        <MSAView model={model} />
      </div>
    </ThemeProvider>
  );
}

export default observer(App);
