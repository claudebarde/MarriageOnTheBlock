import React, { Component } from "react";
import {
  List,
  Modal,
  Popup,
  Input,
  Message,
  Header,
  Button,
  Segment,
  Dimmer,
  Loader,
  Image,
  Icon,
  Accordion
} from "semantic-ui-react";
import _ from "lodash";
import moment from "moment";
import CryptoJS from "crypto-js";

import firebase from "firebase/app";
import "firebase/firebase-functions";

import getWeb3 from "../utils/getWeb3";
import { GlobalStateConsumer } from "../config/config";

const newCertificateAbi = require("../contracts/MarriageCertificate.json").abi;
let web3 = null;
let certificate;

class SpouseList extends Component {
  state = {
    ethToDollarChange: 0,
    convertEthToDollars: 0,
    ethToTransfer: "",
    gasForTx: 1000000,
    depositFundsModal: { open: false, loading: false, toAccount: "" },
    withdrawFundsModal: { open: false, loading: false, fromAccount: "" },
    errorSend: false,
    requestReceipt: { status: false, tx: 0 },
    fetchWithdrawRequest: {
      loading: false,
      status: false,
      sender: "",
      amount: 0,
      timestamp: 0,
      approved: true,
      error: ""
    },
    displayIdNumber: "••••••••••••••••••",
    decryptInput: { error: false, length: 0 },
    transactionModal: {
      open: false,
      icon: "spinner",
      loading: true,
      header: "Waiting for confirmation...",
      txHash: null,
      message:
        "Your transaction is being confirmed on the blockchain, please wait."
    },
    accordionActiveIndex: null
  };

  transactionModalData = (status, txHash) => {
    if (status === "pending") {
      return {
        open: false,
        icon: "spinner",
        loading: true,
        header: "Waiting for confirmation...",
        txHash,
        message:
          "Your transaction is being confirmed on the blockchain, please wait."
      };
    } else if (status === "confirmed") {
      return {
        open: true,
        icon: "thumbs up",
        loading: false,
        header: "Transaction confirmed!",
        txHash,
        message:
          "Your transaction has been successfully confirmed on the blockchain!"
      };
    } else if (status === "error") {
      return {
        open: true,
        icon: "exclamation triangle",
        loading: false,
        header: "Transaction error!",
        txHash,
        message:
          "There was an error processing this transaction, please try again later."
      };
    }
  };

  closeTxModal = (status, txHash) => {
    if (status === true) {
      this.setState({
        transactionModal: this.transactionModalData("confirmed", txHash)
      });
      setTimeout(
        () =>
          this.setState({
            transactionModal: this.transactionModalData("pending", txHash)
          }),
        3000
      );
    }
  };

  changeMarriageStatus = async () => {
    const changeMarriageStatus = await certificate.methods
      .changeMarriageStatus()
      .send(
        { from: this.props.currentAddress, gas: this.state.gasForTx },
        async (error, txHash) => {
          if (error) {
            console.log("error", error);
          } else {
            console.log("Tx hash: ", txHash);
            // the state is updated
            this.setState({
              transactionModal: {
                ...this.state.transactionModal,
                open: true,
                txHash
              }
            });
          }
        }
      );
    // when the tx is processed, we display a message to the user and close the modal
    this.closeTxModal(
      changeMarriageStatus.status,
      changeMarriageStatus.transactionHash
    );
  };

  updateTxHistory = firebase.functions().httpsCallable("updateTxHistory");

