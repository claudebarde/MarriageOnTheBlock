import React, { Component } from "react";
import {
  Form,
  Message,
  Input,
  Dimmer,
  Loader,
  Segment,
  Image,
  Container,
  Grid
} from "semantic-ui-react";
import moment from "moment";
import { withRouter } from "react-router-dom";

import SpouseInfoComponent from "../Account/SpouseInfoComponent";
import { checkCertificate } from "../../utils/functions";
import {
  MIN_SCREEN_WIDTH,
  CERTIFICATE_OBJ,
  withContext
} from "../../config/config";
import getWeb3 from "../../utils/getWeb3";
let web3 = null;

class CheckCertificate extends Component {
  state = {
    minScreenWidth: MIN_SCREEN_WIDTH,
    certificateCheck: CERTIFICATE_OBJ,
    fetchingCertificateDetails: false,
    showCertificateCheckDetails: false
  };

  fetchCertificateDetails = async address => {
    this.setState({
      fetchingCertificateDetails: true,
      showCertificateCheckDetails: false
    });
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
          this.props.match.params.address.toLowerCase() !==
            address.toLowerCase()
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
    }
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
          async () =>
            await this.fetchCertificateDetails(
              this.state.certificateCheck.address
            )
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
    const certificate = this.state.certificateCheck;
    return (
      <Container>
        <Form>
          <Form.Field
            id="form-input-certificate-address"
            control={Input}
            label="Please enter your certificate address :"
            placeholder="Certificate Address on Ethereum"
            action={{
              icon: "search",
              content: "Search",
              onClick: this.fetchCertificateDetails
            }}
            value={certificate.address}
            onChange={event =>
              this.setState({
                certificateCheck: {
                  ...certificate,
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
          (certificate.error === null ? (
            <Segment secondary>
              <Grid columns={2} stackable>
                <Grid.Row>
                  <Grid.Column width={8}>
                    <Message
                      icon="globe"
                      header="Place of registration"
                      content={`${certificate.location.city}, ${
                        certificate.location.country
                      }`}
                    />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <Message
                      icon="calendar alternate"
                      header="Date of registration"
                      content={moment
                        .unix(certificate.timestamp)
                        .format("dddd, MMMM Do YYYY, h:mm:ss a")}
                    />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column width={8}>
                    <SpouseInfoComponent
                      spouse={certificate.spousesDetails.firstSpouseDetails}
                      approved={certificate.isMarriageValid[0]}
                    />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <SpouseInfoComponent
                      spouse={certificate.spousesDetails.secondSpouseDetails}
                      approved={certificate.isMarriageValid[1]}
                    />
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Segment>
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
