import React, { Component } from "react";
import { Grid, List, Segment } from "semantic-ui-react";
import _ from "lodash";
import moment from "moment";

const newCertificateAbi = require("../contracts/MarriageCertificate.json").abi;
let web3 = null;
let certificate;

class DisplayCertificateCheck extends Component {
  constructor(props) {
    super(props);
    web3 = this.props.web3;
  }

  approveMarriage = async () => {
    await certificate.methods
      .validateMarriage()
      .send(
        { from: this.props.currentUser, gas: "300000" },
        (error, txHash) => {
          if (error) {
            console.log("error", error);
          } else {
            console.log(txHash);
          }
        }
      );
  };

  petitionForDivorce = async () => {
    await certificate.methods
      .divorce()
      .send(
        { from: this.props.currentUser, gas: "300000" },
        (error, txHash) => {
          if (error) {
            console.log("error", error);
          }
          return;
        }
      );
  };

  spouseList = (details, spouse, index, isValid, currentUser) => (
    <List size="small" style={{ wordBreak: "break-all" }}>
      <List.Item>
        <List.Icon name="user" />
        <List.Content>
          <List.Header>{`${_.upperFirst(
            details.spousesDetails[spouse].firstName
          )} ${_.upperFirst(
            details.spousesDetails[spouse].lastName
          )}`}</List.Header>
          <List.Description>
            {index === 0 ? "Certificate Creator" : "Second Spouse"}
          </List.Description>
          <List.List>
            <List.Item>
              <List.Icon name="id card" />
              <List.Content>{`${_.upperFirst(
                details.spousesDetails[spouse].idType
              )} Number: ${
                details.spousesDetails[spouse].idNumber
              }`}</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="linkify" />
              <List.Content>{`Address: ${
                details.spousesDetails[spouse].address
              }`}</List.Content>
            </List.Item>
          </List.List>
        </List.Content>
      </List.Item>
      {currentUser && (
        <List.Item>
          <List.Icon name="edit" />
          <List.Content>
            <List.Header>Edit the marriage status</List.Header>
            <List.Description>
              Choose one of the actions below:
            </List.Description>
            <List.List>
              {isValid[index] ? (
                <List.Item onClick={this.petitionForDivorce}>
                  <List.Icon name="thumbs down" />
                  <List.Content>
                    <List.Header as="a">Petition for divorce</List.Header>
                    <List.Description as="a">
                      This will update your status in the marriage contract.
                    </List.Description>
                  </List.Content>
                </List.Item>
              ) : (
                <List.Item onClick={this.approveMarriage}>
                  <List.Icon name="thumbs up" />
                  <List.Content>
                    <List.Header as="a">Approve marriage</List.Header>
                    <List.Description as="a">
                      This will update your status in the marriage contract.
                    </List.Description>
                  </List.Content>
                </List.Item>
              )}
            </List.List>
          </List.Content>
        </List.Item>
      )}
    </List>
  );

  componentDidMount = async () => {
    // creates contract instance
    try {
      certificate = await new web3.eth.Contract(
        newCertificateAbi,
        this.props.details.address
      );
    } catch (error) {
      console.log(error);
    }
  };

  render() {
    const details = this.props.details;

    let marriageValidity = { value: 0, message: "error" };
    const isValid = Object.keys(details.isMarriageValid).map(
      key => details.isMarriageValid[key]
    );
    switch (true) {
      case isValid[0] === true && isValid[1] === false:
        marriageValidity = {
          value: "Not Valid",
          message: "Second spouse did not approve or disapproved the marriage"
        };
        break;
      case isValid[0] === true && isValid[1] === true:
        marriageValidity = {
          value: "Valid",
          message: "The marriage has been approved by both spouses"
        };
        break;
      case isValid[0] === false && isValid[1] === true:
        marriageValidity = {
          value: "Not Valid",
          message: "First spouse disapproved the marriage"
        };
        break;
      case isValid[0] === false && isValid[1] === false:
        marriageValidity = {
          value: "Not Valid",
          message: "The spouses have divorced"
        };
        break;
      default:
        break;
    }

    return (
      <Grid columns={2} style={{ marginTop: "30px" }}>
        <Grid.Row textAlign="left">
          <Grid.Column width={16}>
            <List size="small">
              <List.Item>
                <List.Icon name="globe" />
                <List.Content>
                  <List.Header>Place of registration:</List.Header>
                  <List.Description>
                    {details.location.city}, {details.location.country}
                  </List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Icon name="calendar alternate" />
                <List.Content>
                  <List.Header>Date of registration:</List.Header>
                  <List.Description>
                    {moment
                      .unix(details.timestamp)
                      .format("dddd, MMMM Do YYYY, h:mm:ss a")}
                  </List.Description>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Icon name="calendar alternate" />
                <List.Content>
                  <List.Header>Marriage Validity:</List.Header>
                  <List.Description>
                    {marriageValidity.value}
                    <br />({marriageValidity.message})
                  </List.Description>
                </List.Content>
              </List.Item>
            </List>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row textAlign="left">
          {Object.keys(details.spousesDetails).map((spouse, index) => (
            <Grid.Column key={spouse}>
              {details.spousesDetails[spouse].address ===
              this.props.currentUser ? (
                <Segment secondary>
                  {this.spouseList(details, spouse, index, isValid, true)}
                </Segment>
              ) : (
                <Segment basic>
                  {this.spouseList(details, spouse, index, isValid, false)}
                </Segment>
              )}
            </Grid.Column>
          ))}
        </Grid.Row>
      </Grid>
    );
  }
}

export default DisplayCertificateCheck;
