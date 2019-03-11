import React, { Component } from "react";
import {
  Segment,
  Header,
  Input,
  Grid,
  Divider,
  Image,
  Button,
  Label,
  Message
} from "semantic-ui-react";

import firebase from "firebase/app";
import "firebase/firebase-functions";

import { TransactionModal, transactionModalData } from "./TransactionModal";

import { estimateTxTime } from "../../utils/functions";

class Deposit extends Component {
  state = {
    convertEthToDollars: { joined: 0, savings: 0, external: 0 },
    ethToTransfer: { joined: "", savings: "", external: "" },
    loadingTx: { joined: false, savings: false, external: false },
    errorSend: { joined: false, savings: false, external: false },
    transactionModal: {
      open: false,
      icon: "spinner",
      loading: true,
      header: "Waiting for confirmation...",
      txHash: null,
      message:
        "Your transaction is being confirmed on the blockchain, please wait.",
      estimateTime: null
    }
  };

  convertEthToDollars = (event, account) => {
    const value = event.target.value.trim().replace("-", "");
    const ethToTransfer = { ...this.state.ethToTransfer };
    ethToTransfer[account] = value;
    const convertEthToDollars = { ...this.state.convertEthToDollars };
    convertEthToDollars[account] =
      Math.round(
        parseFloat(value) * parseFloat(this.props.ethToDollarChange)
      ) || 0;
    this.setState({
      ethToTransfer,
      convertEthToDollars
    });
  };

  closeTxModal = (status, txHash) => {
    if (status === true) {
      this.setState({
        transactionModal: transactionModalData("confirmed", txHash)
      });
      setTimeout(
        () =>
          this.setState({
            transactionModal: transactionModalData("pending", txHash)
          }),
        3000
      );
    } else {
      this.setState({
        transactionModal: transactionModalData("error", txHash)
      });
    }
  };

  updateTxHistory = firebase.functions().httpsCallable("updateTxHistory");

  deposit = async _to => {
    // the user address must be locked to avoid tempering during tx process
    const {
      web3,
      certificate,
      userAddress,
      updateBalance,
      gasForTx
    } = this.props;
    // we estimate tx time according to past blocks
    const estimateTime = await estimateTxTime();
    // we set the button to show loading icon
    this.setState({ loadingTx: { ...this.state.loadingTx, [_to]: true } });
    let depositTxHash;
    // we start the transaction process
    try {
      const funds = web3.utils.toWei(
        this.state.ethToTransfer[_to].toString(),
        "ether"
      );

      await certificate.methods
        .deposit(funds, web3.utils.fromAscii(_to))
        .send({
          from: userAddress,
          gas: gasForTx,
          value: funds
        })
        .on("transactionHash", txHash => {
          console.log("Tx hash: ", txHash);
          depositTxHash = txHash;
          this.setState({
            transactionModal: {
              ...this.state.transactionModal,
              txHash,
              open: true,
              estimateTime
            }
          });
        })
        .on("receipt", async receipt => {
          if (receipt.status) {
            // when the tx is processed, we display a message to the user and close the modal
            this.closeTxModal(receipt.status, receipt.transactionHash);
            // we update the data in the state
            updateBalance("deposit", funds, _to);
            // we update transactions log in firestore
            if (firebase.auth().currentUser) {
              const idToken = await firebase
                .auth()
                .currentUser.getIdToken(true);
              const data = {
                idToken,
                address: certificate.options.address,
                tx: {
                  type: "deposit",
                  from: userAddress,
                  amount: funds,
                  account: _to,
                  txHash: receipt.transactionHash
                }
              };
              await this.updateTxHistory(data);
            }
            this.setState({
              convertEthToDollars: {
                ...this.state.convertEthToDollars,
                [_to]: 0
              },
              ethToTransfer: { ...this.state.ethToTransfer, [_to]: "" },
              loadingTx: { ...this.state.loadingTx, [_to]: false }
            });
          } else {
            this.setState({
              errorSend: { ...this.state.errorSend, [_to]: true }
            });
            this.closeTxModal("error", receipt.transactionHash);
          }
        })
        .on("error", console.error);
    } catch (error) {
      console.log(error);
      this.closeTxModal("error", depositTxHash);
      this.setState({
        errorSend: true
      });
    }
  };

  render() {
    return (
      <Segment secondary padded>
        <Header as="h1">
          <Image circular src="/images/eth-thumbnail.png" size="small" />
          Send and deposit ETH
        </Header>
        <Divider />
        <Grid columns={3} stackable>
          <Grid.Row>
            <Grid.Column width={7} verticalAlign="bottom">
              <Header as="h3">Deposit ETH to joined account</Header>
              {this.state.errorSend.joined && (
                <Message
                  header="An error has occurred"
                  content="There was an error transferring the funds."
                  size="mini"
                  error
                />
              )}
              <Input
                placeholder="Amount..."
                type="number"
                id="input-transfer-joined"
                value={this.state.ethToTransfer.joined}
                onChange={event => this.convertEthToDollars(event, "joined")}
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <Label>{`≈ $${this.state.convertEthToDollars.joined}`}</Label>
                <input />
                <Button
                  color="teal"
                  onClick={async () => await this.deposit("joined")}
                  disabled={!this.state.ethToTransfer.joined}
                  loading={this.state.loadingTx.joined}
                >
                  Deposit
                </Button>
              </Input>
            </Grid.Column>
            <Grid.Column width={2} />
            <Grid.Column width={7} verticalAlign="bottom">
              <Header as="h3">Deposit ETH to savings account</Header>
              {this.state.errorSend.savings && (
                <Message
                  header="An error has occurred"
                  content="There was an error transferring the funds."
                  size="mini"
                  error
                />
              )}
              <Input
                placeholder="Amount..."
                type="number"
                id="input-transfer-savings"
                value={this.state.ethToTransfer.savings}
                onChange={event => this.convertEthToDollars(event, "savings")}
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <Label>{`≈ $${this.state.convertEthToDollars.savings}`}</Label>
                <input />
                <Button
                  color="teal"
                  onClick={async () => await this.deposit("savings")}
                  disabled={!this.state.ethToTransfer.savings}
                  loading={this.state.loadingTx.savings}
                >
                  Deposit
                </Button>
              </Input>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={9} verticalAlign="bottom">
              <Header as="h3">
                <Header.Content>
                  Send ETH to external address
                  <Header.Subheader>
                    This will be sent from your joined account
                  </Header.Subheader>
                </Header.Content>
              </Header>
              {this.state.errorSend.external && (
                <Message
                  header="An error has occurred"
                  content="There was an error transferring the funds."
                  size="mini"
                  error
                />
              )}
              <Input placeholder="Address..." fluid />
            </Grid.Column>
            <Grid.Column width={7} verticalAlign="bottom">
              <Input
                placeholder="Amount..."
                type="number"
                id="input-transfer-external"
                value={this.state.ethToTransfer.external}
                onChange={event => this.convertEthToDollars(event, "external")}
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <Label>{`≈ $${this.state.convertEthToDollars.external}`}</Label>
                <input />
                <Button
                  color="teal"
                  onClick={async () => await this.deposit("external")}
                  disabled={!this.state.ethToTransfer.external}
                  loading={this.state.loadingTx.external}
                >
                  Send
                </Button>
              </Input>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <TransactionModal {...this.state.transactionModal} />
      </Segment>
    );
  }
}

export default Deposit;
