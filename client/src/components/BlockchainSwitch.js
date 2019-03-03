import React, { Component } from "react";
import { Modal, Header, Grid, Button, Icon } from "semantic-ui-react";
import { withRouter } from "react-router-dom";

import firebase from "firebase/app";
import "firebase/firebase-functions";
import "firebase/auth";
import { config } from "../config/firebaseConfig";

import { GlobalStateProvider, NETWORK } from "../config/config";

import getWeb3 from "../utils/getWeb3";
let web3 = null;

firebase.initializeApp(config);

class BlockchainSwitch extends Component {
  state = {
    blockchain: null,
    blockchainModalOpen: false,
    network: NETWORK,
    addressChangeListener: null,
    loggedInUser: null
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

  // updates user address in case of change
  userAddressChange = () => {
    const currentAddress = web3.eth.accounts.currentProvider.selectedAddress;
    if (currentAddress && currentAddress !== this.state.userAddress) {
      this.setState({
        userAddress: web3.eth.accounts.currentProvider.selectedAddress
      });
    }
  };

  componentDidMount = async () => {
    // displays modal to let user choose blockchain
    this.openBlockchainModal();
    // loads web3
    web3 = await getWeb3();
    await web3.eth.net.isListening();
    // address change listener
    const addressChangeListener = setInterval(this.userAddressChange, 500);
    this.setState({ addressChangeListener });

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({ loggedInUser: user.uid });
      }
    });
  };

  componentDidUpdate = () => {
    // displays modal to let user choose blockchain
    if (this.state.blockchainModalOpen === false) this.openBlockchainModal();
  };

  componentWillUnmount = () => {
    clearInterval(this.state.addressChangeListener);
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
