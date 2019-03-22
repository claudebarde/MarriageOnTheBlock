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
  Dimmer,
  Loader,
  Button
} from "semantic-ui-react";
import CryptoJS from "crypto-js";
import { Link } from "react-router-dom";
import getWeb3 from "../utils/getWeb3";

import compiledContract from "../utils/contractCreator";
import NewCertificateForm from "./NewCertificateForm/NewCertificateForm";
import DetailsValidation from "./DetailsValidation/DetailsValidation";
import {
  checkIfDetailsAreValid,
  lastMarriageDisplay
} from "../utils/functions";
import {
  MIN_SCREEN_WIDTH,
  CERTIFICATE_OBJ,
  withContext
} from "../config/config";
import NumberOfMarriages from "./infoComponents/NumberOfMarriages";
import MarriagesGraph from "./infoComponents/MarriagesGraph";
import { TransactionModal, transactionModalData } from "./TransactionModal";
import UserAuth from "../utils/UserAuth";
import { estimateTxTime } from "../utils/functions";

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firebase-functions";

let web3 = undefined;
let contractCreator;
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: false,
      fee: "0",
      certificatesTotal: 0,
      lastMarriage: { 0: "", 1: "", 2: "" },
      certificate: CERTIFICATE_OBJ,
      transactionModal: {
        open: false,
        icon: "spinner",
        loading: true,
        header: "Waiting for confirmation...",
        txHash: null,
        message: (
          <div>
            <p>
              Your transaction is being confirmed on the blockchain, please
              wait.
            </p>
            <p>Do not refresh or close the page.</p>
          </div>
        ),
        estimateTime: null
      },
      screenWidth: window.innerWidth,
      headerMessage: {
        open: true,
        header: "Please wait...",
        content: "Fetching marriages data",
        icon: "circle notched",
        iconLoading: true,
        info: true,
        error: false
      },
      congratulationModalOpen: false,
      newCertificateTxHash: "",
      idEncodingKey:
        Math.random()
          .toString(36)
          .substring(2, 9) +
        Math.random()
          .toString(36)
          .substring(2, 9),
      loadingGraph: true,
      city: "",
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
      },
      chartOptions: null,
      disclaimerModal: { open: false }
    };
  }

  closeTxModal = (status, txHash) => {
    if (status === true) {
      this.setState({
        transactionModal: transactionModalData("confirmed", txHash)
      });
      setTimeout(
        () =>
          this.setState({
            transactionModal: transactionModalData("pending", txHash)
          }),
        3000
      );
    } else {
      this.setState({
        transactionModal: transactionModalData("error", txHash)
      });
    }
  };

  handleWindowSizeChange = () => {
    this.setState({ screenWidth: window.innerWidth });
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
      JSON.stringify({
        city: this.state.city,
        country: this.state.country.toUpperCase()
      }),
      JSON.stringify(firstSpouseDetails),
      JSON.stringify(secondSpouseDetails)
    ];
  };

  confirmRegistration = async () => {
    const {
      firstSpouseDetails,
      secondSpouseDetails
    } = this.state.spousesDetails;
    const userAddress = this.props.context.userAddress;
    try {
      if (
        firstSpouseDetails.address.toLowerCase() ===
        secondSpouseDetails.address.toLowerCase()
      )
        throw new Error("same_addresses");

      if (
        userAddress.toLowerCase() !==
          firstSpouseDetails.address.toLowerCase() &&
        userAddress.toLowerCase() !== secondSpouseDetails.address.toLowerCase()
      )
        throw new Error("non_spouse");
      // creating the new certificate
      const fcd = this.formatCertificateDetails();
      let newCertificateTxHash;
      const estimateTime = await estimateTxTime();

      await contractCreator.methods
        .createNewCertificate(
          fcd[1],
          fcd[2],
          this.state.spousesDetails.secondSpouseDetails.address,
          fcd[0]
        )
        .send({
          from: userAddress,
          gas: this.props.context.gasForTx * 5,
          value: web3.utils.toWei(this.state.fee)
        })
        .on("transactionHash", txHash => {
          newCertificateTxHash = txHash;
          console.log("Tx hash: ", txHash);
          // the state is updated
          this.setState({
            transactionModal: {
              ...this.state.transactionModal,
              open: true,
              txHash,
              estimateTime
            }
          });
        })
        .on("receipt", async receipt => {
          // listening to event newCertificateCreated to get contract address
          const newCertificateAddress =
            receipt.events.LogNewCertificateCreated.returnValues
              .newCertificateAddress;
          console.log("New certificate address: ", newCertificateAddress);

          if (newCertificateAddress) {
            this.closeTxModal(receipt.status, receipt.transactionHash);
            // registers new address for redirection to account page
            this.props.context.registerCertificateAddress(
              newCertificateAddress
            );
            //we update here the state of the app
            this.setState({
              certificate: {
                ...this.state.certificate,
                address: newCertificateAddress
              },
              lastMarriage: {
                0: fcd[1],
                1: fcd[2],
                2: fcd[0]
              },
              certificatesTotal: parseInt(this.state.certificatesTotal) + 1,
              congratulationModalOpen: true,
              newCertificateTxHash: receipt.transactionHash
            });
            // we create a new user in database who can udpdate tx history later
            try {
              // we save some of the info from the certificate in the firestore
              const saveNewCertificate = firebase
                .functions()
                .httpsCallable("saveNewCertificate");
              // if the user is logged in, we will link the certificate to their account
              let idToken = 0;
              if (firebase.auth().currentUser)
                idToken = await firebase.auth().currentUser.getIdToken(true);
              // we save the new certificate
              const saveNewCtf = await saveNewCertificate({
                idToken,
                address: newCertificateAddress,
                location: {
                  city: this.state.city,
                  country: this.state.country.toLowerCase()
                },
                firstSpouse: {
                  firstName: this.state.spousesDetails.firstSpouseDetails
                    .firstName,
                  lastName: this.state.spousesDetails.firstSpouseDetails
                    .lastName,
                  address: this.state.spousesDetails.firstSpouseDetails.address
                },
                secondSpouse: {
                  firstName: this.state.spousesDetails.secondSpouseDetails
                    .firstName,
                  lastName: this.state.spousesDetails.secondSpouseDetails
                    .lastName,
                  address: this.state.spousesDetails.secondSpouseDetails.address
                },
                timestamp: Date.now(),
                key: this.state.idEncodingKey.toString()
              });
              if (saveNewCtf.data.status !== "OK") {
                console.log("Error while saving to the database: ", saveNewCtf);
              }
            } catch (error) {
              console.log(error.code, error.message);
            }
            // we update the firestore with the country of registration
            const saveLocation = firebase
              .functions()
              .httpsCallable("saveLocation");
            // we receive the new data
            const savedLocations = await saveLocation({
              text: this.state.country.toLowerCase()
            });
            // we update the pie chart
            this.setState({ chartOptions: savedLocations.data });
          } else {
            this.closeTxModal("error", newCertificateTxHash);
          }
        })
        .on("error", error => {
          console.log(error);
          this.closeTxModal("error", newCertificateTxHash);
        });
    } catch (error) {
      console.log(error);
      this.closeTxModal("error", 0);
      if (error.message === "same_addresses") {
        this.setState({
          headerMessage: {
            open: true,
            header: "An error has occurred",
            content: "Spouses' addresses cannot be the same!",
            icon: "exclamation triangle",
            iconLoading: false,
            info: false,
            error: true
          }
        });
      }
    }
  };

  updateCityAndCountry = (city, country) => {
    this.setState({ city, country });
  };

  componentDidMount = async () => {
    window.addEventListener("resize", this.handleWindowSizeChange);
    try {
      // web3 set up
      web3 = await getWeb3();
      await web3.eth.net.isListening();
      console.log("web3 started!");
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
      // last marriage
      const lastMarriage = await contractCreator.methods
        .getLastMarriage()
        .call();
      this.setState({
        isConnected: true,
        fee: feeInEther,
        certificatesTotal,
        lastMarriage,
        headerMessage: {
          ...this.state.headerMessage,
          open: false,
          iconLoading: false
        }
      });
    } catch (error) {
      console.log(error);
      this.setState({
        headerMessage: {
          ...this.state.headerMessage,
          iconLoading: false,
          open: false
        }
      });
    }
  };

  componentWillUnmount = () => {
    clearInterval(this.state.addressChangeListener);
  };

  render() {
    if (web3 === null)
      return (
        <Container text>
          <Message
            icon="exclamation triangle"
            header="No web3 detected!"
            content="You must use Metamask, Mist or a similar application to connect to the blockchain"
            error
          />
        </Container>
      );

    const { context } = this.props;
    return (
      <Container fluid>
        {this.state.headerMessage.open && (
          <>
            <Container text>
              <Message
                size="small"
                info={this.state.headerMessage.info}
                error={this.state.headerMessage.error}
                icon
              >
                <Icon
                  name={this.state.headerMessage.icon}
                  loading={this.state.headerMessage.iconLoading}
                />
                <Message.Content>
                  <Message.Header>
                    {this.state.headerMessage.header}
                  </Message.Header>
                  {this.state.headerMessage.content}
                </Message.Content>
              </Message>
            </Container>
            <br />
          </>
        )}
        <Container textAlign="center">
          {this.state.headerMessage.iconLoading ? (
            <Segment>
              <Dimmer active inverted>
                <Loader inverted content="Loading" />
              </Dimmer>
              <Image src="/images/short-paragraph.png" />
            </Segment>
          ) : (
            <Grid columns={2} stackable>
              <Grid.Row stretched>
                {this.state.screenWidth < MIN_SCREEN_WIDTH && (
                  <Grid.Column>
                    <NumberOfMarriages
                      certificatesTotal={this.state.certificatesTotal}
                    />
                  </Grid.Column>
                )}

                <Grid.Column>
                  {!this.state.headerMessage.open ? (
                    <>
                      <Segment>
                        <Divider horizontal>
                          <Header as="h4">Register a new marriage</Header>
                        </Divider>
                        {context.loggedInUser ? (
                          <>
                            <Segment secondary basic>
                              Fill in the form to register a new marriage.
                            </Segment>
                            <NewCertificateForm
                              userAddress={context.userAddress}
                              updateCityAndCountry={this.updateCityAndCountry}
                              updateSpouseDetails={this.updateSpouseDetails}
                              spousesDetails={this.state.spousesDetails}
                              isAddress={web3.utils.isAddress}
                            />
                          </>
                        ) : (
                          <Segment basic padded>
                            <Header as="h4">
                              Here are a few benefits of having an off-chain
                              account:
                            </Header>
                            <List style={{ textAlign: "left" }} bulleted>
                              <List.Item>
                                Saving transactions details off-chain saves you
                                gas when sending transactions to the
                                certificate.
                              </List.Item>
                              <List.Item>
                                Only you and your partner have access to
                                transactions history and control panel.
                              </List.Item>
                              <List.Item>
                                You can easily retrieve you marriage certificate
                                number if you lose it.
                              </List.Item>
                              <List.Item>
                                Your secret key is safely saved in case you need
                                it later.
                              </List.Item>
                              <List.Item>
                                Withdrawal request receipt numbers will appear
                                in transactions history for easy access.
                              </List.Item>
                            </List>
                            <DisclaimerModal
                              open={this.state.disclaimerModal.open}
                              openDisclaimer={() =>
                                this.setState({
                                  disclaimerModal: {
                                    ...this.state.disclaimerModal,
                                    open: true
                                  }
                                })
                              }
                              closeDisclaimer={() =>
                                this.setState({
                                  disclaimerModal: {
                                    ...this.state.disclaimerModal,
                                    open: false
                                  }
                                })
                              }
                              currentUserAddress={context.userAddress}
                            />
                          </Segment>
                        )}
                      </Segment>
                      {checkIfDetailsAreValid(
                        this.state.spousesDetails.firstSpouseDetails
                      ) &&
                        checkIfDetailsAreValid(
                          this.state.spousesDetails.secondSpouseDetails
                        ) &&
                        context.loggedInUser && (
                          <DetailsValidation
                            spousesDetails={this.state.spousesDetails}
                            city={this.state.city}
                            country={this.state.country}
                            currentFee={this.state.fee}
                            gasToUse={this.state.gasToUse}
                            confirmRegistration={this.confirmRegistration}
                            userHasCertificate={!!context.userCertificate}
                            userAddress={context.userAddress}
                          />
                        )}
                    </>
                  ) : (
                    <MarriagesGraph
                      firebase={firebase}
                      screenWidth={this.state.screenWidth}
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
                    <Modal
                      trigger={
                        <Button color="green">
                          Exchange Bitcoin for Ethereum
                        </Button>
                      }
                      size="small"
                      closeIcon
                    >
                      <Modal.Header>Exchange with Changelly</Modal.Header>
                      <Modal.Content>
                        <Header as="h1">
                          Exchange your Bitcoin for Ethereum to validate your
                          marriage certificate
                        </Header>
                        <Header as="h3">
                          or exchange other cryptocurrencies{" "}
                          <a
                            href="https://old.changelly.com/?ref_id=vab5l967wagye3m2"
                            alt="changelly"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            on this page
                          </a>
                          .
                        </Header>
                        <iframe
                          src="https://old.changelly.com/widget/v1?auth=email&from=BTC&to=ETH&merchant_id=vab5l967wagye3m2&address=&amount=1&ref_id=vab5l967wagye3m2&color=00cf70"
                          title="changelly"
                          width="600"
                          height="450"
                          className="changelly"
                          scrolling="no"
                          style={{ overflowY: "hidden", border: "none" }}
                        >
                          {" "}
                          Can't load widget{" "}
                        </iframe>
                      </Modal.Content>
                    </Modal>
                  </Segment>
                </Grid.Column>
              </Grid.Row>
              {!this.state.headerMessage.open && (
                <Grid.Row stretched>
                  <Grid.Column width={16}>
                    <MarriagesGraph
                      firebase={firebase}
                      screenWidth={this.state.screenWidth}
                      chartOptions={this.state.chartOptions}
                    />
                  </Grid.Column>
                </Grid.Row>
              )}
            </Grid>
          )}
        </Container>
        <TransactionModal {...this.state.transactionModal} />

        <Modal
          open={this.state.congratulationModalOpen}
          size="small"
          onClose={() =>
            this.setState({
              congratulationModalOpen: false
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
                        This is the transaction number you can look up{" "}
                        <a
                          href={
                            context.network === "main"
                              ? `https://etherscan.io/tx/${
                                  this.state.newCertificateTxHash
                                }`
                              : `https://${context.network}.etherscan.io/tx/${
                                  this.state.newCertificateTxHash
                                }`
                          }
                          alt="certificate-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          here
                        </a>
                        .
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
                        {this.state.certificate.address}
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
                      name="id card"
                      size="large"
                      verticalAlign="middle"
                    />
                    <List.Content>
                      <List.Header>Certificate Control Panel</List.Header>
                      <List.Description>
                        <Link to="/account">
                          Access you certificate control panel
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
                          href="https://twitter.com/share?ref_src=twsrc%5Etfw"
                          className="twitter-share-button"
                          data-text="I got married on the blockchain!"
                          data-url={`https://www.marriageontheblock.com/certificate/${
                            this.state.certificate.address
                          }`}
                          data-show-count="false"
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

const DisclaimerModal = props => (
  <Modal
    open={props.open}
    trigger={
      <Button fluid onClick={props.openDisclaimer}>
        I want to get married!
      </Button>
    }
  >
    <Modal.Header className="modal-header">
      Disclaimer of Liabilities and Warranties
    </Modal.Header>
    <Modal.Content>
      <Modal.Description>
        <Header as="h2">Legal Warning</Header>
        <p>
          By creating an account on marriageontheblock.com, you agree to the
          following:
        </p>
        <List bulleted>
          <List.Item>
            You expressly know and agree that you are using the Ethereum
            platform at your sole risk.
          </List.Item>
          <List.Item>
            You acknowledge that you have an adequate understanding of the
            risks, usage and intricacies of cryptographic tokens and
            blockchain-based open source software, ethereum platform and
            ethereum.
          </List.Item>
          <List.Item>
            You acknowledge and agree that, to the fullest extent permitted by
            any applicable law, the disclaimers of liability contained herein
            apply to any and all damages or injury whatsoever caused by or
            related to risks of, use of, or inability to use, Ethereum or the
            Ethereum platform under any cause or action whatsoever of any kind
            in any jurisdiction, including, without limitation, actions for
            breach of warranty, breach of contract or tort (including
            negligence) and that the present website shall not be liable for any
            indirect, incidental, special, exemplary or consequential damages,
            including for loss of profits, goodwill or data that occurs as a
            result.
          </List.Item>
        </List>
      </Modal.Description>
    </Modal.Content>
    <Modal.Actions>
      <Button onClick={props.closeDisclaimer} primary>
        I changed my mind!
      </Button>
      <UserAuth
        origin="register-page"
        currentUserAddress={props.currentUserAddress}
      />
    </Modal.Actions>
  </Modal>
);

export default withContext(App);
