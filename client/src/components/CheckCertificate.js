import React, { Component } from "react";
import {
  Form,
  Message,
  Input,
  Dimmer,
  Loader,
  Segment,
  Image,
  Container
} from "semantic-ui-react";
import { withRouter } from "react-router-dom";

import firebase from "firebase/app";
import "firebase/firebase-functions";

import DisplayCertificateCheck from "../DisplayCertificateCheck/DisplayCertificateCheck";
import { checkCertificate } from "../utils/functions";
import {
  MIN_SCREEN_WIDTH,
  CERTIFICATE_OBJ,
  withContext
} from "../config/config";
import getWeb3 from "../utils/getWeb3";
let web3 = null;

let subscribedEvents = {};

class CheckCertificate extends Component {
  state = {
    minScreenWidth: MIN_SCREEN_WIDTH,
    certificateCheck: CERTIFICATE_OBJ,
    fetchingCertificateDetails: false,
    showCertificateCheckDetails: false
  };

  fetchCertificateDetails = async () => {
    this.setState({
      fetchingCertificateDetails: true,
      showCertificateCheckDetails: false
    });
    const address = this.state.certificateCheck.address;
    const certificate = await checkCertificate(address);
    if (certificate.return === "OK") {
      // we lowercase the address to compare it later with current user address
      let spouse1details = JSON.parse(certificate.spouse1);
      let spouse2details = JSON.parse(certificate.spouse2);
      spouse1details.address = spouse1details.address.toLowerCase();
      spouse2details.address = spouse2details.address.toLowerCase();
      // we update the state with the data
      this.setState({
        certificateCheck: {
          ...this.state.certificateCheck,
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
        showCertificateCheckDetails: true,
        fetchingCertificateDetails: false
      });
      // subscription to events
      this.subscribeLogEvent(certificate.instance, "LogMarriageValidity");
      // updates the URL to include contract address
      if (
        this.props.location &&
        !web3.utils.isAddress(this.props.match.params.address)
      ) {
        // if there is no address in the url
        let url = this.props.location.pathname;
        // we make sure there is no trailing slash at the end
        if (url[url.length - 1] === "/") {
          url = url.slice(0, -1);
        }
        // we create the url including the address
        let newURL = url + `/${address}`;
        this.props.history.push(newURL);
      } else if (
        this.props.location &&
        web3.utils.isAddress(this.props.match.params.address) &&
        this.props.match.params.address.toLowerCase() !== address.toLowerCase()
      ) {
        // if there is a different address in the url
        let url = this.props.location.pathname;
        // we make sure there is no trailing slash at the end
        if (url[url.length - 1] === "/") {
          url = url.slice(0, -1);
        }
        // we create the url including the address
        let newURL = url.replace(this.props.match.params.address, address);
        this.props.history.push(newURL);
      }
    } else {
      this.setState({
        certificateCheck: {
          ...this.state.certificateCheck,
          error: certificate.error
        },
        showCertificateCheckDetails: true,
        fetchingCertificateDetails: false
      });
    }
  };

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
                    this.state.certificateCheck.isMarriageValid[0],
                    this.state.certificateCheck.isMarriageValid[1]
                  ],
                  newState: eventObj.validity,
                  txHash: result.transactionHash
                }
              });
            }
            // we update the state with new contract state
            if (eventName === "LogMarriageValidity") {
              this.setState({
                certificateCheck: {
                  ...this.state.certificateCheck,
                  isMarriageValid: {
                    0: eventObj.validity[0],
                    1: eventObj.validity[1]
                  }
                }
              });
            }
          }
        }
      );
      subscribedEvents[eventName] = subscription;
    }
  };

  updateBalance = (txType, newTxAmount, account) => {
    let newBalance = { ...this.state.certificateCheck.balance };
    // if deposit, we add values
    if (txType === "deposit") {
      // update the total balance
      newBalance.total = parseInt(newBalance.total) + parseInt(newTxAmount);
      if (account === "joined") {
        // update the joined account
        newBalance.joined = parseInt(newBalance.joined) + parseInt(newTxAmount);
      } else if (account === "savings") {
        // update the joined account
        newBalance.savings =
          parseInt(newBalance.savings) + parseInt(newTxAmount);
      }
    } else if (txType === "withdrawal") {
      // update the total balance
      newBalance.total = parseInt(newBalance.total) - parseInt(newTxAmount);
      if (account === "joined") {
        // update the joined account
        newBalance.joined = parseInt(newBalance.joined) - parseInt(newTxAmount);
      } else if (account === "savings") {
        // update the joined account
        newBalance.savings =
          parseInt(newBalance.savings) - parseInt(newTxAmount);
      }
    }
    this.setState({
      certificateCheck: {
        ...this.state.certificateCheck,
        balance: newBalance
      }
    });
  };

  componentDidMount = async () => {
    // listens to window resizing
    window.addEventListener("resize", this.handleWindowSizeChange);
    try {
      // creates instance of contract
      web3 = await getWeb3();
      await web3.eth.net.isListening();
      console.log("web3 started!");
      this.setState({
        isConnected: true
      });
      // fetch contract details if address is provided
      if (
        this.props.match.params.address &&
        web3.utils.isAddress(this.props.match.params.address)
      ) {
        this.setState(
          {
            certificateCheck: {
              ...this.state.certificateCheck,
              address: this.props.match.params.address
            }
          },
          async () => await this.fetchCertificateDetails()
        );
      }
    } catch (error) {
      console.log("Error while fetching details from contract: ", error);
    }
  };

  componentDidUpdate = () => {
    // fetch contract details if address is provided
    if (
      this.props.match.params.address &&
      web3 &&
      web3.utils.isAddress(this.props.match.params.address) &&
      !this.state.certificateCheck.address
    ) {
      this.setState(
        {
          certificateCheck: {
            ...this.state.certificateCheck,
            address: this.props.match.params.address
          }
        },
        async () => await this.fetchCertificateDetails()
      );
    }
  };

  componentWillUnmount = () => {
    clearInterval(this.state.addressChangeListener);
  };

  render() {
    const { context } = this.props;
    return (
      <Container>
        <Form>
          <Form.Field
            id="form-input-certificate-address"
            control={Input}
            label="Please enter your certificate address :"
            placeholder={`Certificate Address ${
              context.blockchain
                ? context.blockchain === "eth"
                  ? "on Ethereum"
                  : "on Tron"
                : ""
            }`}
            action={{
              icon: "search",
              content: "Search",
              onClick: this.fetchCertificateDetails
            }}
            value={this.state.certificateCheck.address}
            onChange={event =>
              this.setState({
                certificateCheck: {
                  ...this.state.certificateCheck,
                  address: event.target.value
                }
              })
            }
          />
        </Form>
        {this.state.fetchingCertificateDetails && (
          <Segment>
            <Dimmer active inverted>
              <Loader inverted content="Loading" />
            </Dimmer>
            <Image src="/images/short-paragraph.png" />
          </Segment>
        )}
        {this.state.showCertificateCheckDetails &&
          (this.state.certificateCheck.error === null ? (
            <DisplayCertificateCheck
              details={this.state.certificateCheck}
              web3={web3}
              updateBalance={this.updateBalance}
              balance={this.state.certificateCheck.balance}
              spousesAddresses={[
                this.state.certificateCheck.spousesDetails.firstSpouseDetails.address.toLowerCase(),
                this.state.certificateCheck.spousesDetails.secondSpouseDetails.address.toLowerCase()
              ]}
            />
          ) : (
            <Message
              header="An error occurred"
              content="Please check if the certificate address is correct and retry"
              error
            />
          ))}
      </Container>
    );
  }
}

export default withRouter(withContext(CheckCertificate));
