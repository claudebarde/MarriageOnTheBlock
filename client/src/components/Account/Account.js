import React, { Component } from "react";
import {
  Container,
  Message,
  Segment,
  Dimmer,
  Loader,
  Image,
  Grid,
  Menu,
  Icon,
  Transition
} from "semantic-ui-react";
import moment from "moment";
import { Redirect } from "react-router";

import firebase from "firebase/app";
import "firebase/firebase-functions";

import {
  withContext,
  CERTIFICATE_OBJ,
  MIN_SCREEN_WIDTH
} from "../../config/config";
import { checkCertificate } from "../../utils/functions";
import Deposit from "./Deposit";
import TransactionsHistory from "./TransactionsHistory";
import MarriageStatus from "./MarriageStatus";
import Withdraw from "./Withdraw";

import getWeb3 from "../../utils/getWeb3";
let web3;

let subscribedEvents = {};

class Account extends Component {
  state = {
    loadingAccount: true,
    certificate: CERTIFICATE_OBJ,
    activeMenuItem: "send",
    ethToDollarChange: 0
  };

  fetchCertificateDetails = async address => {
    if (address) {
      const certificate = await checkCertificate(address);
      if (certificate.return === "OK") {
        // we lowercase the address to compare it later with current user address
        let spouse1details = JSON.parse(certificate.spouse1);
        let spouse2details = JSON.parse(certificate.spouse2);
        spouse1details.address = spouse1details.address.toLowerCase();
        spouse2details.address = spouse2details.address.toLowerCase();
        // we update the state with the data
        this.setState(
          {
            certificate: {
              ...this.state.certificate,
              timestamp: certificate.timestamp,
              location: JSON.parse(certificate.location),
              spousesDetails: {
                firstSpouseDetails: spouse1details,
                secondSpouseDetails: spouse2details
              },
              isMarriageValid: certificate.isMarriageValid,
              balance: certificate.balance,
              instance: certificate.instance,
              error: null
            },
            loadingAccount: false
          },
          () => {
            // subscription to events
            this.subscribeLogEvent(
              this.state.certificate.instance,
              "LogMarriageValidity"
            );
            this.subscribeLogEvent(
              this.state.certificate.instance,
              "LogBalance"
            );
          }
        );
      } else {
        this.setState({
          certificate: {
            ...this.state.certificate,
            error: certificate.error
          }
        });
      }
    }
  };

  /*updateBalance = (txType, newTxAmount, account) => {
    let newBalance = { ...this.state.certificate.balance };
    // if deposit, we add values
    if (txType === "deposit") {
      // update the total balance
      newBalance.total = parseInt(newBalance.total) + parseInt(newTxAmount);
      if (account === "joint") {
        // update the joint account
        newBalance.joint = parseInt(newBalance.joint) + parseInt(newTxAmount);
      } else if (account === "savings") {
        // update the joint account
        newBalance.savings =
          parseInt(newBalance.savings) + parseInt(newTxAmount);
      }
    } else if (txType === "withdrawal") {
      // update the total balance
      newBalance.total = parseInt(newBalance.total) - parseInt(newTxAmount);
      if (account === "joint") {
        // update the joint account
        newBalance.joint = parseInt(newBalance.joint) - parseInt(newTxAmount);
      } else if (account === "savings") {
        // update the joint account
        newBalance.savings =
          parseInt(newBalance.savings) - parseInt(newTxAmount);
      }
    }
    this.setState({
      certificate: {
        ...this.state.certificate,
        balance: newBalance
      }
    });
  };*/

  handleMenuClick = (e, { name }) => this.setState({ activeMenuItem: name });

  subscribeLogEvent = (contract, eventName) => {
    if (subscribedEvents.hasOwnProperty(eventName) === false) {
      const eventJsonInterface = web3.utils._.find(
        contract._jsonInterface,
        o => o.name === eventName && o.type === "event"
      );
      const subscription = web3.eth.subscribe(
        "logs",
        {
          address: contract.options.address,
          topics: [eventJsonInterface.signature]
        },
        async (error, result) => {
          if (!error) {
            const eventObj = web3.eth.abi.decodeLog(
              eventJsonInterface.inputs,
              result.data,
              result.topics.slice(1)
            );
            //console.log(`New ${eventName}!`, eventObj);
            // we update the state with new contract state
            if (eventName === "LogMarriageValidity") {
              // we log the update in the firestore
              if (firebase.auth().currentUser) {
                const updateTxHistory = firebase
                  .functions()
                  .httpsCallable("updateTxHistory");
                const idToken = await firebase
                  .auth()
                  .currentUser.getIdToken(true);
                await updateTxHistory({
                  idToken,
                  address: contract.options.address,
                  tx: {
                    type: "statusUpdate",
                    from: web3.eth.accounts.currentProvider.selectedAddress,
                    previousState: [
                      this.state.certificate.isMarriageValid[0],
                      this.state.certificate.isMarriageValid[1]
                    ],
                    newState: eventObj.validity,
                    txHash: result.transactionHash
                  }
                });
              }
              this.setState({
                certificate: {
                  ...this.state.certificate,
                  isMarriageValid: {
                    0: eventObj.validity[0],
                    1: eventObj.validity[1]
                  }
                }
              });
            } else if (eventName === "LogBalance") {
              const { total, joint, savings } = eventObj;
              this.setState({
                certificate: {
                  ...this.state.certificate,
                  balance: { total, joint, savings }
                }
              });
            }
          }
        }
      );
      subscribedEvents[eventName] = subscription;
    }
  };