  depositFunds = async () => {
    this.setState({
      depositFundsModal: {
        ...this.state.depositFundsModal,
        open: true,
        loading: true
      }
    });
    let depositTxHash;
    try {
      const funds = web3.utils.toWei(
        this.state.ethToTransfer.toString(),
        "ether"
      );
      const depositTx = await certificate.methods
        .deposit(
          funds,
          web3.utils.fromAscii(this.state.depositFundsModal.toAccount)
        )
        .send(
          {
            from: this.props.currentAddress,
            gas: this.state.gasForTx,
            value: funds
          },
          (error, txHash) => {
            if (error) {
              console.log("error", error);
            } else {
              console.log("Tx hash: ", txHash);
              depositTxHash = txHash;
              this.setState({
                transactionModal: {
                  ...this.state.transactionModal,
                  txHash,
                  open: true
                },
                depositFundsModal: {
                  ...this.state.depositFundsModal,
                  open: false,
                  loading: false
                }
              });
            }
          }
        );

      if (depositTx.status) {
        // when the tx is processed, we display a message to the user and close the modal
        this.closeTxModal(depositTx.status, depositTx.transactionHash);
        // we update the data in the state
        this.props.updateBalance(
          "deposit",
          funds,
          this.state.depositFundsModal.toAccount
        );
        // we update transactions log in firestore
        if (firebase.auth().currentUser) {
          const idToken = await firebase.auth().currentUser.getIdToken(true);
          const data = {
            idToken,
            address: certificate.options.address,
            tx: {
              type: "deposit",
              from: web3.eth.accounts.currentProvider.selectedAddress,
              amount: funds,
              account: this.state.depositFundsModal.toAccount,
              txHash: depositTx.transactionHash
            }
          };
          await this.updateTxHistory(data);
        }
        this.setState({
          depositFundsModal: {
            open: false,
            loading: false,
            toAccount: ""
          },
          convertEthToDollars: 0,
          ethToTransfer: ""
        });
      } else {
        this.setState({
          depositFundsModal: {
            open: false,
            loading: false,
            toAccount: ""
          },
          errorSend: true
        });
      }
    } catch (error) {
      console.log(error);
      const errorMessage = this.transactionModalData("error", depositTxHash);
      this.setState({
        depositFundsModal: {
          open: false,
          loading: false,
          toAccount: ""
        },
        errorSend: true,
        transactionModal: errorMessage
      });
    }
  };

