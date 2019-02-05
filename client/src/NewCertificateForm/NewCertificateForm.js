import React, { Component } from "react";
import { Form, Modal, Message, Button, Dropdown } from "semantic-ui-react";

class NewCertificateForm extends Component {
  state = {
    firstSpouseDetails: {
      firstName: "",
      lastName: "",
      idNumber: "",
      address: ""
    },
    secondSpouseDetails: { firstName: "", lastName: "", id: "", address: "" },
    idNumberInfo: false,
    spouse1InfoModalOpen: false,
    spouse2InfoModalOpen: false,
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

    if (spouse === "firstspouse") {
      const newDetails = { ...this.state.firstSpouseDetails };
      newDetails[infoToUpdate] = val;
      this.setState({ firstSpouseDetails: newDetails });
    } else if (spouse === "secondspouse") {
      const newDetails = { ...this.state.secondSpouseDetails };
      newDetails[infoToUpdate] = val;
      this.setState({ secondSpouseDetails: newDetails });
    }
  };

  // controls submit button state in single form
  submitButtonState = spouse => {
    if (spouse === "firstSpouse") {
      return !Object.keys(this.state.firstSpouseDetails)
        .map(key => this.state.firstSpouseDetails[key].trim().length > 0)
        .reduce((a, b) => a && b);
    } else if (spouse === "secondSpouse") {
      return !Object.keys(this.state.secondSpouseDetails)
        .map(key => this.state.secondSpouseDetails[key].trim().length > 0)
        .reduce((a, b) => a && b);
    }
  };

  submitUserInfo = event => {
    event.preventDefault();
    if (event.target.id === "firstspouse") {
    } else if (event.target.id === "secondspouse") {
    }

    this.setState({ spouse1InfoModalOpen: false, spouse2InfoModalOpen: false });
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
    return (
      <Form style={{ textAlign: "left" }}>
        <Form.Group widths="equal">
          <Form.Input
            fluid
            label="City of registration"
            placeholder="City of registration..."
            icon="home"
            iconPosition="left"
          />
          <Form.Input
            fluid
            label="Country of registration"
            placeholder="Country of registration..."
            icon="globe"
            iconPosition="left"
          />
        </Form.Group>
        {/*FIRST SPOUSE DETAILS MODAL*/}
        <Modal
          trigger={
            <Form.Button
              fluid
              onClick={() => this.setState({ spouse1InfoModalOpen: true })}
            >
              First Spouse Details
            </Form.Button>
          }
          size="tiny"
          open={this.state.spouse1InfoModalOpen}
          onClose={() => this.setState({ spouse1InfoModalOpen: false })}
          closeIcon
        >
          <Modal.Header className="modal-header">
            First Spouse Details
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
                    id="firstspouse-firstName"
                    value={this.state.firstSpouseDetails.firstName}
                    onChange={this.updateSpouseInfo}
                  />
                  <Form.Input
                    fluid
                    label="Spouse Last Name"
                    placeholder="Spouse First Name..."
                    icon="user"
                    iconPosition="left"
                    id="firstspouse-lastName"
                    value={this.state.firstSpouseDetails.lastName}
                    onChange={this.updateSpouseInfo}
                  />
                </Form.Group>
                <Form.Input
                  fluid
                  label="Spouse ID Number"
                  placeholder="Spouse ID Number..."
                  icon="id card"
                  iconPosition="left"
                  id="firstspouse-idNumber"
                  action={
                    <Dropdown
                      button
                      floating
                      options={this.state.idOptions}
                      defaultValue="passport"
                    />
                  }
                  value={this.state.firstSpouseDetails.id}
                  onChange={this.updateSpouseInfo}
                  onFocus={() => this.setState({ idNumberInfo: true })}
                  onBlur={() => this.setState({ idNumberInfo: false })}
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
                  id="firstspouse-address"
                  value={this.state.firstSpouseDetails.address}
                  onChange={this.updateSpouseInfo}
                />
                <Form.Button
                  content="Submit"
                  id="submit-firstspouse"
                  fluid
                  onClick={this.submitUserInfo}
                  disabled={this.submitButtonState("firstSpouse")}
                />
              </Form>
            </Modal.Description>
          </Modal.Content>
        </Modal>
        {/*SECOND SPOUSE DETAILS MODAL*/}
        <Modal
          trigger={
            <Form.Button
              fluid
              onClick={() => this.setState({ spouse2InfoModalOpen: true })}
            >
              Second Spouse Details
            </Form.Button>
          }
          size="tiny"
          open={this.state.spouse2InfoModalOpen}
          onClose={() => this.setState({ spouse2InfoModalOpen: false })}
          closeIcon
        >
          <Modal.Header className="modal-header">
            Second Spouse Details
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
                    id="secondspouse-firstName"
                    value={this.state.secondSpouseDetails.firstName}
                    onChange={this.updateSpouseInfo}
                  />
                  <Form.Input
                    fluid
                    label="Spouse Last Name"
                    placeholder="Spouse First Name..."
                    icon="user"
                    iconPosition="left"
                    id="secondspouse-lastName"
                    value={this.state.secondSpouseDetails.lastName}
                    onChange={this.updateSpouseInfo}
                  />
                </Form.Group>
                <Form.Input
                  fluid
                  label="Spouse ID Number"
                  placeholder="Spouse ID Number..."
                  icon="id card"
                  iconPosition="left"
                  id="secondspouse-idNumber"
                  action={
                    <Dropdown
                      button
                      floating
                      options={this.state.idOptions}
                      defaultValue="passport"
                    />
                  }
                  value={this.state.secondSpouseDetails.id}
                  onChange={this.updateSpouseInfo}
                  onFocus={() => this.setState({ idNumberInfo: true })}
                  onBlur={() => this.setState({ idNumberInfo: false })}
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
                  id="secondspouse-address"
                  value={this.state.secondSpouseDetails.address}
                  onChange={this.updateSpouseInfo}
                />
                <Form.Button
                  content="Submit"
                  id="submit-secondspouse"
                  fluid
                  onClick={this.submitUserInfo}
                  disabled={this.submitButtonState("secondSpouse")}
                />
              </Form>
            </Modal.Description>
          </Modal.Content>
        </Modal>
        <Button className="submit-button" fluid>
          Submit
        </Button>
      </Form>
    );
  }
}

export default NewCertificateForm;