  componentDidMount = async () => {
    // fetches ether price in dollars
    const ethToDollar = await fetch(
      "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
    );
    ethToDollar
      .json()
      .then(price => this.setState({ ethToDollarChange: price["USD"] }));
    // we check if user is already logged in
    if (this.props.context.userCertificate) {
      this.setState(
        {
          certificate: {
            ...this.state.certificate,
            address: this.props.context.userCertificate
          }
        },
        async () =>
          await this.fetchCertificateDetails(this.state.certificate.address)
      );
    }
    // loads web3
    try {
      // creates instance of contract
      web3 = await getWeb3();
      await web3.eth.net.isListening();
      console.log("web3 started!");
    } catch (error) {
      console.log(error);
    }
  };

  componentDidUpdate = () => {
    // checks user certificate and screen width
    const { userCertificate, screenWidth, loggedInUser } = this.props.context;
    // checks if different certificate is loaded
    if (userCertificate !== this.state.certificate.address) {
      this.setState(
        {
          certificate: {
            ...this.state.certificate,
            address: userCertificate
          }
        },
        async () =>
          await this.fetchCertificateDetails(this.state.certificate.address)
      );
    }
    // checks screen width changes
    if (screenWidth !== this.state.screenWidth) {
      this.setState({ screenWidth });
    }
    // checks if logged in user created a certificate
    if (
      loggedInUser &&
      userCertificate === null &&
      this.state.loadingAccount === true
    ) {
      this.setState({ loadingAccount: false });
    }
  };

