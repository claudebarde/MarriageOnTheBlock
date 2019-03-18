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
      0x90Ce1FbAECee174e42654D83a918BFD99bf4C14a
    </Container>
  );
};

export default withContext(Donations);
