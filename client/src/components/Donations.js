import React from "react";
import { Container, Icon } from "semantic-ui-react";

import { withContext, MIN_SCREEN_WIDTH } from "../config/config";

const Donations = props => {
  // checks if mobile version
  const mobile = props.context.screenWidth <= MIN_SCREEN_WIDTH;

  return (
    <Container
      className={mobile ? "donations-mobile" : "donations"}
      textAlign="right"
    >
      Donations: <Icon name="bitcoin" fitted />{" "}
      1F3cwLKsxeRkSp4LBLppfhFvmXssiioKUi / <Icon name="ethereum" fitted />{" "}
      0x9EA34bcbc7F0B4F64a97A221Ca717cF0011db650
    </Container>
  );
};

export default withContext(Donations);
