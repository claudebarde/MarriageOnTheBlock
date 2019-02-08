import React, { Component } from "react";
import {
  Container,
  Menu,
  Icon,
  Grid,
  Segment,
  Header,
  Image,
  Divider,
  Modal,
  Message,
  Form,
  Input,
  Dimmer,
  Loader,
  List
} from "semantic-ui-react";
import CryptoJS from "crypto-js";
import "./App.css";
//import Web3 from "web3";
import getWeb3 from "./utils/getWeb3";

import compiledContract from "./utils/contractCreator";
import NewCertificateForm from "./NewCertificateForm/NewCertificateForm";
import DetailsValidation from "./DetailsValidation/DetailsValidation";
import {
  checkIfDetailsAreValid,
  checkCertificate,
  lastMarriageDisplay
} from "./utils/functions";
import DisplayCertificateCheck from "./DisplayCertificateCheck/DisplayCertificateCheck";

let web3 = null;
let contractCreator,
  subscribedEvents = {};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: false,
      fee: "0",
      certificatesTotal: 0,
      lastMarriage: { 0: "", 1: "", 2: "" },
      userAddress: "",
      addressChangeListener: null,
      confirmationModal: {
        open: false,
        header: (
          <Icon.Group size="big">
            <Icon loading size="big" name="circle notch" />
            <Icon name="edit" size="small" />
          </Icon.Group>
        ),
        headerMessage: "Certificate Pending...",
        message:
          "Please  wait while your marriage certificate is being confirmed on the blockchain..."
      },
      checkCertificateModal: { open: false },
      certificateCheck: {
        address: "0xEA45Ce0d2Cd49ee96F816F47b29261D54De2F73F",
        timestamp: "",
        location: "",
        isMarriageValid: {},
        spousesDetails: {
          firstSpouseDetails: {
            firstName: "",
            lastName: "",
            idNumber: "",
            idType: "",
            address: ""
          },
          secondSpouseDetails: {
            firstName: "",
            lastName: "",
            idNumber: "",
            idType: "",
            address: ""
          }
        },
        error: null
      },
      errorMessage: false,
      showCertificateCheckDetails: false,
      fetchingCertificateDetails: false,
      congratulationModalOpen: true,
      newCertificateTxHash: "",
      idEncodingKey:
        Math.random()
          .toString(36)
          .substring(2, 9) +
        Math.random()
          .toString(36)
          .substring(2, 9),
      /*city: "",
      country: "",
      spousesDetails: {
        firstSpouseDetails: {
          firstName: "",
          lastName: "",
          idNumber: "",
          idType: "",
          address: ""
        },
        secondSpouseDetails: {
          firstName: "",
          lastName: "",
          idNumber: "",
          idType: "",
          address: ""
        }
      }*/
      city: "Kuala Lumpur",
      country: "Malaysia",
      spousesDetails: {
        firstSpouseDetails: {
          firstName: "claude",
          lastName: "barde",
          idNumber: "555",
          idType: "passport",
          address: "0x0fc3d599c0cc8c8741f9c56170887a39bb9e1745"
        },
        secondSpouseDetails: {
          firstName: "Amira",
          lastName: "Kawi",
          idNumber: "6667",
          idType: "id",
          address: "0x0b324d7f2Da52A8F88Cf13e45205C2D6591A8DC1"
        }
      }
    };
  }

  // updates user address in case of change
  userAddressChange = () => {
    const currentAddress = web3.eth.accounts.currentProvider.selectedAddress;
    if (currentAddress && currentAddress !== this.state.userAddress) {
      this.setState({
        userAddress: web3.eth.accounts.currentProvider.selectedAddress.toLowerCase()
      });
    }
  };

  updateSpouseDetails = (
    spouse,
    city,
    country,
    { firstName, lastName, idNumber, idType, address }
  ) => {
    if (spouse === "firstSpouse") {
      this.setState({
        spousesDetails: {
          ...this.state.spousesDetails,
          city,
          country,
          firstSpouseDetails: {
            firstName,
            lastName,
            idNumber,
            idType,
            address
          }
        }
      });
    } else if (spouse === "secondSpouse") {
      this.setState({
        spousesDetails: {
          ...this.state.spousesDetails,
          city,
          country,
          secondSpouseDetails: {
            firstName,
            lastName,
            idNumber,
            idType,
            address
          }
        }
      });
    }
  };

  formatCertificateDetails = () => {
    const firstSpouseDetails = this.state.spousesDetails.firstSpouseDetails;
    //  we encrypt the id number with sha256 and the random key
    let hash = CryptoJS.SHA256(
      firstSpouseDetails.idNumber.toString() +
        this.state.idEncodingKey.toString()
    ).toString();
    firstSpouseDetails.idNumber = hash;

    const secondSpouseDetails = this.state.spousesDetails.secondSpouseDetails;
    hash = CryptoJS.SHA256(
      this.state.randomKey + secondSpouseDetails.idNumber
    ).toString();
    secondSpouseDetails.idNumber = hash;

    return [
      JSON.stringify({ city: this.state.city, country: this.state.country }),
      JSON.stringify(firstSpouseDetails),
      JSON.stringify(secondSpouseDetails)
    ];
  };

  confirmRegistration = async () => {
    console.log(this.formatCertificateDetails());
    try {
      // modal displayed while the new certificate is created
      this.setState({
        confirmationModal: { ...this.state.confirmationModal, open: true }
      });
      // creating the new certificate
      const fcd = this.formatCertificateDetails();
      const newCertificateTx = await contractCreator.methods
        .createNewCertificate(
          fcd[1],
          fcd[2],
          this.state.spousesDetails.secondSpouseDetails.address.toLowerCase(),
          fcd[0]
        )
        .send(
          {
            from: this.state.userAddress,
            gas: "5000000",
            value: web3.utils.toWei(this.state.fee)
          },
          (error, txHash) => {
            if (error) {
              this.setState({
                confirmationModal: {
                  ...this.state.confirmationModal,
                  open: false
                },
                errorMessage: true
              });
            } else {
              this.setState({
                confirmationModal: {
                  ...this.state.confirmationModal,
                  open: false
                },
                newCertificateTxHash: txHash
              });
            }
          }
        );
      // listening to event newCertificateCreated to get contract address
      const newCertificateAddress =
        newCertificateTx.events.NewCertificateCreated.returnValues
          .newCertificateAddress;
      console.log(newCertificateAddress);

      if (newCertificateAddress) {
        this.setState({
          certificateCheck: {
            ...this.state.certificateCheck,
            address: newCertificateAddress.toLowerCase()
          },
          lastMarriage: {
            0: fcd[1],
            1: fcd[2],
            2: fcd[0]
          },
          certificatesTotal: parseInt(this.state.certificatesTotal) + 1,
          congratulationModalOpen: true
        });
      }
    } catch (error) {
      console.log(error);
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
            if (
              eventName === "MarriageValidity" ||
              eventName === "DivorcePetition"
            ) {
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
          error: null
        },
        showCertificateCheckDetails: true,
        fetchingCertificateDetails: false
      });
      // subscription to events
      this.subscribeLogEvent(certificate.instance, "MarriageValidity");
      this.subscribeLogEvent(certificate.instance, "DivorcePetition");
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

  componentDidMount = () => {
    getWeb3()
      .then(async getWeb3 => {
        web3 = getWeb3;
        try {
          await web3.eth.net.isListening();
          console.log("web3 started!");
          // we create the contract
          contractCreator = await new web3.eth.Contract(
            compiledContract.abi,
            compiledContract.address
          );
          // we update the state with info
          // fee for registration
          const feeInWei = await contractCreator.methods
            .certificateFee()
            .call();
          const feeInEther = web3.utils.fromWei(feeInWei, "ether");
          // number of certificates
          const certificatesTotal = await contractCreator.methods
            .returnNumberOfContracts()
            .call();
          // last marriage
          const lastMarriage = await contractCreator.methods
            .getLastMarriage()
            .call();
          // address change listener
          const addressChangeListener = setInterval(
            this.userAddressChange,
            500
          );
          this.setState({
            isConnected: true,
            fee: feeInEther,
            certificatesTotal,
            lastMarriage,
            addressChangeListener
          });
        } catch (error) {
          console.log("Error while instantiating web3: ", error);
        }
      })
      .catch(err => console.log(err));
  };

  componentWillUnmount = () => {
    clearInterval(this.state.addressChangeListener);
  };

  render() {
    return (
      <Container fluid>
        <Menu size="massive" borderless>
          <Container>
            <Menu.Item className="title">
              Get Married On The Blockchain!
            </Menu.Item>
            <Menu.Item>
              <Image src="/images/undraw_wedding_t1yl.svg" size="small" />
            </Menu.Item>

            <Menu.Menu position="right">
              <Menu.Item
                link
                onClick={() =>
                  this.setState({ checkCertificateModalOpen: true })
                }
              >
                <Icon name="id card outline" className="navbar-icon" />
                Check a certificate
              </Menu.Item>
            </Menu.Menu>
          </Container>
        </Menu>
        {this.state.errorMessage && (
          <>
            <Container text>
              <Message
                icon="exclamation triangle"
                header="An error has occurred"
                content="Please try again later."
                size="small"
                error
              />
            </Container>
            <br />
          </>
        )}
        <Container textAlign="center">
          <Grid columns={2} stackable>
            <Grid.Row stretched>
              <Grid.Column>
                <Segment>
                  <Divider horizontal>
                    <Header as="h4">Register a new marriage</Header>
                  </Divider>
                  <Segment secondary basic>
                    Fill in the form to register a new marriage.
                  </Segment>
                  <NewCertificateForm
                    userAddress={this.state.userAddress}
                    updateSpouseDetails={this.updateSpouseDetails}
                    spousesDetails={this.state.spousesDetails}
                  />
                </Segment>
                {checkIfDetailsAreValid(
                  this.state.spousesDetails.firstSpouseDetails
                ) &&
                  checkIfDetailsAreValid(
                    this.state.spousesDetails.secondSpouseDetails
                  ) && (
                    <DetailsValidation
                      spousesDetails={this.state.spousesDetails}
                      city={this.state.city}
                      country={this.state.country}
                      currentFee={this.state.fee}
                      gasToUse={this.state.gasToUse}
                      confirmRegistration={this.confirmRegistration}
                    />
                  )}
              </Grid.Column>
              <Grid.Column>
                <Segment>
                  <Divider horizontal>
                    <Header as="h4">Number of registered marriages</Header>
                  </Divider>
                  <p>
                    {this.state.certificatesTotal > 1
                      ? `There are ${this.state.certificatesTotal} registered
                    marriages around the world.`
                      : `There is ${this.state.certificatesTotal} registered
                    marriage around the world.`}
                  </p>
                </Segment>
                <Segment>
                  <Divider horizontal>
                    <Header as="h4">Last marriage</Header>
                  </Divider>
                  {checkIfDetailsAreValid(this.state.lastMarriage) ? (
                    <p>{lastMarriageDisplay(this.state.lastMarriage)}</p>
                  ) : (
                    <p>No marriage to show.</p>
                  )}
                </Segment>
                <Segment>
                  <Divider horizontal>
                    <Header as="h4">Exchange</Header>
                  </Divider>
                  <p>Exchange Bitcoin for Ethereum</p>
                </Segment>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row stretched>
              <Grid.Column width={16}>
                <Segment>
                  <Divider horizontal>
                    <Header as="h4">Map of married couples</Header>
                  </Divider>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
        <Modal open={this.state.confirmationModal.open} basic size="small">
          <Header>
            {this.state.confirmationModal.header}
            {this.state.confirmationModal.headerMessage}
          </Header>
          <Modal.Content>
            <p>{this.state.confirmationModal.message}</p>
          </Modal.Content>
        </Modal>
        <Modal
          open={this.state.checkCertificateModalOpen}
          size="small"
          centered={false}
          onClose={() =>
            this.setState({
              checkCertificateModalOpen: false,
              showCertificateCheckDetails: false
            })
          }
          closeIcon
        >
          <Modal.Header className="modal-header">
            Check a marriage certificate
          </Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Field
                id="form-input-certificate-address"
                control={Input}
                label="Please enter certificate address :"
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
                />
              ) : (
                <Message
                  header="An error occurred"
                  content="Please check if the certificate address is correct and retry"
                  error
                />
              ))}
          </Modal.Content>
        </Modal>
        <Modal
          open={this.state.congratulationModalOpen}
          size="small"
          centered={false}
          onClose={() => this.setState({ congratulationModalOpen: false })}
          closeIcon
        >
          <Modal.Header className="modal-header">Congratulations!</Modal.Header>
          <Modal.Content image>
            <Image wrapped size="small" src="/images/undraw_wedding_t1yl.svg" />
            <Modal.Description>
              <Header as="h3">
                You are now officially married on the Ethereum blockchain!
              </Header>
              <Segment basic style={{ wordBreak: "break-word" }}>
                <List divided relaxed="very">
                  <List.Item>
                    <List.Icon
                      name="linkify"
                      size="large"
                      verticalAlign="middle"
                    />
                    <List.Content>
                      <List.Header>
                        {this.state.newCertificateTxHash}
                      </List.Header>
                      <List.Description>
                        This is the transaction number you can look up here.
                      </List.Description>
                    </List.Content>
                  </List.Item>
                  <List.Item>
                    <List.Icon
                      name="file alternate outline"
                      size="large"
                      verticalAlign="middle"
                    />
                    <List.Content>
                      <List.Header>
                        {this.state.certificateCheck.address.toLowerCase()}
                      </List.Header>
                      <List.Description>
                        Please keep the certificate address in a safe place as
                        you cannot access your certificate without it.
                      </List.Description>
                    </List.Content>
                  </List.Item>
                  <List.Item>
                    <List.Icon name="key" size="large" verticalAlign="middle" />
                    <List.Content>
                      <List.Header>{this.state.idEncodingKey}</List.Header>
                      <List.Description>
                        Your secret key allows to read your encrypted ID number
                        from the blockchain.
                      </List.Description>
                    </List.Content>
                  </List.Item>
                  <List.Item>
                    <List.Icon
                      name="file pdf outline"
                      size="large"
                      verticalAlign="middle"
                    />
                    <List.Content>
                      <List.Header>Copy of the certificate</List.Header>
                      <List.Description>
                        Download a PDF copy of the certificate
                      </List.Description>
                    </List.Content>
                  </List.Item>
                </List>
              </Segment>
            </Modal.Description>
          </Modal.Content>
        </Modal>
      </Container>
    );
  }
}

export default App;
