import React, { Component } from "react";
import {
  Grid,
  List,
  Segment,
  Modal,
  Header,
  Input,
  Button,
  Message
} from "semantic-ui-react";
import _ from "lodash";
import moment from "moment";

const newCertificateAbi = require("../contracts/MarriageCertificate.json").abi;
let web3 = null;
let certificate;

class DisplayCertificateCheck extends Component {
  constructor(props) {
    super(props);
    web3 = this.props.web3;
    this.state = {
      ethToDollarChange: 0,
      convertEthToDollars: 0,
      ethToTransfer: "",
      depositFundsModal: { open: false, loading: false },
      withdrawFundsModal: { open: false, loading: false },
      errorSend: false
    };
  }

  changeMarriageStatus = async () => {
    await certificate.methods
      .changeMarriageStatus()
      .send(
        { from: this.props.currentUser, gas: "300000" },
        (error, txHash) => {
          if (error) {
            console.log("error", error);
          } else {
            console.log(txHash);
          }
        }
      );
  };

  depositFunds = async () => {
    this.setState({ depositFundsModal: { open: true, loading: true } });
    try {
      const funds = web3.utils.toWei(
        this.state.ethToTransfer.toString(),
        "ether"
      );
      const depositTx = await certificate.methods.deposit(funds).send({
        from: this.props.currentUser,
        gas: "300000",
        value: funds
      });

      if (depositTx.status) {
        this.props.updateBalance("deposit", funds);
        this.setState({
          depositFundsModal: { open: false, loading: false },
          convertEthToDollars: 0,
          ethToTransfer: ""
        });
      } else {
        this.setState({
          depositFundsModal: { open: false, loading: false },
          errorSend: true
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  withdrawFunds = async () => {
    this.setState({
      withdrawFundsModal: { open: true, loading: true },
      convertEthToDollars: 0,
      ethToTransfer: ""
    });
    try {
      const funds = web3.utils.toWei(
        this.state.ethToTransfer.toString(),
        "ether"
      );
      const withdrawTx = await certificate.methods.withdraw(funds).send({
        from: this.props.currentUser,
        gas: "300000"
      });

      if (withdrawTx.status) {
        this.props.updateBalance("withdrawal", funds);
        this.setState({ withdrawFundsModal: { open: false, loading: false } });
      } else {
        this.setState({
          withdrawFundsModal: { open: false, loading: false },
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

  spouseList = (details, spouse, index, isValid, currentUser) => (
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
              <List.Content>{`${_.upperFirst(
                details.spousesDetails[spouse].idType
              )} Number: ••••••••••••`}</List.Content>
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
                      depositFundsModal: { open: true, loading: false }
                    })
                  }
                >
                  <List.Header as="a">
                    Deposit Funds in General Account
                  </List.Header>
                  <List.Description as="a">
                    This will deposit the chosen amount in the joint account.
                  </List.Description>
                </List.Content>
                <Modal
                  size="mini"
                  open={this.state.depositFundsModal.open}
                  onClose={() =>
                    this.setState({
                      depositFundsModal: { open: false, loading: false }
                    })
                  }
                  closeIcon
                >
                  <Modal.Header className="modal-header">
                    Deposit Funds
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
                      placeholder="Amount to transfer..."
                      id="input-transfer"
                      value={this.state.ethToTransfer}
                      onChange={this.convertEthToDollars}
                      icon="ethereum"
                      autoComplete="off"
                      iconPosition="left"
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
                      withdrawFundsModal: { open: true, loading: false }
                    })
                  }
                >
                  <List.Header as="a">
                    Withdraw Funds from General Account
                  </List.Header>
                  <List.Description as="a">
                    This will withdraw the chosen amount from the joint account.
                  </List.Description>
                </List.Content>
                <Modal
                  size="mini"
                  open={this.state.withdrawFundsModal.open}
                  onClose={() =>
                    this.setState({
                      withdrawFundsModal: { open: false, loading: false }
                    })
                  }
                  closeIcon
                >
                  <Modal.Header className="modal-header">
                    Withdraw Funds
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
                <List.Content>
                  <List.Header as="a">
                    Deposit Funds in Savings Account
                  </List.Header>
                  <List.Description as="a">
                    This will desposit the chosen amount in the savings account.
                  </List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Icon name="lock open" />
                <List.Content>
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
  );

  componentDidMount = async () => {
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
    const details = this.props.details;

    let marriageValidity = { value: 0, message: "error" };
    const isValid = Object.keys(details.isMarriageValid).map(
      key => details.isMarriageValid[key]
    );
    switch (true) {
      case isValid[0] === true && isValid[1] === false:
        marriageValidity = {
          value: "Not Valid",
          message: "Second spouse did not approve or disapproved the marriage"
        };
        break;
      case isValid[0] === true && isValid[1] === true:
        marriageValidity = {
          value: "Valid",
          message: "The marriage has been approved by both spouses"
        };
        break;
      case isValid[0] === false && isValid[1] === true:
        marriageValidity = {
          value: "Not Valid",
          message: "First spouse disapproved the marriage"
        };
        break;
      case isValid[0] === false && isValid[1] === false:
        marriageValidity = {
          value: "Not Valid",
          message: "The spouses have divorced"
        };
        break;
      default:
        break;
    }

    return (
      <Segment>
        <Grid columns={2} stackable>
          <Grid.Row textAlign="left">
            <Grid.Column width={16}>
              <List size="small">
                <List.Item>
                  <List.Icon name="globe" />
                  <List.Content>
                    <List.Header>Place of registration:</List.Header>
                    <List.Description>
                      {details.location.city}, {details.location.country}
                    </List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name="calendar alternate" />
                  <List.Content>
                    <List.Header>Date of registration:</List.Header>
                    <List.Description>
                      {moment
                        .unix(details.timestamp)
                        .format("dddd, MMMM Do YYYY, h:mm:ss a")}
                    </List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  {isValid[0] === true && isValid[1] === true ? (
                    <List.Icon name="check circle" />
                  ) : (
                    <List.Icon name="times circle" />
                  )}
                  <List.Content>
                    <List.Header>Marriage Validity:</List.Header>
                    <List.Description>
                      {marriageValidity.value}
                      <br />({marriageValidity.message})
                    </List.Description>
                  </List.Content>
                </List.Item>
                {(this.props.currentUser ===
                  details.spousesDetails.firstSpouseDetails.address ||
                  this.props.currentUser ===
                    details.spousesDetails.secondSpouseDetails.address) && (
                  <List.Item>
                    <List.Icon name="calculator" />
                    <List.Content>
                      <List.Header>Account Balance:</List.Header>
                      <List.Description>
                        {web3.utils.fromWei(
                          details.balance.toString(),
                          "ether"
                        )}{" "}
                        ether
                      </List.Description>
                    </List.Content>
                  </List.Item>
                )}
              </List>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row textAlign="left">
            {Object.keys(details.spousesDetails).map((spouse, index) => (
              <Grid.Column key={spouse}>
                {details.spousesDetails[spouse].address ===
                this.props.currentUser ? (
                  <Segment secondary>
                    {this.spouseList(details, spouse, index, isValid, true)}
                  </Segment>
                ) : (
                  <Segment basic>
                    {this.spouseList(details, spouse, index, isValid, false)}
                  </Segment>
                )}
              </Grid.Column>
            ))}
          </Grid.Row>
        </Grid>
      </Segment>
    );
  }
}

export default DisplayCertificateCheck;
