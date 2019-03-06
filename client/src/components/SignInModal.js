import React, { Component } from "react";
import {
  Modal,
  Dropdown,
  Icon,
  Input,
  Message,
  Button
} from "semantic-ui-react";

import firebase from "firebase/app";
import "firebase/auth";

class SignInModal extends Component {
  state = {
    authError: { open: false, message: "" },
    authLoading: false,
    email: "",
    password: ""
  };

  signInUser = () => {
    const { email, password } = this.state;
    this.setState({ authLoading: true }, async () => {
      try {
        const signedIn = await firebase
          .auth()
          .signInWithEmailAndPassword(email, password);
        if (!signedIn.user) throw new Error("Error during sign in process!");
      } catch (error) {
        this.setState({
          ...this.state,
          authLoading: false,
          authError: {
            open: true,
            message: "You couldn't be signed in, please try again later."
          }
        });
      }
    });
  };

  render() {
    return (
      <Modal
        trigger={
          <Dropdown.Item as="a">
            <Icon name="sign-in" className="navbar-icon" />
            Sign In
          </Dropdown.Item>
        }
        size="mini"
        closeIcon
      >
        <Modal.Header className="modal-header">
          Sign In to your Account
        </Modal.Header>
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
            autoFocus
          />
          <br />
          <Input
            type="password"
            icon="lock"
            iconPosition="left"
            placeholder="Password"
            onChange={event =>
              this.setState({
                password: event.target.value
              })
            }
            value={this.state.password}
            fluid
          />
        </Modal.Content>
        <Modal.Actions>
          <Button loading={this.state.authLoading} onClick={this.signInUser}>
            Sign In
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default SignInModal;
