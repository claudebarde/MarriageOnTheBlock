import React, { Component } from "react";
import {
  Segment,
  Modal,
  Input,
  Button,
  Message,
  Dropdown,
  Icon
} from "semantic-ui-react";

import firebase from "firebase/app";
import "firebase/firebase-functions";

class UserAuth extends Component {
  state = {
    email: "",
    password: "",
    secretKey: "",
    certificateAddress: "",
    authLoading: false,
    authError: { open: false, message: "" }
  };

  authenticateUser = () => {
    this.setState(
      { authLoading: true, authError: { open: false, message: "" } },
      async () => {
        const { email, password, certificateAddress } = this.state;
        let { currentUserAddress } = this.props;

        const firebaseAuth = firebase
          .functions()
          .httpsCallable("authenticateUser");
        try {
          // we check if user is already linked to this certificate
          const authResult = await firebaseAuth({
            certificateAddress,
            currentUserAddress,
            email,
            password,
            secretKey: this.state.secretKey
          });
          // sign in user id everything is ok
          if (authResult.data.status === "OK") {
            try {
              // we sign in the new user
              await firebase.auth().signInWithEmailAndPassword(email, password);
            } catch (error) {
              this.setState({
                authLoading: false,
                authError: {
                  open: true,
                  message: `${error.code}: ${error.message}`
                }
              });
            }
          } else {
            if (authResult.data.errorInfo) {
              this.setState({
                authLoading: false,
                authError: {
                  open: true,
                  message: authResult.data.errorInfo.message
                }
              });
            } else {
              this.setState({
                authLoading: false,
                authError: { open: true, message: authResult.data.status }
              });
            }
          }
        } catch (error) {
          console.log(error);
          this.setState({ authLoading: false });
        }
      }
    );
  };

  componentDidMount = () =>
    this.setState({ certificateAddress: this.props.certificateAddress });

  componentDidUpdate = prevProps => {
    if (prevProps.certificateAddress !== this.props.certificateAddress)
      this.setState({ certificateAddress: this.props.certificateAddress });
  };

  render() {
    return (
      <Modal
        trigger={
          this.props.origin === "check-page" ? (
            <Segment
              as="a"
              style={{
                fontWeight: "bold",
                fontStyle: "italic",
                paddingLeft: "0px"
              }}
              basic
            >
              Create a new account to see and save transactions details
            </Segment>
          ) : (
            <Dropdown.Item as="a">
              <Icon name="user plus" className="navbar-icon" />
              Create Account
            </Dropdown.Item>
          )
        }
        size="mini"
        closeIcon
      >
        <Modal.Header className="modal-header">Create an Account</Modal.Header>
        <Modal.Content>
          {this.state.authError.open && (
            <Message
              header="An error has occurred"
              content={this.state.authError.message}
              error
            />
          )}
          <Input
            type="email"
            icon="at"
            iconPosition="left"
            placeholder="Email"
            onChange={event => this.setState({ email: event.target.value })}
            value={this.state.email}
            fluid
          />
          <br />
          <Input
            type="text"
            icon="lock"
            iconPosition="left"
            placeholder="Password"
            onChange={event => this.setState({ password: event.target.value })}
            value={this.state.password}
            fluid
          />
          <br />
          <Input
            type="text"
            icon="certificate"
            iconPosition="left"
            placeholder="Marriage Certificate Address"
            onChange={event =>
              this.setState({
                certificateAddress: event.target.value
              })
            }
            value={this.state.certificateAddress}
            fluid
          />
          <br />
          <Input
            type="text"
            icon="key"
            iconPosition="left"
            placeholder="Secret Key"
            onChange={event => this.setState({ secretKey: event.target.value })}
            value={this.state.secretKey}
            fluid
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            loading={this.state.authLoading}
            onClick={this.authenticateUser}
          >
            Sign Up
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default UserAuth;
