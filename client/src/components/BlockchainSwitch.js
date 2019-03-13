import React, { Component } from "react";
import { withRouter } from "react-router-dom";

import firebase from "firebase/app";
import "firebase/firebase-functions";
import "firebase/auth";
import { config } from "../config/firebaseConfig";

import { GlobalStateProvider, NETWORK } from "../config/config";

import getWeb3 from "../utils/getWeb3";
let web3 = null;

firebase.initializeApp(config);

class BlockchainSwitch extends Component {
  state = {
    network: NETWORK,
    addressChangeListener: null,
    userAddress: null,
    userCertificate: null,
    currentCertificate: null,
    loggedInUser: false,
    screenWidth: 0,
    gasForTx: 1000000,
    signOutUser: () => {
      firebase.auth().signOut();
      this.setState({
        userCertificate: null,
        currentCertificate: null
      });
    }
  };

  // updates user address in case of change
  userAddressChange = () => {
    if (web3.eth.accounts.currentProvider.selectedAddress) {
      const currentAddress = web3.eth.accounts.currentProvider.selectedAddress.toLowerCase();
      if (currentAddress && currentAddress !== this.state.userAddress) {
        this.setState({
          userAddress: currentAddress
        });
      }
    }
  };

  handleWindowSizeChange = () => {
    this.setState({ screenWidth: window.innerWidth });
  };

  componentDidMount = async () => {
    // checks window size
    window.addEventListener("resize", this.handleWindowSizeChange);
    // we fire the function linked to the event once to save screen width
    this.handleWindowSizeChange();
    // loads web3
    web3 = await getWeb3();
    await web3.eth.net.isListening();
    // address change listener
    const addressChangeListener = setInterval(this.userAddressChange, 500);
    this.setState({ addressChangeListener });

    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        this.setState({
          loggedInUser: user.uid
        });
        // if user exists, we fetch their certificate address
        const fetchUserCertificate = firebase
          .functions()
          .httpsCallable("fetchUserCertificate");
        const idToken = await firebase.auth().currentUser.getIdToken(true);
        const userCertificate = await fetchUserCertificate(idToken);
        if (userCertificate.data) {
          this.setState({ userCertificate: userCertificate.data });
        }
      } else {
        this.setState({
          loggedInUser: false
        });
      }
    });
  };

  componentWillUnmount = () => {
    clearInterval(this.state.addressChangeListener);
  };

  render() {
    return (
      <GlobalStateProvider value={{ ...this.state }}>
        {this.props.children}
      </GlobalStateProvider>
    );
  }
}

export default withRouter(BlockchainSwitch);
