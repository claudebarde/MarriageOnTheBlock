import React, { Component } from "react";
import {
  Form,
  Modal,
  Message,
  Button,
  Dropdown,
  Segment,
  Grid,
  Input,
  Header,
  List
} from "semantic-ui-react";
import _ from "lodash";

import { checkIfDetailsAreValid } from "../utils/functions";

class NewCertificateForm extends Component {
  state = {
    city: "",
    country: "",
    firstSpouseDetails: {
      firstName: "",
      lastName: "",
      idNumber: "",
      idType: "passport",
      address: ""
    },
    secondSpouseDetails: {
      firstName: "",
      lastName: "",
      idNumber: "",
      idType: "passport",
      address: ""
    },
    idNumberInfo: false,
    firstSpouseInfoModalOpen: false,
    secondSpouseInfoModalOpen: false,
    idOptions: [
      { key: "passport", text: "Passport", value: "passport" },
      { key: "id", text: "ID", value: "id" }
    ]
  };

  updateSpouseInfo = event => {
    // we fetch the id value to know which spouse to update
    const spouse = event.target.id.split("-")[0];
    const infoToUpdate = event.target.id.split("-")[1];
    const val = event.target.value;

    if (spouse === "firstSpouse") {
      const newDetails = { ...this.state.firstSpouseDetails };
      newDetails[infoToUpdate] = val;
      this.setState({ firstSpouseDetails: newDetails });
    } else if (spouse === "secondSpouse") {
      const newDetails = { ...this.state.secondSpouseDetails };
      newDetails[infoToUpdate] = val;
      this.setState({ secondSpouseDetails: newDetails });
    }
  };

  updateIdType = (event, { id, value }) => {
    if (id === "firstSpouse-idType") {
      this.setState({
        firstSpouseDetails: { ...this.state.firstSpouseDetails, idType: value }
      });
    } else if (id === "secondSpouse-idType") {
      this.setState({
        secondSpouseDetails: {
          ...this.state.secondSpouseDetails,
          idType: value
        }
      });
    }
  };

  submitUserInfo = event => {
    if (event.target.id === "submit-firstSpouse") {
      this.props.updateSpouseDetails(
        "firstSpouse",
        this.state.city,
        this.state.country,
        this.state.firstSpouseDetails
      );
    } else if (event.target.id === "submit-secondSpouse") {
      this.props.updateSpouseDetails(
        "secondSpouse",
        this.state.city,
        this.state.country,
        this.state.secondSpouseDetails
      );
    }

    this.setState({
      firstSpouseInfoModalOpen: false,
      secondSpouseInfoModalOpen: false,
      idNumberInfo: false
    });
  };

  componentDidUpdate() {
    if (
      this.props.userAddress !== this.state.firstSpouseDetails.address &&
      this.state.firstSpouseDetails.address.length === 0
    ) {
      this.setState({
        firstSpouseDetails: {
          ...this.state.firstSpouseDetails,
          address: this.props.userAddress
        }
      });
    }
  }

