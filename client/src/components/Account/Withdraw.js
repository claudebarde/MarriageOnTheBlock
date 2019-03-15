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
  Message,
  Dimmer,
  Loader,
  List
} from "semantic-ui-react";
import moment from "moment";

import firebase from "firebase/app";
import "firebase/firebase-functions";

import { withContext, MIN_SCREEN_WIDTH } from "../../config/config";

import { TransactionModal, transactionModalData } from "../TransactionModal";

import { estimateTxTime } from "../../utils/functions";

class Withdraw extends Component {
  state = {
    convertEthToDollars: { joint: 0, savings: 0 },
    ethToWithdraw: { joint: "", savings: "" },
    loadingTx: { joint: false, savings: false },
    errorSend: { joint: false, savings: false },
    transactionModal: {
      open: false,
      icon: "spinner",
      loading: true,
      header: "Waiting for confirmation...",
      txHash: null,
      message:
        "Your transaction is being confirmed on the blockchain, please wait.",
      estimateTime: null,
      requestID: ""
    },
    requestReceipt: { status: false, tx: undefined },
    fetchWithdrawRequest: {
      loading: false,
      status: false,
      sender: "",
      amount: 0,
      timestamp: 0,
      approved: true,
      error: ""
    }
  };

  convertEthToDollars = (event, account) => {
    const value = event.target.value.trim().replace("-", "");
    const ethToWithdraw = { ...this.state.ethToWithdraw };
    ethToWithdraw[account] = value;
    const convertEthToDollars = { ...this.state.convertEthToDollars };
    convertEthToDollars[account] =
      Math.round(
        parseFloat(value) * parseFloat(this.props.ethToDollarChange)
      ) || 0;
    this.setState({
      ethToWithdraw,
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
      setTimeout(
        () =>
          this.setState({
            transactionModal: transactionModalData("pending", txHash)
          }),
        3000
      );
    }
  };

  updateTxHistory = firebase.functions().httpsCallable("updateTxHistory");

  withdrawTxHistoryUpdate = async data => {
    const { type, amount, account, txHash, requestID, userAddress } = data;
    const { certificate } = this.props;
    // we update transactions log in firestore
    if (firebase.auth().currentUser) {
      const idToken = await firebase.auth().currentUser.getIdToken(true);
      let data = {};
      if (type === "withdrawal") {
        data = {
          idToken,
          address: certificate.options.address,
          tx: {
            type,
            from: userAddress,
            amount,
            account,
            txHash
          }
        };
      } else if (type === "withdrawalRequest") {
        data = {
          idToken,
          address: certificate.options.address,
          tx: {
            type,
            from: userAddress,
            amount,
            account,
            requestID,
            txHash
          }
        };
      }
      await this.updateTxHistory(data);
    }
  };

  withdraw = async _from => {
    // we set the button to show loading icon
    this.setState({ loadingTx: { ...this.state.loadingTx, [_from]: true } });
    // the user address must be locked to avoid tempering during tx process
    const { web3, certificate, gasForTx, balance } = this.props;
    const userAddress = this.props.context.userAddress;
    // we estimate tx time according to past blocks
    const estimateTime = await estimateTxTime();
    if (
      parseFloat(this.state.ethToWithdraw[_from]) >
      parseFloat(web3.utils.fromWei(balance[_from].toString(), "ether"))
    ) {
      this.setState({
        errorSend: { ...this.state.errorSend, [_from]: true },
        loadingTx: { ...this.state.loadingTx, [_from]: false }
      });
      return;
    }
    let withdrawTxHash;
    // we start the transaction process
    try {
      const funds = web3.utils.toWei(
        this.state.ethToWithdraw[_from].toString(),
        "ether"
      );

      await certificate.methods
        .withdraw(funds, web3.utils.fromAscii(_from))
        .send({
          from: userAddress,
          gas: gasForTx
        })
        .on("transactionHash", txHash => {
          console.log("Tx hash: ", txHash);
          withdrawTxHash = txHash;
          this.setState({
            transactionModal: {
              ...this.state.transactionModal,
              txHash,
              open: true,
              estimateTime,
              status: "pending"
            },
            loadingTx: { ...this.state.loadingTx, [_from]: false }
          });
        })
        .on("receipt", receipt => {
          if (receipt.status) {
            // when the tx is processed, we display a message to the user and close the modal
            this.closeTxModal(receipt.status, receipt.transactionHash);
            // we return the request number for a withdrawal from the savings account
            if (_from === "savings") {
              const requestID =
                receipt.events.LogNewWithdrawalRequestFromSavings.returnValues
                  .request;
              // we log the transaction in the firestore
              this.withdrawTxHistoryUpdate({
                type: "withdrawalRequest",
                amount: funds,
                account: _from,
                txHash: receipt.transactionHash,
                requestID,
                userAddress
              });
              this.setState({
                requestReceipt: {
                  status: true,
                  tx: requestID
                }
              });
            } else {
              // updates transactions history in firestore
              this.withdrawTxHistoryUpdate({
                type: "withdrawal",
                amount: funds,
                account: _from,
                txHash: receipt.transactionHash,
                requestID: null,
                userAddress
              });
              this.setState({
                convertEthToDollars: { joint: 0, savings: 0 },
                ethToWithdraw: { joint: "", savings: "" }
              });
            }
          } else {
            this.setState({
              transactionModal: {
                ...this.state.transactionModal,
                open: false,
                txHash: null
              },
              errorSend: { ...this.state.errorSend, [_from]: true },
              loadingTx: { ...this.state.loadingTx, [_from]: false }
            });
          }
        })
        .on("error", error => {
          console.log(error);
          this.closeTxModal("error", withdrawTxHash);
        });
    } catch (error) {
      console.log(error);
      this.closeTxModal("error", withdrawTxHash);
      this.setState({
        errorSend: { ...this.state.errorSend, [_from]: true },
        loadingTx: { ...this.state.loadingTx, [_from]: false }
      });
    }
  };

  fetchWithdrawRequest = requestID => {
    if (requestID.trim().length === 0) return;

    this.setState(
      {
        fetchWithdrawRequest: {
          loading: true,
          status: false,
          sender: "",
          amount: 0,
          timestamp: 0,
          approved: true,
          error: false
        }
      },
      async () => {
        try {
          const request = await this.props.certificate.methods
            .withdrawRequests(requestID)
            .call();
          if (
            request &&
            (request.sender !== "0x0000000000000000000000000000000000000000" ||
              request.timestamp === 0 ||
              request.amount === 0)
          ) {
            this.setState({
              fetchWithdrawRequest: {
                loading: false,
                status: true,
                requestID,
                sender: request.sender,
                amount: request.amount,
                timestamp: request.timestamp,
                approved: request.approved,
                error: false
              }
            });
          } else {
            this.setState({
              fetchWithdrawRequest: {
                loading: false,
                status: false,
                error: true
              }
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
    );
  };

  approveRequest = async requestID => {
    const userAddress = this.props.context.userAddress;
    const estimateTime = await estimateTxTime();
    let transactionHash;
    try {
      await this.props.certificate.methods
        .approveWithdrawRequestFromSavings(requestID)
        .send({
          from: userAddress,
          gas: this.props.gasForTx
        })
        .on("transactionHash", txHash => {
          transactionHash = txHash;
          console.log("Tx hash: ", txHash);
          this.setState({
            transactionModal: {
              ...this.state.transactionModal,
              open: true,
              txHash,
              estimateTime
            }
          });
        })
        .on("receipt", async receipt => {
          // if approved
          if (receipt.status) {
            // when the tx is processed, we display a message to the user and close the modal
            this.closeTxModal(receipt.status, receipt.transactionHash);
            // we update transactions log in firestore
            if (firebase.auth().currentUser) {
              const idToken = await firebase
                .auth()
                .currentUser.getIdToken(true);
              const data = {
                idToken,
                address: this.props.certificate.options.address,
                tx: {
                  type: "approvedRequest",
                  to: this.state.fetchWithdrawRequest.sender,
                  amount: this.state.fetchWithdrawRequest.amount,
                  txHash: receipt.transactionHash
                }
              };
              await this.updateTxHistory(data);
            }
            // we update request info
            this.setState({
              fetchWithdrawRequest: {
                ...this.state.fetchWithdrawRequest,
                approved: true,
                error: ""
              }
            });
          }
        })
        .on("error", error => {
          console.log(error);
          this.closeTxModal("error", transactionHash);
        });
    } catch (error) {
      console.log(error);
      this.setState({
        fetchWithdrawRequest: {
          ...this.state.fetchWithdrawRequest,
          loading: false,
          error: "An error has occurred."
        },
        transactionModal: {
          ...this.state.transactionModal,
          open: false
        }
      });
    }
  };

  render() {
    const jointInputExceedsBalance =
      parseInt(
        this.props.web3.utils.toWei(
          (this.state.ethToWithdraw.joint || 0).toString(),
          "ether"
        )
      ) > this.props.balance.joint;

    const savingsInputExceedsBalance =
      parseInt(
        this.props.web3.utils.toWei(
          (this.state.ethToWithdraw.savings || 0).toString(),
          "ether"
        )
      ) > this.props.balance.savings;

    return (
      <Segment secondary padded>
        <Header as="h1">
          <Image circular src="/images/eth-thumbnail.png" size="small" />
          Withdraw ETH
        </Header>
        <Divider />
        <Grid columns={3} stackable>
          <Grid.Row>
            <Grid.Column width={7} verticalAlign="bottom">
              <Header as="h3">
                <Header.Content>
                  Withdraw ETH from joint account
                  <Header.Subheader>
                    This will be withdrawn immediately
                  </Header.Subheader>
                </Header.Content>
              </Header>
              {this.state.errorSend.joint && (
                <Message
                  header="An error has occurred"
                  content="There was an error withdrawing the funds."
                  size="mini"
                  error
                />
              )}
              <Input
                placeholder="Amount..."
                type="number"
                id="input-withdraw-joint"
                value={this.state.ethToWithdraw.joint}
                onChange={event => this.convertEthToDollars(event, "joint")}
                labelPosition="left"
                autoComplete="off"
                error={jointInputExceedsBalance}
                fluid
                action
              >
                <Label>{`≈ $${this.state.convertEthToDollars.joint}`}</Label>
                <input />
                <Button
                  color="teal"
                  onClick={async () => await this.withdraw("joint")}
                  disabled={
                    !this.state.ethToWithdraw.joint || jointInputExceedsBalance
                  }
                  loading={this.state.loadingTx.joint}
                >
                  Withdraw
                </Button>
              </Input>
            </Grid.Column>
            <Grid.Column width={2} />
            <Grid.Column width={7} verticalAlign="bottom">
              <Header as="h3">
                <Header.Content>
                  Withdraw ETH from savings account
                  <Header.Subheader>
                    This must be approved by the second spouse
                  </Header.Subheader>
                </Header.Content>
              </Header>
              {this.state.errorSend.savings && (
                <Message
                  header="An error has occurred"
                  content="There was an error withdrawing the funds."
                  size="mini"
                  error
                />
              )}
              {this.state.requestReceipt.status && (
                <Message
                  header="Your Withdrawal Request Receipt Number"
                  content={`${
                    this.state.requestReceipt.tx
                  } -> Please give this receipt number to your spouse to confirm the withdrawal.`}
                  size="mini"
                  info
                />
              )}
              <Input
                placeholder="Amount..."
                type="number"
                id="input-transfer-savings"
                value={this.state.ethToWithdraw.savings}
                onChange={event => this.convertEthToDollars(event, "savings")}
                labelPosition="left"
                autoComplete="off"
                error={savingsInputExceedsBalance}
                fluid
                action
              >
                <Label>{`≈ $${this.state.convertEthToDollars.savings}`}</Label>
                <input />
                <Button
                  color="teal"
                  onClick={async () => await this.withdraw("savings")}
                  disabled={
                    !this.state.ethToWithdraw.savings ||
                    savingsInputExceedsBalance
                  }
                  loading={this.state.loadingTx.savings}
                >
                  Withdraw
                </Button>
              </Input>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row
            centered={this.props.context.screenWidth > MIN_SCREEN_WIDTH}
          >
            <Grid.Column
              width={
                this.props.context.screenWidth > MIN_SCREEN_WIDTH ? 10 : 16
              }
              textAlign={
                this.props.context.screenWidth > MIN_SCREEN_WIDTH
                  ? "center"
                  : "left"
              }
            >
              <Header as="h3">
                <Header.Content>
                  Check Withdrawal Request
                  <Header.Subheader>
                    You can accept a withdrawal request here
                  </Header.Subheader>
                </Header.Content>
              </Header>
              <Input
                id="request-number"
                type="number"
                placeholder="Request Number"
                fluid
                action
              >
                <input />
                <Button
                  color="teal"
                  onClick={async () =>
                    this.fetchWithdrawRequest(
                      document.getElementById("request-number").value
                    )
                  }
                  loading={this.state.loadingTx.checkRequestNumber}
                >
                  Check
                </Button>
              </Input>
              {this.state.fetchWithdrawRequest.loading && (
                <Segment>
                  <Dimmer active inverted>
                    <Loader inverted content="Loading" />
                  </Dimmer>
                  <Image src="/images/short-paragraph.png" />
                </Segment>
              )}
              {this.state.fetchWithdrawRequest.error ? (
                <Message
                  header="An error has occurred"
                  content="There is no request corresponding to this number."
                  error
                />
              ) : (
                this.state.fetchWithdrawRequest.status && (
                  <Segment textAlign="left" clearing>
                    <List bulleted>
                      <List.Item>
                        Creator's Address:{" "}
                        {this.state.fetchWithdrawRequest.sender}
                      </List.Item>
                      <List.Item>
                        Requested Amount:{" "}
                        {this.props.web3.utils.fromWei(
                          this.state.fetchWithdrawRequest.amount.toString(),
                          "ether"
                        )}{" "}
                        ether
                      </List.Item>
                      <List.Item>
                        Sent on{" "}
                        {moment
                          .unix(this.state.fetchWithdrawRequest.timestamp)
                          .format("dddd, MMMM Do YYYY, h:mm:ss a")}
                      </List.Item>
                      <List.Item>
                        Approval status:{" "}
                        {this.state.fetchWithdrawRequest.approved
                          ? "Approved"
                          : "Pending"}
                      </List.Item>
                    </List>
                    <>
                      {!this.state.fetchWithdrawRequest.approved &&
                        this.state.fetchWithdrawRequest.sender &&
                        this.state.fetchWithdrawRequest.sender.toLowerCase() !==
                          this.props.context.userAddress.toLowerCase() && (
                          <Button
                            floated="right"
                            onClick={() =>
                              this.approveRequest(
                                this.state.fetchWithdrawRequest.requestID
                              )
                            }
                          >
                            Approve Request
                          </Button>
                        )}
                    </>
                  </Segment>
                )
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <TransactionModal {...this.state.transactionModal} />
      </Segment>
    );
  }
}

export default withContext(Withdraw);
