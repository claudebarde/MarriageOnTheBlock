import React from "react";
import { Icon } from "semantic-ui-react";

import { withContext, MIN_SCREEN_WIDTH } from "../config/config";

const Donations = props => {
  // checks if mobile version
  const mobile = props.context.screenWidth <= MIN_SCREEN_WIDTH;

  return (
    <div className={mobile ? "donations-mobile" : "donations"}>
      Donations: <Icon name="bitcoin" /> 1F3cwLKsxeRkSp4LBLppfhFvmXssiioKUi /{" "}
      <Icon name="ethereum" /> 0x90Ce1FbAECee174e42654D83a918BFD99bf4C14a
    </div>
  );
};

export default withContext(Donations);
