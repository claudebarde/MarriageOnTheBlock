import React, { Component } from "react";
import {
  Form,
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
        const { email, password, certificateAddress, secretKey } = this.state;
        let { currentUserAddress } = this.props;

        if (
          certificateAddress &&
          currentUserAddress &&
          email &&
          password &&
          secretKey
        ) {
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
              secretKey
            });
            // sign in user id everything is ok
            if (authResult.data.status === "OK") {
              try {
                // we sign in the new user
                await firebase
                  .auth()
                  .signInWithEmailAndPassword(email, password);
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
              if (authResult.data.message) {
                this.setState({
                  authLoading: false,
                  authError: {
                    open: true,
                    message: authResult.data.message.errorInfo.message
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
            this.setState({
              authLoading: false,
              authError: {
                open: true,
                message: error
              }
            });
          }
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
          this.props.origin === "register-page" ? (
            <Button color="orange">Create a New Account</Button>
          ) : (
            <Dropdown.Item as="a">
              <Icon name="user plus" className="navbar-icon" />
              Create Account
            </Dropdown.Item>
          )
        }
        size="small"
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
          {!window.web3 && (
            <Message
              header="No web3 provided detected"
              content="You must use a web3 provider like Metamask to use this website."
              warning
            />
          )}
          <Form>
            <Form.Field required>
              <label>Your Email Address:</label>
              <Input
                type="email"
                icon="at"
                iconPosition="left"
                placeholder="Email"
                onChange={event => this.setState({ email: event.target.value })}
                value={this.state.email}
                fluid
              />
            </Form.Field>
            <Form.Field required>
              <label>Your Password:</label>
              <Input
                type="text"
                icon="lock"
                iconPosition="left"
                placeholder="Password"
                onChange={event =>
                  this.setState({ password: event.target.value })
                }
                value={this.state.password}
                fluid
              />
            </Form.Field>
            <Message
              icon="hand point right"
              header="Please note"
              content="The certificate address and secret key are only required if you wish to link a newly created account to an existing certificate. If you created the account before the marriage certificate, the two will be automatically linked together."
              size="tiny"
              info
            />
            <Form.Field>
              <label>Your Certificate Address:</label>
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
            </Form.Field>
            <Form.Field>
              <label>Your Secret Key:</label>
              <Input
                type="text"
                icon="key"
                iconPosition="left"
                placeholder="Secret Key"
                onChange={event =>
                  this.setState({ secretKey: event.target.value })
                }
                value={this.state.secretKey}
                fluid
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button
            loading={this.state.authLoading}
            onClick={this.authenticateUser}
            disabled={!window.web3}
          >
            Sign Up
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default UserAuth;
