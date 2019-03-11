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
  Icon
} from "semantic-ui-react";
import moment from "moment";

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

class Account extends Component {
  state = {
    loadingAccount: true,
    certificate: CERTIFICATE_OBJ,
    activeMenuItem: "send"
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
        this.setState({
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
            error: null
          },
          loadingAccount: false
        });
      } else {
        this.setState({
          certificate: {
            ...this.state.certificateCheck,
            error: certificate.error
          }
        });
      }
    }
  };

  handleMenuClick = (e, { name }) => this.setState({ activeMenuItem: name });

  componentDidMount = async () => {
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
    const { userCertificate, screenWidth } = this.props.context;
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
  };

  render() {
    const { context } = this.props;
    const { activeMenuItem, certificate } = this.state;
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

    if (this.state.loadingAccount) {
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
    } else {
      if (!context.loggedInUser)
        return (
          <Container text>
            <Message
              icon="sign-in"
              header="You are not signed in"
              content="Please sign in to access your account details"
              info
            />
          </Container>
        );

      return (
        <Container>
          <Grid columns={2} stackable>
            <Grid.Row>
              <Grid.Column width={3} />
              <Grid.Column width={13}>
                <Grid columns={2} stackable>
                  <Grid.Column width={7}>
                    <Message
                      icon="money"
                      header={`Total balance: ${web3.utils.fromWei(
                        this.state.certificate.balance.total.toString(),
                        "ether"
                      )} ether`}
                      list={[
                        `Joined account: ${web3.utils.fromWei(
                          this.state.certificate.balance.joined.toString(),
                          "ether"
                        )} ether`,
                        `Savings account: ${web3.utils.fromWei(
                          this.state.certificate.balance.savings.toString(),
                          "ether"
                        )} ether`
                      ]}
                      color="blue"
                      size={
                        this.state.screenWidth > MIN_SCREEN_WIDTH
                          ? "small"
                          : "tiny"
                      }
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
                      size={
                        this.state.screenWidth > MIN_SCREEN_WIDTH
                          ? "small"
                          : "tiny"
                      }
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
              <Grid.Column width={13}>
                {this.state.activeMenuItem === "send" && <Deposit />}
                {this.state.activeMenuItem === "withdraw" && <Withdraw />}
                {this.state.activeMenuItem === "status" && (
                  <MarriageStatus
                    isMarriageValid={certificate.isMarriageValid}
                    spousesAddresses={spousesAddresses}
                    userAddress={context.userAddress}
                  />
                )}
                {this.state.activeMenuItem === "transactions" && (
                  <TransactionsHistory
                    web3={web3}
                    spousesAddresses={spousesAddresses}
                    certificateAddress={certificate.address}
                    creationTimestamp={certificate.timestamp}
                  />
                )}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      );
    }
  }
}

export default withContext(Account);
