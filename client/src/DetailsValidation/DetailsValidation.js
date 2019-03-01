import React, { Component } from "react";
import { Modal, Button, Image, Header, Message, List } from "semantic-ui-react";
import _ from "lodash";

class DetailsValidation extends Component {
  state = {
    modalOpen: false
  };

  confirmRegistration = () => {
    this.props.confirmRegistration();
    this.setState({ modalOpen: false });
  };

  render() {
    return (
      <Modal
        trigger={
          <Button
            className="submit-button"
            onClick={() => this.setState({ modalOpen: true })}
            fluid
          >
            Submit
          </Button>
        }
        size="small"
        centered={false}
        open={this.state.modalOpen}
        onClose={() => this.setState({ modalOpen: false })}
        closeIcon
      >
        <Modal.Header className="modal-header">
          Confirm Certificate Details
        </Modal.Header>
        <Modal.Content image>
          <Image
            wrapped
            size="small"
            src="/images/undraw_love_is_in_the_air_4mmc.svg"
          />
          <Modal.Description style={{ width: "70%" }}>
            <Header as="h4">You are one step away from tying the knot!</Header>
            <Message
              header="Please make sure the following information is correct."
              content="This cannot be modified later!"
              size="tiny"
              warning
            />
            <List size="small" animated>
              <List.Item>
                <List.Icon name="globe" />
                <List.Content>
                  <List.Header>
                    {this.props.city}, {this.props.country}
                  </List.Header>
                </List.Content>
              </List.Item>
              {Object.keys(this.props.spousesDetails)
                .slice(0, 2)
                .map((spouse, index) => (
                  <List.Item key={spouse}>
                    <List.Icon name="user" />
                    <List.Content>
                      <List.Header>{`${_.upperFirst(
                        this.props.spousesDetails[spouse].firstName
                      )} ${_.upperFirst(
                        this.props.spousesDetails[spouse].lastName
                      )}`}</List.Header>
                      <List.Description>Spouse {index + 1}</List.Description>
                      <List.List>
                        <List.Item>
                          <List.Icon name="id card" />
                          <List.Content>{`${_.upperFirst(
                            this.props.spousesDetails[spouse].idType
                          )} Number: ${
                            this.props.spousesDetails[spouse].idNumber
                          }`}</List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Icon name="linkify" />
                          <List.Content>{`Address: ${
                            this.props.spousesDetails[spouse].address
                          }`}</List.Content>
                        </List.Item>
                      </List.List>
                    </List.Content>
                  </List.Item>
                ))}
              <List.Item>
                <List.Icon name="ethereum" />
                <List.Content>
                  <List.Header>
                    {`Certificate Fee: ${parseFloat(
                      this.props.currentFee
                    )} ether`}
                  </List.Header>
                </List.Content>
              </List.Item>
            </List>
            <Button onClick={this.confirmRegistration} fluid>
              Register Marriage Certificate
            </Button>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    );
  }
}

export default DetailsValidation;
