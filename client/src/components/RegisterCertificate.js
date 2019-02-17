import React, { Component } from "react";
import {
  Container,
  Icon,
  Grid,
  Segment,
  Header,
  Image,
  Divider,
  Modal,
  Message,
  List,
  Loader
} from "semantic-ui-react";
import CryptoJS from "crypto-js";
import { Redirect } from "react-router";
import { Link } from "react-router-dom";
import getWeb3 from "../utils/getWeb3";

import compiledContract from "../utils/contractCreator";
import NewCertificateForm from "../NewCertificateForm/NewCertificateForm";
import DetailsValidation from "../DetailsValidation/DetailsValidation";
import {
  checkIfDetailsAreValid,
  lastMarriageDisplay,
  MIN_SCREEN_WIDTH,
  CERTIFICATE_OBJ
} from "../utils/functions";
import NumberOfMarriages from "./infoComponents/NumberOfMarriages";

import firebase from "firebase/app";
import functions from "firebase/firebase-functions";
import { config } from "../config/firebaseConfig";
firebase.initializeApp(config);

let web3 = null;
let contractCreator;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: false,
      fee: "0",
      certificatesTotal: 0,
      lastMarriage: { 0: "", 1: "", 2: "" },
      userAddress: "",
      certificate: CERTIFICATE_OBJ,
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
      screenWidth: window.innerWidth,
      errorMessage: { open: false, message: "" },
      congratulationModalOpen: false,
      newCertificateTxHash: "",
      idEncodingKey:
        Math.random()
          .toString(36)
          .substring(2, 9) +
        Math.random()
          .toString(36)
          .substring(2, 9),
      redirectAfterRegistration: false,
      loadingMap: true,
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
    const encrypt1 = CryptoJS.AES.encrypt(
      firstSpouseDetails.idNumber.toString(),
      this.state.idEncodingKey.toString()
    ).toString();
    firstSpouseDetails.idNumber = encrypt1;

    const secondSpouseDetails = this.state.spousesDetails.secondSpouseDetails;
    const encrypt2 = CryptoJS.AES.encrypt(
      secondSpouseDetails.idNumber.toString(),
      this.state.idEncodingKey.toString()
    ).toString();
    secondSpouseDetails.idNumber = encrypt2;

    return [
      JSON.stringify({ city: this.state.city, country: this.state.country }),
      JSON.stringify(firstSpouseDetails),
      JSON.stringify(secondSpouseDetails)
    ];
  };

  confirmRegistration = async () => {
    //console.log(this.state.userAddress);
    try {
      if (
        this.state.spousesDetails.firstSpouseDetails.address.toLowerCase() ===
        this.state.spousesDetails.secondSpouseDetails.address.toLowerCase()
      ) {
        throw new Error("same_addresses");
      }
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
                errorMessage: {
                  open: true,
                  message: "An error has occurred, please try again later."
                }
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
          certificate: {
            ...this.state.certificate,
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
      if (error.message === "same_addresses") {
        this.setState({
          errorMessage: {
            open: true,
            message: "Spouses' addresses cannot be the same!"
          },
          confirmationModal: { ...this.state.confirmationModal, open: false }
        });
      }
    }
  };

  updateCityAndCountry = (city, country) => {
    this.setState({ city, country });
  };

  componentDidMount = async () => {
    window.addEventListener("resize", this.handleWindowSizeChange);
    // web3 set up
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
          console.log("Error while fetching details from contract: ", error);
        }
      })
      .catch(err => console.log(err));
    // fetch locations of married couples from firestore
    const fetchLocations = firebase.functions().httpsCallable("fetchLocations");
    try {
      const locations = await fetchLocations();
      console.log(locations.data);
      this.setState({ loadingMap: false });
    } catch (error) {
      console.log(error);
    }
  };

  handleWindowSizeChange = () => {
    this.setState({ screenWidth: window.innerWidth });
  };

  componentWillUnmount = () => {
    clearInterval(this.state.addressChangeListener);
  };

  render() {
    if (this.state.redirectAfterRegistration) {
      return (
        <Redirect
          to={`/check/${this.state.certificate.address.toLowerCase()}`}
        />
      );
    }
    return (
      <Container fluid>
        {this.state.errorMessage.open && (
          <>
            <Container text>
              <Message
                icon="exclamation triangle"
                header="An error has occurred"
                content={this.state.errorMessage.message}
                size="small"
                error
              />
            </Container>
            <br />
          </>
        )}
        <Container textAlign="center">
          {this.state.screenWidth <= MIN_SCREEN_WIDTH && (
            <NumberOfMarriages
              certificatesTotal={this.state.certificatesTotal}
            />
          )}
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
                    updateCityAndCountry={this.updateCityAndCountry}
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
                {this.state.screenWidth >= MIN_SCREEN_WIDTH && (
                  <NumberOfMarriages
                    certificatesTotal={this.state.certificatesTotal}
                  />
                )}
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
                  {this.state.loadingMap ? (
                    <Loader size="small" inline="centered" active>
                      Loading
                    </Loader>
                  ) : (
                    "Map"
                  )}
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
          open={this.state.congratulationModalOpen}
          size="small"
          centered={false}
          onClose={() =>
            this.setState({
              congratulationModalOpen: false,
              redirectAfterRegistration: true
            })
          }
          closeIcon
        >
          <Modal.Header className="modal-header">Congratulations!</Modal.Header>
          <Modal.Content image id="congratulations">
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
                        {this.state.certificate.address.toLowerCase()}
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
                        <Link
                          to={`/certificate/${this.state.certificate.address.toLowerCase()}`}
                        >
                          Save a copy of the certificate!
                        </Link>
                      </List.Description>
                    </List.Content>
                  </List.Item>
                  <List.Item>
                    <List.Icon
                      name="share"
                      size="large"
                      verticalAlign="middle"
                    />
                    <List.Content>
                      <List.Header>Announce your marriage</List.Header>
                      <List.Description style={{ paddingTop: "5px" }}>
                        <iframe
                          title="facebook-share"
                          src="https://www.facebook.com/plugins/share_button.php?href=https%3A%2F%2Fwww.getmarriedontheblockchain.com&layout=button_count&size=small&mobile_iframe=true&width=69&height=20&appId"
                          width="69"
                          height="20"
                          style={{
                            border: "none",
                            overflow: "hidden",
                            marginRight: "20px"
                          }}
                          scrolling="no"
                          frameBorder="0"
                          allowtransparency="true"
                          allow="encrypted-media"
                        />
                        <a
                          className="twitter-share-button"
                          href="https://twitter.com/intent/tweet"
                          text="Get Married on the Blockchain!"
                          url="https://www.getmarriedontheblockchain.com"
                          hashtags="ethereum,blockchain,crypto"
                        >
                          Tweet
                        </a>
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
