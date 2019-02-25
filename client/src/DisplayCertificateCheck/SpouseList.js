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
  Icon
} from "semantic-ui-react";
import _ from "lodash";
import moment from "moment";
import CryptoJS from "crypto-js";

import getWeb3 from "../utils/getWeb3";

const newCertificateAbi = require("../contracts/MarriageCertificate.json").abi;
let web3 = null;
let certificate;

class SpouseList extends Component {
  state = {
    ethToDollarChange: 0,
    convertEthToDollars: 0,
    ethToTransfer: "",
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
      approved: true
    },
    displayIdNumber: "••••••••••••••••••",
    decryptInput: { error: false, length: 0 },
    transactionModal: {
      open: false,
      icon: "spinner",
      loading: true,
      header: "Waiting for confirmation...",
      message:
        "Your transaction is being confirmed on the blockchain, please wait."
    }
  };

  transactionModalData = status => {
    if (status === "pending") {
      return {
        open: false,
        icon: "spinner",
        loading: true,
        header: "Waiting for confirmation...",
        message:
          "Your transaction is being confirmed on the blockchain, please wait."
      };
    } else if (status === "confirmed") {
      return {
        open: true,
        icon: "thumbs up",
        loading: false,
        header: "Transaction confirmed!",
        message:
          "Your transaction has been successfully confirmed on the blockchain!"
      };
    }
  };

  closeTxModal = status => {
    if (status === true) {
      this.setState({
        transactionModal: this.transactionModalData("confirmed")
      });
      setTimeout(
        () =>
          this.setState({
            transactionModal: this.transactionModalData("pending")
          }),
        3000
      );
    }
  };

  changeMarriageStatus = async () => {
    const changeMarriageStatus = await certificate.methods
      .changeMarriageStatus()
      .send(
        { from: this.props.currentAddress, gas: "300000" },
        (error, txHash) => {
          if (error) {
            console.log("error", error);
          } else {
            console.log("Tx hash: ", txHash);
            this.setState({
              transactionModal: { ...this.state.transactionModal, open: true }
            });
          }
        }
      );
    // when the tx is processed, we display a message to the user and close the modal
    this.closeTxModal(changeMarriageStatus.status);
  };

  depositFunds = async () => {
    this.setState({
      depositFundsModal: {
        ...this.state.depositFundsModal,
        open: true,
        loading: true
      }
    });
    try {
      const funds = web3.utils.toWei(
        this.state.ethToTransfer.toString(),
        "ether"
      );
      const depositTx = await certificate.methods
        .deposit(funds, this.state.depositFundsModal.toAccount)
        .send(
          {
            from: this.props.currentAddress,
            gas: "300000",
            value: funds
          },
          (error, txHash) => {
            if (error) {
              console.log("error", error);
            } else {
              console.log("Tx hash: ", txHash);
              this.setState({
                transactionModal: { ...this.state.transactionModal, open: true }
              });
            }
          }
        );

      if (depositTx.status) {
        // when the tx is processed, we display a message to the user and close the modal
        this.closeTxModal(depositTx.status);
        // we update the data in the state
        this.props.updateBalance(
          "deposit",
          funds,
          this.state.depositFundsModal.toAccount
        );
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
            toAccount: "joined"
          },
          errorSend: true
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  withdrawFunds = async () => {
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
        .withdraw(funds, this.state.withdrawFundsModal.fromAccount)
        .send(
          {
            from: this.props.currentAddress,
            gas: "300000"
          },
          (error, txHash) => {
            if (error) {
              console.log("error", error);
            } else {
              console.log("Tx hash: ", txHash);
              this.setState({
                transactionModal: { ...this.state.transactionModal, open: true }
              });
            }
          }
        );

      if (withdrawTx.status) {
        // when the tx is processed, we display a message to the user and close the modal
        this.closeTxModal(withdrawTx.status);
        // we return the request number for a withdrawal from the savings account
        if (this.state.withdrawFundsModal.fromAccount === "savings") {
          this.setState({
            requestReceipt: {
              status: true,
              tx:
                withdrawTx.events.LogNewWithdrawalRequestFromSavings
                  .returnValues.request
            }
          });
        } else {
          this.props.updateBalance(
            "withdrawal",
            funds,
            this.state.withdrawFundsModal.fromAccount
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
          errorSend: true
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  convertEthToDollars = event => {
    const value = event.target.value.trim();
    this.setState({
      ethToTransfer: value,
      convertEthToDollars:
        Math.round(
          parseFloat(value) * parseFloat(this.state.ethToDollarChange)
        ) || 0
    });
  };

  fetchWithdrawRequest = requestID => {
    this.setState(
      {
        fetchWithdrawRequest: {
          loading: true,
          status: false,
          sender: "",
          amount: 0,
          timestamp: 0,
          approved: true
        }
      },
      async () => {
        try {
          const request = await certificate.methods
            .checkWithdrawRequest(requestID)
            .call();
          if (request) {
            this.setState({
              fetchWithdrawRequest: {
                loading: false,
                status: true,
                requestID,
                sender: request[0],
                amount: request[1],
                timestamp: request[2],
                approved: request[3],
                error: ""
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
            gas: "300000"
          },
          (error, txHash) => {
            if (error) {
              console.log("error", error);
            } else {
              console.log("Tx hash: ", txHash);
              this.setState({
                transactionModal: { ...this.state.transactionModal, open: true }
              });
            }
          }
        );
      // if approved
      if (requestTx.status) {
        // when the tx is processed, we display a message to the user and close the modal
        this.closeTxModal(requestTx.status);
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
          error: error.message.split("revert")[1].trim()
        }
      });
    }
  };

  decryptIdNumber = event => {
    const key = event.target.value;
    // decrypts first spouse id
    const decrypt = CryptoJS.AES.decrypt(
      this.props.details.spousesDetails[this.props.spouse].idNumber.toString(),
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
  };

  componentDidMount = async () => {
    getWeb3().then(async getWeb3 => {
      web3 = getWeb3;

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
    });
  };

  render() {
    const { details, spouse, index, isValid, currentUser } = this.props;

    return (
      <>
        <Modal
          open={this.state.transactionModal.open}
          size="tiny"
          onClose={() =>
            this.setState({
              transactionModal: { ...this.state.transactionModal, open: false }
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
                      )} Number: ${this.state.displayIdNumber}`}</List.Content>
                    }
                    content={
                      <Input
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
          {currentUser && (
            <List.Item>
              <List.Icon name="edit" />
              <List.Content>
                <List.Header>Actions</List.Header>
                <List.Description>
                  Choose one of the actions below:
                </List.Description>
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
                        This will deposit the chosen amount in the joined
                        account.
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
                            text="There was an error transferring the funds."
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
                        style={{ background: "none", borderTop: "none" }}
                      >
                        <Button
                          content="Send"
                          label={{
                            as: "a",
                            basic: true,
                            pointing: "right",
                            content: `≈ $${this.state.convertEthToDollars}`
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
                        This will withdraw the chosen amount from the joined
                        account.
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
                            fromAccount: ""
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
                            text="There was an error withdrawing the funds."
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
                            content={this.state.requestReceipt.tx}
                            size="mini"
                            style={{ wordBreak: "break-word" }}
                            info
                          />
                        )}
                      </Modal.Content>
                      <Modal.Actions
                        style={{ background: "none", borderTop: "none" }}
                      >
                        <Button
                          content="Withdraw"
                          label={{
                            as: "a",
                            basic: true,
                            pointing: "right",
                            content: `≈ $${this.state.convertEthToDollars}`
                          }}
                          labelPosition="left"
                          onClick={this.withdrawFunds}
                          disabled={!this.state.ethToTransfer}
                        />
                      </Modal.Actions>
                    </Modal>
                  </List.Item>
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
                        This will desposit the chosen amount in the savings
                        account.
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
                        This will withdraw the chosen amount from the savings
                        account.
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
                            You can check and approve a withdrawal request made
                            from the savings account.
                          </List.Description>
                        </List.Content>
                      }
                      size="small"
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
                                document.getElementById("request-number").value
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
                        {this.state.fetchWithdrawRequest.status && (
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
                                .unix(this.state.fetchWithdrawRequest.timestamp)
                                .format("dddd, MMMM Do YYYY, h:mm:ss a")}
                            </List.Item>
                            <List.Item>
                              Approval status:{" "}
                              {this.state.fetchWithdrawRequest.approved
                                ? "Approved"
                                : "Pending"}
                            </List.Item>
                            {this.state.fetchWithdrawRequest.error && (
                              <Message
                                size="mini"
                                header="Error"
                                content={this.state.fetchWithdrawRequest.error}
                                error
                              />
                            )}
                          </List>
                        )}
                      </Modal.Content>
                      {!this.state.fetchWithdrawRequest.approved && (
                        <Modal.Actions>
                          <Button
                            onClick={() =>
                              this.approveRequest(
                                this.state.fetchWithdrawRequest.requestID
                              )
                            }
                          >
                            Approve Request
                          </Button>
                        </Modal.Actions>
                      )}
                    </Modal>
                  </List.Item>
                  {isValid[index] ? (
                    <List.Item onClick={this.changeMarriageStatus}>
                      <List.Icon name="thumbs down" />
                      <List.Content>
                        <List.Header as="a">Petition for divorce</List.Header>
                        <List.Description as="a">
                          This will update your status in the marriage contract.
                        </List.Description>
                      </List.Content>
                    </List.Item>
                  ) : (
                    <List.Item onClick={this.changeMarriageStatus}>
                      <List.Icon name="thumbs up" />
                      <List.Content>
                        <List.Header as="a">Approve marriage</List.Header>
                        <List.Description as="a">
                          This will update your status in the marriage contract.
                        </List.Description>
                      </List.Content>
                    </List.Item>
                  )}
                </List>
              </List.Content>
            </List.Item>
          )}
        </List>
      </>
    );
  }
}

export default SpouseList;
