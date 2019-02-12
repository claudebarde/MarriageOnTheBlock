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

import DisplayCertificateCheck from "../DisplayCertificateCheck/DisplayCertificateCheck";
import {
  MIN_SCREEN_WIDTH,
  CERTIFICATE_OBJ,
  checkCertificate
} from "../utils/functions";
import getWeb3 from "../utils/getWeb3";
let web3 = null;

let subscribedEvents = {};

class CheckCertificate extends Component {
  state = {
    minScreenWidth: MIN_SCREEN_WIDTH,
    certificateCheck: CERTIFICATE_OBJ,
    lastMarriage: { 0: "", 1: "", 2: "" },
    fetchingCertificateDetails: false
  };

  // updates user address in case of change
  userAddressChange = () => {
    const currentAddress = web3.eth.accounts.currentProvider.selectedAddress;
    if (currentAddress && currentAddress !== this.state.userAddress) {
      this.setState({
        userAddress: web3.eth.accounts.currentProvider.selectedAddress.toLowerCase()
      });
    }
  };

  fetchCertificateDetails = async () => {
    this.setState({ fetchingCertificateDetails: true });
    const address = this.state.certificateCheck.address;
    const certificate = await checkCertificate(address, web3);
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
      this.subscribeLogEvent(certificate.instance, "MarriageValidity");
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
        (error, result) => {
          if (!error) {
            const eventObj = web3.eth.abi.decodeLog(
              eventJsonInterface.inputs,
              result.data,
              result.topics.slice(1)
            );
            console.log(`New ${eventName}!`, eventObj);
            // we update the state with new contract state
            if (eventName === "MarriageValidity") {
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

  updateBalance = (txType, newTxAmount) => {
    let newBalance = parseInt(this.state.certificateCheck.balance);
    if (txType === "deposit") {
      newBalance = newBalance + parseInt(newTxAmount);
    } else if (txType === "withdrawal") {
      newBalance = newBalance - parseInt(newTxAmount);
    }
    this.setState({
      certificateCheck: {
        ...this.state.certificateCheck,
        balance: newBalance
      }
    });
  };

  componentDidMount = () => {
    // listens to window resizing
    window.addEventListener("resize", this.handleWindowSizeChange);
    // creates instance of contract
    getWeb3()
      .then(async getWeb3 => {
        web3 = getWeb3;
        try {
          await web3.eth.net.isListening();
          console.log("web3 started!");
          // address change listener
          const addressChangeListener = setInterval(
            this.userAddressChange,
            500
          );
          this.setState({
            isConnected: true,
            addressChangeListener
          });
          // fetch contract details if address is provided
          if (this.props.match.params.address) {
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
      })
      .catch(err => console.log(err));
  };

  componentWillUnmount = () => {
    clearInterval(this.state.addressChangeListener);
  };

  render() {
    return (
      <Container>
        <Form>
          <Form.Field
            id="form-input-certificate-address"
            control={Input}
            label="Please enter your certificate address :"
            placeholder="Certificate Address"
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
              currentUser={this.state.userAddress}
              web3={web3}
              updateBalance={this.updateBalance}
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

export default CheckCertificate;