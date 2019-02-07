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
  Input
} from "semantic-ui-react";
import "./App.css";
//import Web3 from "web3";
import getWeb3 from "./utils/getWeb3";

import compiledContract from "./utils/contractCreator";
import NewCertificateForm from "./NewCertificateForm/NewCertificateForm";
import DetailsValidation from "./DetailsValidation/DetailsValidation";
import { checkIfDetailsAreValid, checkCertificate } from "./utils/functions";
import DisplayCertificateCheck from "./DisplayCertificateCheck/DisplayCertificateCheck";

let web3 = null;
let contractCreator;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: false,
      fee: "0",
      certificatesTotal: 0,
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
        address: "0x94FE29395E3F3D8E197B3318053E512D3f5f5fec",
        timestamp: "",
        location: "",
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
    if (
      web3.eth.accounts.currentProvider.selectedAddress !==
      this.state.userAddress
    ) {
      this.setState({
        userAddress: web3.eth.accounts.currentProvider.selectedAddress
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

  formatCertificateDetails = () => [
    JSON.stringify({ city: this.state.city, country: this.state.country }),
    JSON.stringify(this.state.spousesDetails.firstSpouseDetails),
    JSON.stringify(this.state.spousesDetails.secondSpouseDetails)
  ];

  confirmRegistration = async () => {
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
        this.state.spousesDetails.secondSpouseDetails.address,
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
              }
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
          address: newCertificateAddress
        }
      });
    }
  };

  fetchCertificateDetails = async () => {
    const address = this.state.certificateCheck.address;
    const details = await checkCertificate(address, web3);
    console.log(details);
    if (details.return === "OK") {
      this.setState({
        certificateCheck: {
          ...this.state.certificateCheck,
          timestamp: details.timestamp,
          location: JSON.parse(details.location),
          spousesDetails: {
            firstSpouseDetails: JSON.parse(details.spouse1),
            secondSpouseDetails: JSON.parse(details.spouse2)
          },
          isMarriageValid: details.isMarriageValid,
          error: null
        },
        showCertificateCheckDetails: true
      });
    } else {
      this.setState({
        certificateCheck: {
          ...this.state.certificateCheck,
          error: details.error
        },
        showCertificateCheckDetails: true
      });
    }
  };

  componentDidMount = () => {
    getWeb3().then(async getWeb3 => {
      web3 = getWeb3;
      // we create the contract
      contractCreator = await new web3.eth.Contract(
        compiledContract.abi,
        compiledContract.address
      );
      // we update the state with info
      // fee for registration
      const feeInWei = await contractCreator.methods.certificateFee().call();
      const feeInEther = web3.utils.fromWei(feeInWei, "ether");
      // number of certificates
      const certificatesTotal = await contractCreator.methods
        .returnNumberOfContracts()
        .call();
      // address change listener
      const addressChangeListener = setInterval(this.userAddressChange, 500);
      this.setState({
        isConnected: true,
        fee: feeInEther,
        certificatesTotal,
        addressChangeListener
      });
    });
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
              <Menu.Item link>
                <Icon name="gem outline" className="navbar-icon" />
                Get married!
              </Menu.Item>
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
                    There are {this.state.certificatesTotal} registered
                    marriages at the moment.
                  </p>
                </Segment>
                <Segment>
                  <Divider horizontal>
                    <Header as="h4">Last marriage</Header>
                  </Divider>
                  <p>Last marriage details</p>
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
          onClose={() => this.setState({ checkCertificateModalOpen: false })}
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
            {this.state.showCertificateCheckDetails &&
              (this.state.certificateCheck.error === null ? (
                <DisplayCertificateCheck
                  details={this.state.certificateCheck}
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
      </Container>
    );
  }
}

export default App;