  render() {
    const { context } = this.props;
    const { activeMenuItem, certificate, ethToDollarChange } = this.state;
    // we store spouses addresses in an array for later comparison
    const spousesAddresses = [
      certificate.spousesDetails.firstSpouseDetails.address,
      certificate.spousesDetails.secondSpouseDetails.address
    ];
    // menu attributes must be conditionally created
    const menuAttributes = {
      pointing: true,
      secondary: true,
      vertical: this.state.screenWidth > MIN_SCREEN_WIDTH,
      fluid: true,
      icon: "labeled"
    };
    if (this.state.screenWidth < MIN_SCREEN_WIDTH) {
      menuAttributes.widths = 4;
    }

    // if user is not logged in
    if (context.loggedInUser === false) return <Redirect to="/" />;

    if (this.state.loadingAccount)
      return (
        <Container text>
          <Segment>
            <Dimmer active inverted>
              <Loader inverted content="Loading" />
            </Dimmer>
            <Image src="/images/short-paragraph.png" />
          </Segment>
        </Container>
      );

    // the user is logged in but has no certificate
    if (context.loggedInUser && context.userCertificate === null)
      return (
        <Container text>
          <Message
            icon="sign-in"
            header="You do not have a marriage certificate yet."
            content="Please create a marriage certificate to use your account."
            info
          />
        </Container>
      );

    const totalBalanceInETH = web3.utils.fromWei(
      this.state.certificate.balance.total.toString(),
      "ether"
    );

    // checks if mobile version
    const mobile = this.state.screenWidth <= MIN_SCREEN_WIDTH;

    return (
      <Container>
        <Grid columns={2} stackable>
          <Grid.Row>
            <Grid.Column width={3} textAlign="center">
              {!mobile && (
                <>
                  <Transition
                    visible={activeMenuItem === "send"}
                    animation="scale"
                    duration={500}
                  >
                    <Image
                      size="small"
                      src="/images/undraw_wallet_aym5.svg"
                      style={{ position: "absolute", right: "0px" }}
                    />
                  </Transition>
                  <Transition
                    visible={activeMenuItem === "withdraw"}
                    animation="scale"
                    duration={500}
                  >
                    <Image
                      size="small"
                      src="/images/undraw_savings_hjfl.svg"
                      style={{ position: "absolute", right: "0px" }}
                    />
                  </Transition>
                  <Transition
                    visible={activeMenuItem === "status"}
                    animation="scale"
                    duration={500}
                  >
                    <Image
                      size="small"
                      src="/images/undraw_synchronize_ccxk.svg"
                      style={{ position: "absolute", right: "0px" }}
                    />
                  </Transition>
                  <Transition
                    visible={activeMenuItem === "transactions"}
                    animation="scale"
                    duration={500}
                  >
                    <Image
                      size="small"
                      src="/images/undraw_spreadsheets_xdjy.svg"
                      style={{ position: "absolute", right: "0px" }}
                    />
                  </Transition>
                </>
              )}
            </Grid.Column>
            <Grid.Column width={13}>
              <Grid columns={2} stackable>
                <Grid.Column width={7}>
                  <Message
                    icon="money"
                    header={`Total balance: ${totalBalanceInETH} ether (≈ $${Math.round(
                      parseFloat(totalBalanceInETH) *
                        this.state.ethToDollarChange
                    )})`}
                    list={[
                      `Joint account: ${web3.utils.fromWei(
                        this.state.certificate.balance.joint.toString(),
                        "ether"
                      )} ether`,
                      `Savings account: ${web3.utils.fromWei(
                        this.state.certificate.balance.savings.toString(),
                        "ether"
                      )} ether`
                    ]}
                    color="blue"
                    size={!mobile ? "small" : "tiny"}
                  />
                </Grid.Column>
                <Grid.Column width={9}>
                  <Message
                    icon="address card"
                    header="Certificate address"
                    list={[
                      this.state.certificate.address,
                      `Created on ${moment
                        .unix(this.state.certificate.timestamp)
                        .format("dddd, MMMM Do YYYY, h:mm:ss a")}`
                    ]}
                    color="yellow"
                    size={!mobile ? "small" : "tiny"}
                  />
                </Grid.Column>
              </Grid>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={3}>
              <Menu {...menuAttributes}>
                <Menu.Item
                  name="send"
                  active={activeMenuItem === "send"}
                  onClick={this.handleMenuClick}
                  link
                >
                  <Icon name="paper plane" />
                  Send
                </Menu.Item>
                <Menu.Item
                  name="withdraw"
                  active={activeMenuItem === "withdraw"}
                  onClick={this.handleMenuClick}
                  link
                >
                  <Icon name="shopping cart" />
                  Withdraw
                </Menu.Item>
                <Menu.Item
                  name="status"
                  active={activeMenuItem === "status"}
                  onClick={this.handleMenuClick}
                  link
                >
                  <Icon name="file" />
                  Status
                </Menu.Item>
                <Menu.Item
                  name="transactions"
                  active={activeMenuItem === "transactions"}
                  onClick={this.handleMenuClick}
                  link
                >
                  <Icon name="exchange" />
                  Transactions
                </Menu.Item>
              </Menu>
            </Grid.Column>
            {!spousesAddresses.includes(context.userAddress) ? (
              <Grid.Column>
                <Message
                  icon="exclamation triangle"
                  header="You are not allowed to access this page"
                  content="The two spouses only are allowed to send, desposit and
                    withdraw money and to change the marriage status"
                  error
                />
              </Grid.Column>
            ) : (
              <Grid.Column width={13}>
                {this.state.activeMenuItem === "send" && (
                  <Deposit
                    web3={web3}
                    certificate={certificate.instance}
                    userAddress={context.userAddress}
                    gasForTx={context.gasForTx}
                    ethToDollarChange={ethToDollarChange}
                  />
                )}
                {this.state.activeMenuItem === "withdraw" && (
                  <Withdraw
                    web3={web3}
                    certificate={certificate.instance}
                    gasForTx={context.gasForTx}
                    ethToDollarChange={ethToDollarChange}
                    balance={this.state.certificate.balance}
                  />
                )}
                {this.state.activeMenuItem === "status" && (
                  <MarriageStatus
                    certificate={certificate}
                    spousesAddresses={spousesAddresses}
                    userAddress={context.userAddress}
                    web3={web3}
                    network={context.network}
                    gasForTx={context.gasForTx}
                  />
                )}
                {this.state.activeMenuItem === "transactions" && (
                  <TransactionsHistory
                    web3={web3}
                    spousesAddresses={spousesAddresses}
                    certificateAddress={certificate.address}
                    creationTimestamp={certificate.timestamp}
                    mobile={mobile}
                  />
                )}
              </Grid.Column>
            )}
          </Grid.Row>
        </Grid>
      </Container>
    );
  }
}

export default withContext(Account);