  withdrawTxHistoryUpdate = async (
    type,
    amount,
    account,
    txHash,
    requestID
  ) => {
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
            from: web3.eth.accounts.currentProvider.selectedAddress,
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
            from: web3.eth.accounts.currentProvider.selectedAddress,
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

  withdrawFunds = async () => {
    if (
      parseFloat(this.state.ethToTransfer) >
      parseFloat(
        web3.utils.fromWei(
          this.props.balance[
            this.state.withdrawFundsModal.fromAccount
          ].toString(),
          "ether"
        )
      )
    ) {
      this.setState({ errorSend: true });
      return;
    }

    this.setState({
      withdrawFundsModal: {
        ...this.state.withdrawFundsModal,
        open: true,
        loading: true
      }
    });
    try {
      const funds = web3.utils.toWei(
        this.state.ethToTransfer.toString(),
        "ether"
      );
      const withdrawTx = await certificate.methods
        .withdraw(
          funds,
          web3.utils.fromAscii(this.state.withdrawFundsModal.fromAccount)
        )
        .send(
          {
            from: this.props.currentAddress,
            gas: this.state.gasForTx
          },
          (error, txHash) => {
            if (error) {
              console.log("error", error);
            } else {
              console.log("Tx hash: ", txHash);
              this.setState({
                transactionModal: {
                  ...this.state.transactionModal,
                  open: true,
                  txHash
                },
                errorSend: false
              });
            }
          }
        );

      if (withdrawTx.status) {
        // when the tx is processed, we display a message to the user and close the modal
        this.closeTxModal(withdrawTx.status, withdrawTx.transactionHash);
        // we return the request number for a withdrawal from the savings account
        if (this.state.withdrawFundsModal.fromAccount === "savings") {
          const requestID =
            withdrawTx.events.LogNewWithdrawalRequestFromSavings.returnValues
              .request;
          // we log the transaction in the firestore
          this.withdrawTxHistoryUpdate(
            "withdrawalRequest",
            funds,
            this.state.withdrawFundsModal.fromAccount,
            withdrawTx.transactionHash,
            requestID
          );
          this.setState({
            requestReceipt: {
              status: true,
              tx: requestID
            }
          });
        } else {
          this.props.updateBalance(
            "withdrawal",
            funds,
            this.state.withdrawFundsModal.fromAccount
          );
          // updates transactions history in firestore
          this.withdrawTxHistoryUpdate(
            "withdrawal",
            funds,
            this.state.withdrawFundsModal.fromAccount,
            withdrawTx.transactionHash,
            null
          );
          this.setState({
            withdrawFundsModal: {
              open: false,
              loading: false,
              fromAccount: ""
            },
            convertEthToDollars: 0,
            ethToTransfer: ""
          });
        }
      } else {
        this.setState({
          withdrawFundsModal: { open: false, loading: false, fromAccount: "" },
          transactionModal: {
            ...this.state.transactionModal,
            open: false,
            txHash: null
          },
          errorSend: true
        });
      }
    } catch (error) {
      console.log(error);
      this.setState({
        withdrawFundsModal: { open: false, loading: false, fromAccount: "" },
        transactionModal: {
          ...this.state.transactionModal,
          open: false,
          txHash: null
        },
        errorSend: true
      });
    }
  };

  convertEthToDollars = event => {
    const value = event.target.value.trim().replace("-", "");
    this.setState({
      ethToTransfer: value,
      convertEthToDollars:
        Math.round(
          parseFloat(value) * parseFloat(this.state.ethToDollarChange)
        ) || 0
    });
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
          const request = await certificate.methods
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
    try {
      const requestTx = await certificate.methods
        .approveWithdrawRequestFromSavings(requestID)
        .send(
          {
            from: this.props.currentAddress,
            gas: this.state.gasForTx
          },
          (error, txHash) => {
            if (error) {
              console.log("error", error);
            } else {
              console.log("Tx hash: ", txHash);
              this.setState({
                transactionModal: {
                  ...this.state.transactionModal,
                  open: true,
                  txHash
                }
              });
            }
          }
        );
      // if approved
      if (requestTx.status) {
        // when the tx is processed, we display a message to the user and close the modal
        this.closeTxModal(requestTx.status, requestTx.transactionHash);
        // we update transactions log in firestore
        if (firebase.auth().currentUser) {
          const idToken = await firebase.auth().currentUser.getIdToken(true);
          const data = {
            idToken,
            address: certificate.options.address,
            tx: {
              type: "approvedRequest",
              from: web3.eth.accounts.currentProvider.selectedAddress,
              amount: this.state.fetchWithdrawRequest.amount,
              txHash: requestTx.transactionHash
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
        // we update balances
        this.props.updateBalance(
          "withdrawal",
          this.state.fetchWithdrawRequest.amount,
          "savings"
        );
      }
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

  decryptIdNumber = event => {
    const key = event.target.value;
    // decrypts first spouse id
    try {
      const decrypt = CryptoJS.AES.decrypt(
        this.props.details.spousesDetails[
          this.props.spouse
        ].idNumber.toString(),
        key.toString()
      ).toString(CryptoJS.enc.Utf8);
      // we update the Id Number field according to results
      if (key.length > 0 && decrypt) {
        this.setState({ decryptInput: { error: false, length: key.length } });
        // we update the state with the id numbers
        this.setState({
          displayIdNumber: decrypt
        });
      } else if (key.length === 0 && !decrypt) {
        this.setState({ decryptInput: { error: false, length: 0 } });
      } else {
        this.setState({ decryptInput: { error: true, length: key.length } });
      }
    } catch (error) {
      this.setState({ decryptInput: { error: true, length: key.length } });
    }
  };

  accordionSwitch = (e, titleProps) => {
    const { index } = titleProps;
    const { accordionActiveIndex } = this.state;
    const newIndex = accordionActiveIndex === index ? -1 : index;

    this.setState({ accordionActiveIndex: newIndex });
  };

  componentDidMount = async () => {
    web3 = await getWeb3();
    // creates contract instance
    try {
      certificate = await new web3.eth.Contract(
        newCertificateAbi,
        this.props.details.address
      );
    } catch (error) {
      console.log(error);
    }
    // fetches ether price in dollars
    const ethToDollar = await fetch(
      "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
    );
    ethToDollar
      .json()
      .then(price => this.setState({ ethToDollarChange: price["USD"] }));
  };

  render() {
    const {
      details,
      spouse,
      index,
      isValid,
      currentUser,
      currentAddress,
      balance
    } = this.props;

    const { accordionActiveIndex } = this.state;

    return (
      <GlobalStateConsumer>
        {context => (
          <>
            <Modal
              open={this.state.transactionModal.open}
              size="tiny"
              onClose={() =>
                this.setState({
                  transactionModal: {
                    ...this.state.transactionModal,
                    open: false,
                    txHash: null
                  }
                })
              }
              closeIcon
            >
              <Modal.Header className="modal-header">
                {this.state.transactionModal.header}
              </Modal.Header>
              <Modal.Content>
                <Segment basic placeholder>
                  <Header icon>
                    <Icon
                      name={this.state.transactionModal.icon}
                      loading={this.state.transactionModal.loading}
                    />
                    {this.state.transactionModal.message}
                    <br />
                    <br />
                    <Segment
                      size="tiny"
                      basic
                      secondary
                      style={{ wordBreak: "break-word" }}
                    >
                      {`Transaction hash: ${
                        this.state.transactionModal.txHash
                      }`}
                    </Segment>
                  </Header>
                </Segment>
              </Modal.Content>
            </Modal>
            <List size="small" style={{ wordBreak: "break-word" }}>
              <List.Item>
                <List.Icon name="user" />
                <List.Content>
                  <List.Header>{`${_.upperFirst(
                    details.spousesDetails[spouse].firstName
                  )} ${_.upperFirst(
                    details.spousesDetails[spouse].lastName
                  )}`}</List.Header>
                  <List.Description>
                    {index === 0 ? "Certificate Creator" : "Second Spouse"}
                  </List.Description>
                  <List.List>
                    <List.Item>
                      <List.Icon name="id card" />
                      <Popup
                        trigger={
                          <List.Content as="a">{`${_.upperFirst(
                            details.spousesDetails[spouse].idType
                          )} Number: ${
                            this.state.displayIdNumber
                          }`}</List.Content>
                        }
                        content={
                          <Input
                            type="password"
                            placeholder="Enter security key"
                            icon={
                              !this.state.decryptInput.error &&
                              this.state.decryptInput.length > 0
                                ? "thumbs up outline"
                                : "search"
                            }
                            onChange={this.decryptIdNumber}
                            error={this.state.decryptInput.error}
                            autoFocus
                          />
                        }
                        on="click"
                        position="top left"
                        onClose={() =>
                          this.setState({
                            decryptInput: { error: false, length: 0 }
                          })
                        }
                      />
                    </List.Item>
                    <List.Item>
                      <List.Icon name="linkify" />
                      <List.Content>{`Address: ${
                        details.spousesDetails[spouse].address
                      }`}</List.Content>
                    </List.Item>
                  </List.List>
                </List.Content>
              </List.Item>
              {currentUser && context.loggedInUser && (
                <List.Item>
                  <List.Icon name="edit" />
                  <List.Content>
                    <List.Header>Actions</List.Header>
                    <List.Description>
                      Choose one of the actions below:
                    </List.Description>
                    <br />
                    <Accordion styled fluid>
                      <Accordion.Title
                        active={accordionActiveIndex === 0}
                        index={0}
                        onClick={this.accordionSwitch}
                      >
                        <Icon name="dropdown" />
                        Joined Account
                      </Accordion.Title>
                      <Accordion.Content active={accordionActiveIndex === 0}>
                        <List divided relaxed>
                          <List.Item>
                            <List.Icon name="university" />
                            <List.Content
                              onClick={() =>
                                this.setState({
                                  depositFundsModal: {
                                    open: true,
                                    loading: false,
                                    toAccount: "joined"
                                  }
                                })
                              }
                            >
                              <List.Header as="a">
                                Deposit Funds in Joined Account
                              </List.Header>
                              <List.Description as="a">
                                This will deposit the chosen amount in the
                                joined account.
                              </List.Description>
                            </List.Content>
                            <Modal
                              size="mini"
                              open={this.state.depositFundsModal.open}
                              onClose={() =>
                                this.setState({
                                  depositFundsModal: {
                                    open: false,
                                    loading: false,
                                    toAccount: ""
                                  }
                                })
                              }
                              closeIcon
                            >
                              <Modal.Header className="modal-header">
                                {`Deposit Funds to ${_.upperFirst(
                                  this.state.depositFundsModal.toAccount
                                )} Account`}
                              </Modal.Header>
                              <Modal.Content>
                                {this.state.errorSend && (
                                  <Message
                                    header="An error has occurred"
                                    content="There was an error transferring the funds."
                                    size="tiny"
                                    error
                                  />
                                )}
                                {!context.loggedInUser && (
                                  <Message
                                    header="You are not logged in."
                                    content="This will not be saved in your off-chain transaction history."
                                    size="mini"
                                    warning
                                  />
                                )}
                                {balance &&
                                  web3 &&
                                  this.state.depositFundsModal.toAccount && (
                                    <Message
                                      header="Current balance:"
                                      content={`${web3.utils.fromWei(
                                        balance[
                                          this.state.depositFundsModal.toAccount
                                        ].toString(),
                                        "ether"
                                      )} ether`}
                                      size="mini"
                                      info
                                    />
                                  )}
                                <Header as="h4">Amount in ether :</Header>
                                <Input
                                  type="number"
                                  id="input-transfer"
                                  value={this.state.ethToTransfer}
                                  onChange={this.convertEthToDollars}
                                  icon="ethereum"
                                  iconPosition="left"
                                  autoComplete="off"
                                  autoFocus
                                  fluid
                                />
                              </Modal.Content>
                              <Modal.Actions
                                style={{
                                  background: "none",
                                  borderTop: "none"
                                }}
                              >
                                <Button
                                  content="Send"
                                  label={{
                                    as: "a",
                                    basic: true,
                                    pointing: "right",
                                    content: `≈ $${
                                      this.state.convertEthToDollars
                                    }`
                                  }}
                                  labelPosition="left"
                                  onClick={this.depositFunds}
                                  disabled={!this.state.ethToTransfer}
                                />
                              </Modal.Actions>
                            </Modal>
                          </List.Item>
                          <List.Item>
                            <List.Icon name="share square" />
                            <List.Content
                              onClick={() =>
                                this.setState({
                                  withdrawFundsModal: {
                                    open: true,
                                    loading: false,
                                    fromAccount: "joined"
                                  }
                                })
                              }
                            >
                              <List.Header as="a">
                                Withdraw Funds from Joined Account
                              </List.Header>
                              <List.Description as="a">
                                This will withdraw the chosen amount from the
                                joined account.
                              </List.Description>
                            </List.Content>
                            <Modal
                              size="mini"
                              open={this.state.withdrawFundsModal.open}
                              onClose={() =>
                                this.setState({
                                  withdrawFundsModal: {
                                    open: false,
                                    loading: false,
                                    fromAccount: "joined"
                                  }
                                })
                              }
                              closeIcon
                            >
                              <Modal.Header className="modal-header">
                                {`Withdraw Funds from ${_.upperFirst(
                                  this.state.withdrawFundsModal.fromAccount
                                )} Account`}
                              </Modal.Header>
                              <Modal.Content>
                                {this.state.errorSend && (
                                  <Message
                                    header="An error has occurred"
                                    content="There was an error withdrawing the funds."
                                    size="mini"
                                    error
                                  />
                                )}
                                {!context.loggedInUser && (
                                  <Message
                                    header="You are not logged in."
                                    content="This will not be saved in your off-chain transaction history."
                                    size="mini"
                                    warning
                                  />
                                )}
                                {balance &&
                                  web3 &&
                                  this.state.withdrawFundsModal.fromAccount && (
                                    <Message
                                      header="Available balance:"
                                      content={`${web3.utils.fromWei(
                                        balance[
                                          this.state.withdrawFundsModal
                                            .fromAccount
                                        ].toString(),
                                        "ether"
                                      )} ether`}
                                      size="mini"
                                      info
                                    />
                                  )}
                                <Header as="h4">Amount in ether :</Header>
                                <Input
                                  type="number"
                                  placeholder="Amount to withdraw..."
                                  id="input-withdraw"
                                  value={this.state.ethToTransfer}
                                  onChange={this.convertEthToDollars}
                                  icon="ethereum"
                                  autoComplete="off"
                                  iconPosition="left"
                                  autoFocus
                                  fluid
                                />
                                {this.state.requestReceipt.status && (
                                  <Message
                                    header="Withdrawal Request Receipt :"
                                    content={`${
                                      this.state.requestReceipt.tx
                                    } -> Please give this receipt number to your spouse to confirm the withdrawal.`}
                                    size="mini"
                                    style={{ wordBreak: "break-word" }}
                                    info
                                  />
                                )}
                              </Modal.Content>
                              <Modal.Actions
                                style={{
                                  background: "none",
                                  borderTop: "none"
                                }}
                              >
                                <Button
                                  content="Withdraw"
                                  label={{
                                    as: "a",
                                    basic: true,
                                    pointing: "right",
                                    content: `≈ $${
                                      this.state.convertEthToDollars
                                    }`
                                  }}
                                  labelPosition="left"
                                  onClick={this.withdrawFunds}
                                  disabled={!this.state.ethToTransfer}
                                />
                              </Modal.Actions>
                            </Modal>
                          </List.Item>
                        </List>
                      </Accordion.Content>

                      <Accordion.Title
                        active={accordionActiveIndex === 1}
                        index={1}
                        onClick={this.accordionSwitch}
                      >
                        <Icon name="dropdown" />
                        Savings Account
                      </Accordion.Title>
                      <Accordion.Content active={accordionActiveIndex === 1}>
                        <List divided relaxed>
                          <List.Item>
                            <List.Icon name="lock" />
                            <List.Content
                              onClick={() =>
                                this.setState({
                                  depositFundsModal: {
                                    open: true,
                                    loading: false,
                                    toAccount: "savings"
                                  }
                                })
                              }
                            >
                              <List.Header as="a">
                                Deposit Funds in Savings Account
                              </List.Header>
                              <List.Description as="a">
                                This will desposit the chosen amount in the
                                savings account.
                              </List.Description>
                            </List.Content>
                          </List.Item>
                          <List.Item>
                            <List.Icon name="lock open" />
                            <List.Content
                              onClick={() =>
                                this.setState({
                                  withdrawFundsModal: {
                                    open: true,
                                    loading: false,
                                    fromAccount: "savings"
                                  }
                                })
                              }
                            >
                              <List.Header as="a">
                                Withdraw Funds from Savings Account
                              </List.Header>
                              <List.Description as="a">
                                This will withdraw the chosen amount from the
                                savings account.
                                <br />
                                The approval of the second spouse is required.
                              </List.Description>
                            </List.Content>
                          </List.Item>
                          <List.Item>
                            <List.Icon name="certificate" />
                            <Modal
                              trigger={
                                <List.Content>
                                  <List.Header as="a">
                                    Check Withdrawal Request
                                  </List.Header>
                                  <List.Description as="a">
                                    You can check and approve a withdrawal
                                    request made from the savings account.
                                  </List.Description>
                                </List.Content>
                              }
                              size="tiny"
                              onOpen={() =>
                                this.setState({
                                  fetchWithdrawRequest: {
                                    loading: false,
                                    status: false,
                                    sender: "",
                                    amount: 0,
                                    timestamp: 0,
                                    approved: true
                                  }
                                })
                              }
                              closeIcon
                            >
                              <Modal.Header className="modal-header">
                                Check Withdrawal Request
                              </Modal.Header>
                              <Modal.Content>
                                <Header as="h4">Enter Request Number :</Header>
                                <Input
                                  id="request-number"
                                  type="number"
                                  placeholder="Request Number"
                                  action={{
                                    icon: "search",
                                    onClick: async () =>
                                      this.fetchWithdrawRequest(
                                        document.getElementById(
                                          "request-number"
                                        ).value
                                      )
                                  }}
                                  fluid
                                  autoFocus
                                />
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
                                    <List bulleted>
                                      <List.Item>
                                        Creator's Address:{" "}
                                        {this.state.fetchWithdrawRequest.sender}
                                      </List.Item>
                                      <List.Item>
                                        Requested Amount:{" "}
                                        {web3.utils.fromWei(
                                          this.state.fetchWithdrawRequest.amount.toString(),
                                          "ether"
                                        )}{" "}
                                        ether
                                      </List.Item>
                                      <List.Item>
                                        Sent on{" "}
                                        {moment
                                          .unix(
                                            this.state.fetchWithdrawRequest
                                              .timestamp
                                          )
                                          .format(
                                            "dddd, MMMM Do YYYY, h:mm:ss a"
                                          )}
                                      </List.Item>
                                      <List.Item>
                                        Approval status:{" "}
                                        {this.state.fetchWithdrawRequest
                                          .approved
                                          ? "Approved"
                                          : "Pending"}
                                      </List.Item>
                                    </List>
                                  )
                                )}
                              </Modal.Content>
                              {!this.state.fetchWithdrawRequest.approved &&
                                this.state.fetchWithdrawRequest.sender &&
                                this.state.fetchWithdrawRequest.sender.toLowerCase() !==
                                  currentAddress.toLowerCase() && (
                                  <Modal.Actions>
                                    <Button
                                      onClick={() =>
                                        this.approveRequest(
                                          this.state.fetchWithdrawRequest
                                            .requestID
                                        )
                                      }
                                    >
                                      Approve Request
                                    </Button>
                                  </Modal.Actions>
                                )}
                            </Modal>
                          </List.Item>
                        </List>
                      </Accordion.Content>

                      <Accordion.Title
                        active={accordionActiveIndex === 2}
                        index={2}
                        onClick={this.accordionSwitch}
                      >
                        <Icon name="dropdown" />
                        Marriage Status
                      </Accordion.Title>
                      <Accordion.Content active={accordionActiveIndex === 2}>
                        <List divided relaxed>
                          {isValid[index] ? (
                            <List.Item onClick={this.changeMarriageStatus}>
                              <List.Icon name="thumbs down" />
                              <List.Content>
                                <List.Header as="a">
                                  Petition for divorce
                                </List.Header>
                                <List.Description as="a">
                                  This will update your status in the marriage
                                  contract.
                                </List.Description>
                              </List.Content>
                            </List.Item>
                          ) : (
                            <List.Item onClick={this.changeMarriageStatus}>
                              <List.Icon name="thumbs up" />
                              <List.Content>
                                <List.Header as="a">
                                  Approve marriage
                                </List.Header>
                                <List.Description as="a">
                                  This will update your status in the marriage
                                  contract.
                                </List.Description>
                              </List.Content>
                            </List.Item>
                          )}
                        </List>
                      </Accordion.Content>
                    </Accordion>
                  </List.Content>
                </List.Item>
              )}
            </List>
          </>
        )}
      </GlobalStateConsumer>
    );
  }
}

export default SpouseList;
