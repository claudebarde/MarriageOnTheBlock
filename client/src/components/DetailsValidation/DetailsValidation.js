import React, { Component } from "react";
import {
  Modal,
  Button,
  Image,
  Header,
  Message,
  List,
  Segment
} from "semantic-ui-react";
import _ from "lodash";

const countries = require("country-data").countries;

class DetailsValidation extends Component {
  state = {
    modalOpen: false
  };

  confirmRegistration = () => {
    this.props.confirmRegistration();
    this.setState({ modalOpen: false });
  };

  render() {
    const {
      city,
      country,
      spousesDetails,
      currentFee,
      userHasCertificate,
      userAddress
    } = this.props;
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
                    {city}, {countries[country.toUpperCase()].name}
                  </List.Header>
                </List.Content>
              </List.Item>
              {Object.keys(spousesDetails)
                .slice(0, 2)
                .map((spouse, index) => (
                  <List.Item key={spouse}>
                    <List.Icon name="user" />
                    <List.Content>
                      <List.Header>{`${_.upperFirst(
                        spousesDetails[spouse].firstName
                      )} ${_.upperFirst(
                        spousesDetails[spouse].lastName
                      )}`}</List.Header>
                      <List.Description>Spouse {index + 1}</List.Description>
                      <List.List>
                        <List.Item>
                          <List.Icon name="id card" />
                          <List.Content>{`${_.upperFirst(
                            spousesDetails[spouse].idType
                          )} Number: ${
                            spousesDetails[spouse].idNumber
                          }`}</List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Icon name="linkify" />
                          <List.Content>{`Address: ${
                            spousesDetails[spouse].address
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
                    {`Certificate Fee: ${parseFloat(currentFee)} ether`}
                  </List.Header>
                </List.Content>
              </List.Item>
            </List>
            {userHasCertificate ? (
              <Segment inverted tertiary color="red" textAlign="center">
                You already have a marriage certificate!
              </Segment>
            ) : ![
                spousesDetails.firstSpouseDetails.address.toLowerCase(),
                spousesDetails.secondSpouseDetails.address.toLowerCase()
              ].includes(userAddress.toLowerCase()) ? (
              <Segment inverted tertiary color="red" textAlign="center">
                The address to create the new certificate must be one of the two
                spouses registering the marriage certificate.
              </Segment>
            ) : (
              <>
                <Segment size="mini" basic>
                  By clicking the button below, you understand that the
                  information you entered and your subsequent transactions will
                  be visible on the blockchain (except for the ID number which
                  is encrypted) and that we may save them to enhance your
                  experience on this website.
                </Segment>
                <Button onClick={this.confirmRegistration} fluid>
                  Register Marriage Certificate
                </Button>
              </>
            )}
          </Modal.Description>
        </Modal.Content>
      </Modal>
    );
  }
}

export default DetailsValidation;
