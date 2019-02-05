import React, { Component } from "react";
import {
  Container,
  Menu,
  Icon,
  Grid,
  Segment,
  Header,
  Image,
  Divider
} from "semantic-ui-react";
import "./App.css";
//import Web3 from "web3";
import getWeb3 from "./utils/getWeb3";

import compiledContract from "./utils/contract";
import NewCertificateForm from "./NewCertificateForm/NewCertificateForm";

let web3 = null;
let contract;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: false,
      fee: 0,
      certificatesTotal: 0,
      userAddress: "",
      addressChangeListener: null,
      spousesDetails: {
        firstSpouseDetails: {
          firstName: "",
          lastName: "",
          idNumber: "",
          address: ""
        },
        secondSpouseDetails: {
          firstName: "",
          lastName: "",
          id: "",
          address: ""
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

  componentDidMount = () => {
    // Modern dapp browsers...
    /*if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    // TODO: remove that for production
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);
    // we create the contract
    contract = new web3.eth.Contract(
      compiledContract.abi,
      compiledContract.address
    );
    // we update the state with info
    // fee for registration
    const feeInWei = await contract.methods.certificateFee().call();
    const feeInEther = web3.utils.fromWei(feeInWei, "ether");
    // number of certificates
    const certificatesTotal = await contract.methods.certificateTotal().call();
    // address change listener
    const addressChangeListener = setInterval(this.userAddressChange, 500);
    this.setState({
      isConnected: true,
      fee: feeInEther,
      certificatesTotal,
      addressChangeListener
    });*/
    getWeb3().then(async getWeb3 => {
      web3 = getWeb3;
      // we create the contract
      contract = await new web3.eth.Contract(
        compiledContract.abi,
        compiledContract.address
      );
      // we update the state with info
      // fee for registration
      const feeInWei = await contract.methods.certificateFee().call();
      const feeInEther = web3.utils.fromWei(feeInWei, "ether");
      // number of certificates
      const certificatesTotal = await contract.methods
        .certificateTotal()
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
    if (this.state.isConnected) {
      console.log(this.state);
    }

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
              <Menu.Item link>
                <Icon name="id card outline" className="navbar-icon" />
                Check a certificate
              </Menu.Item>
            </Menu.Menu>
          </Container>
        </Menu>
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
                  <NewCertificateForm userAddress={this.state.userAddress} />
                </Segment>
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
      </Container>
    );
  }
}

export default App;