  render() {
    const spousesDetails = this.props.spousesDetails;

    return (
      <Grid columns={2}>
        <Grid.Row textAlign="left">
          <Grid.Column>
            <Header as="h5">City of registration</Header>
            <Input
              fluid
              placeholder="City of registration..."
              icon="home"
              iconPosition="left"
              value={this.state.city}
              onChange={event => this.setState({ city: event.target.value })}
            />
          </Grid.Column>
          <Grid.Column>
            <Header as="h5">Country of registration</Header>
            <Input
              fluid
              placeholder="Country of registration..."
              icon="globe"
              iconPosition="left"
              value={this.state.country}
              onChange={event => this.setState({ country: event.target.value })}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          {["firstSpouse", "secondSpouse"].map(spouse => (
            <Grid.Column key={spouse}>
              <Modal
                trigger={
                  <Button
                    fluid
                    onClick={() =>
                      this.setState({ [`${spouse}InfoModalOpen`]: true })
                    }
                  >
                    {spouse === "firstSpouse"
                      ? "First Spouse Details"
                      : "Second Spouse Details"}
                  </Button>
                }
                size="tiny"
                open={this.state[`${spouse}InfoModalOpen`]}
                onClose={() =>
                  this.setState({
                    [`${spouse}InfoModalOpen`]: false,
                    idNumberInfo: false
                  })
                }
                centered={false}
                closeIcon
              >
                <Modal.Header className="modal-header">
                  {spouse === "firstSpouse"
                    ? "First Spouse Details"
                    : "Second Spouse Details"}
                </Modal.Header>
                <Modal.Content>
                  <Modal.Description>
                    <Message
                      warning
                      size="tiny"
                      header="Please enter the following information with care!"
                      content="Once confirmed and saved on the blockchain, this information cannot be modified!"
                    />
                    <Form>
                      <Form.Group widths="equal">
                        <Form.Input
                          type="text"
                          fluid
                          label="Spouse First Name"
                          placeholder="Spouse First Name..."
                          icon="user"
                          iconPosition="left"
                          id={`${spouse}-firstName`}
                          value={this.state[`${spouse}Details`].firstName}
                          onChange={this.updateSpouseInfo}
                        />
                        <Form.Input
                          fluid
                          label="Spouse Last Name"
                          placeholder="Spouse First Name..."
                          icon="user"
                          iconPosition="left"
                          id={`${spouse}-lastName`}
                          value={this.state[`${spouse}Details`].lastName}
                          onChange={this.updateSpouseInfo}
                        />
                      </Form.Group>
                      <Form.Input
                        fluid
                        label="Spouse ID Number"
                        placeholder="Spouse ID Number..."
                        icon="id card"
                        iconPosition="left"
                        id={`${spouse}-idNumber`}
                        action={
                          <Dropdown
                            button
                            floating
                            options={this.state.idOptions}
                            defaultValue="passport"
                            id={`${spouse}-idType`}
                            onChange={this.updateIdType}
                          />
                        }
                        value={this.state[`${spouse}Details`].idNumber}
                        onChange={this.updateSpouseInfo}
                        onFocus={() => this.setState({ idNumberInfo: true })}
                      />
                      {this.state.idNumberInfo && (
                        <Message
                          info
                          size="mini"
                          content="The ID number will be encrypted before being saved on the blockchain."
                        />
                      )}
                      <Form.Input
                        fluid
                        label="Spouse Account Address"
                        placeholder="Spouse Account Address..."
                        icon="address book"
                        iconPosition="left"
                        id={`${spouse}-address`}
                        value={this.state[`${spouse}Details`].address}
                        onChange={this.updateSpouseInfo}
                      />
                      <Button
                        content="Submit"
                        id={`submit-${spouse}`}
                        fluid
                        onClick={this.submitUserInfo}
                        disabled={
                          !checkIfDetailsAreValid(
                            this.state[`${spouse}Details`]
                          )
                        }
                      />
                    </Form>
                  </Modal.Description>
                </Modal.Content>
              </Modal>
              {checkIfDetailsAreValid(spousesDetails[`${spouse}Details`]) && (
                <Segment
                  size="mini"
                  textAlign="left"
                  style={{ wordBreak: "break-all" }}
                  basic
                >
                  <List>
                    <List.Item
                      icon="user"
                      content={`${_.upperFirst(
                        spousesDetails[`${spouse}Details`].firstName
                      )} ${_.upperFirst(
                        spousesDetails[`${spouse}Details`].lastName
                      )}`}
                    />
                    <List.Item
                      icon="id card"
                      content={`${_.upperFirst(
                        spousesDetails[`${spouse}Details`].idType
                      )} # ${spousesDetails[`${spouse}Details`].idNumber}`}
                    />
                    <List.Item
                      icon="linkify"
                      content={`
            Address: ${spousesDetails[`${spouse}Details`].address}`}
                    />
                  </List>
                </Segment>
              )}
            </Grid.Column>
          ))}
        </Grid.Row>
      </Grid>
      /*<Form style={{ textAlign: "left" }}>
        <Form.Group widths="equal">
          <Form.Input
            fluid
            label="City of registration"
            placeholder="City of registration..."
            icon="home"
            iconPosition="left"
            value={this.state.city}
            onChange={event => this.setState({ city: event.target.value })}
          />
          <Form.Input
            fluid
            label="Country of registration"
            placeholder="Country of registration..."
            icon="globe"
            iconPosition="left"
            value={this.state.country}
            onChange={event => this.setState({ country: event.target.value })}
          />
        </Form.Group>
        {["firstSpouse", "secondSpouse"].map(spouse => (
          <React.Fragment key={spouse}>
            <Modal
              trigger={
                <Form.Button
                  fluid
                  onClick={() =>
                    this.setState({ [`${spouse}InfoModalOpen`]: true })
                  }
                >
                  {spouse === "firstSpouse"
                    ? "First Spouse Details"
                    : "Second Spouse Details"}
                </Form.Button>
              }
              size="tiny"
              open={this.state[`${spouse}InfoModalOpen`]}
              onClose={() =>
                this.setState({
                  [`${spouse}InfoModalOpen`]: false,
                  idNumberInfo: false
                })
              }
              closeIcon
            >
              <Modal.Header className="modal-header">
                {spouse === "firstSpouse"
                  ? "First Spouse Details"
                  : "Second Spouse Details"}
              </Modal.Header>
              <Modal.Content>
                <Modal.Description>
                  <Message
                    warning
                    size="tiny"
                    header="Please enter the following information with care!"
                    content="Once confirmed and saved on the blockchain, this information cannot be modified!"
                  />
                  <Form>
                    <Form.Group widths="equal">
                      <Form.Input
                        type="text"
                        fluid
                        label="Spouse First Name"
                        placeholder="Spouse First Name..."
                        icon="user"
                        iconPosition="left"
                        id={`${spouse}-firstName`}
                        value={this.state[`${spouse}Details`].firstName}
                        onChange={this.updateSpouseInfo}
                      />
                      <Form.Input
                        fluid
                        label="Spouse Last Name"
                        placeholder="Spouse First Name..."
                        icon="user"
                        iconPosition="left"
                        id={`${spouse}-lastName`}
                        value={this.state[`${spouse}Details`].lastName}
                        onChange={this.updateSpouseInfo}
                      />
                    </Form.Group>
                    <Form.Input
                      fluid
                      label="Spouse ID Number"
                      placeholder="Spouse ID Number..."
                      icon="id card"
                      iconPosition="left"
                      id={`${spouse}-idNumber`}
                      action={
                        <Dropdown
                          button
                          floating
                          options={this.state.idOptions}
                          defaultValue="passport"
                          id={`${spouse}-idType`}
                          onChange={this.updateIdType}
                        />
                      }
                      value={this.state[`${spouse}Details`].idNumber}
                      onChange={this.updateSpouseInfo}
                      onFocus={() => this.setState({ idNumberInfo: true })}
                    />
                    {this.state.idNumberInfo && (
                      <Message
                        info
                        size="mini"
                        content="The ID number will be encrypted before being saved on the blockchain."
                      />
                    )}
                    <Form.Input
                      fluid
                      label="Spouse Account Address"
                      placeholder="Spouse Account Address..."
                      icon="address book"
                      iconPosition="left"
                      id={`${spouse}-address`}
                      value={this.state[`${spouse}Details`].address}
                      onChange={this.updateSpouseInfo}
                    />
                    <Button
                      content="Submit"
                      id={`submit-${spouse}`}
                      fluid
                      onClick={this.submitUserInfo}
                      disabled={this.submitButtonState(spouse)}
                    />
                  </Form>
                </Modal.Description>
              </Modal.Content>
            </Modal>
            {!this.checkIfDetailsAreValid(
              spousesDetails[`${spouse}Details`]
            ) && (
              <Segment
                size="mini"
                textAlign="center"
                style={{ wordWrap: "break-word" }}
                basic
              >
                {`${_.upperFirst(
                  spousesDetails[`${spouse}Details`].firstName
                )} ${_.upperFirst(
                  spousesDetails[`${spouse}Details`].lastName
                )}`}
                <br />
                {`${_.upperFirst(
                  spousesDetails[`${spouse}Details`].idType
                )} # ${spousesDetails[`${spouse}Details`].idNumber}`}
                <br />
                {`
            Address: ${spousesDetails[`${spouse}Details`].address}`}
              </Segment>
            )}
          </React.Fragment>
        ))}
        <Button className="submit-button" fluid>
          Submit
        </Button>
                </Form>*/
    );
  }
}

export default NewCertificateForm;
