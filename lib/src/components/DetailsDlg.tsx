import { MsaViewModel } from "../model";

import React from "react";
import { observer } from "mobx-react";
import { Dialog, DialogTitle, DialogContent } from "@material-ui/core";
import { Attributes } from "@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail";

export default observer(
  ({
    model,
    onClose,
    open,
  }: {
    model: MsaViewModel;
    onClose: () => void;
    open: boolean;
  }) => {
    const { alignmentDetails } = model;

    return (
      <Dialog onClose={() => onClose()} open={open}>
        <DialogTitle>Metadata</DialogTitle>
        <DialogContent>
          <Attributes attributes={alignmentDetails} />
        </DialogContent>
      </Dialog>
    );
  }
);
