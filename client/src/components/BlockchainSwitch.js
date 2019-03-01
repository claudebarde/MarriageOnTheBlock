import React, { Component } from "react";
import { Modal, Header, Grid, Button, Icon } from "semantic-ui-react";
import { withRouter } from "react-router-dom";

import { GlobalStateProvider, NETWORK } from "../config/config";

class BlockchainSwitch extends Component {
  state = {
    blockchain: null,
    blockchainModalOpen: false,
    network: NETWORK
  };

  openBlockchainModal = () => {
    const path = this.props.location.pathname;
    if (
      this.state.blockchain === null &&
      (path.includes("/check") || path.includes("/register")) &&
      (!path.includes("/eth") && !path.includes("/trx"))
    ) {
      this.setState({ blockchainModalOpen: true });
    } else if (this.state.blockchain === null && path.includes("/eth")) {
      this.setState({ blockchain: "eth" });
    } else if (this.state.blockchain === null && path.includes("/trx")) {
      this.setState({ blockchain: "trx" });
    }
  };

  componentDidMount = () => {
    // displays modal to let user choose blockchain
    this.openBlockchainModal();
  };

  componentDidUpdate = () => {
    // displays modal to let user choose blockchain
    if (this.state.blockchainModalOpen === false) this.openBlockchainModal();
  };

  render() {
    return (
      <GlobalStateProvider value={{ ...this.state }}>
        {this.props.children}
        {this.state.blockchain === null && (
          <Modal
            open={this.state.blockchainModalOpen}
            basic
            size="small"
            key="blockchain-modal"
          >
            <Header icon="linkify" content="Choose Your Blockchain" as="h2" />
            <Modal.Content>
              <Header as="h3" style={{ color: "white" }}>
                Which blockchain would you like to use?
              </Header>
              <Grid columns={2}>
                <Grid.Column>
                  <Button
                    color="teal"
                    size="big"
                    animated
                    inverted
                    fluid
                    onClick={() =>
                      // this saves the blockchain chosen by the user
                      this.setState(
                        {
                          blockchain: "eth",
                          blockchainModalOpen: false
                        },
                        () => {
                          // we rewrite the URL with the code for the chosen blockchain
                          let newURL = this.props.location.pathname;
                          newURL = newURL
                            .replace(
                              "/check",
                              `/check/${this.state.blockchain}`
                            )
                            .replace(
                              "/register",
                              `/register/${this.state.blockchain}`
                            );
                          this.props.history.push(newURL);
                        }
                      )
                    }
                  >
                    <Button.Content visible>
                      <Icon name="ethereum" /> Ethereum
                    </Button.Content>
                    <Button.Content hidden>Go!</Button.Content>
                  </Button>
                </Grid.Column>
                <Grid.Column>
                  <Button color="red" size="big" animated inverted fluid>
                    <Button.Content visible>
                      <Icon name="cube" /> Tron
                    </Button.Content>
                    <Button.Content hidden>Coming soon!</Button.Content>
                  </Button>
                </Grid.Column>
              </Grid>
            </Modal.Content>
          </Modal>
        )}
      </GlobalStateProvider>
    );
  }
}

export default withRouter(BlockchainSwitch);
