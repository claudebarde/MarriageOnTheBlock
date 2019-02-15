import React, { Component } from "react";
import { Grid, List, Segment } from "semantic-ui-react";
import moment from "moment";

import SpouseList from "./SpouseList";

let web3 = null;

class DisplayCertificateCheck extends Component {
  state = {};

  componentDidMount = () => {
    web3 = this.props.web3;
  };

  render() {
    const details = this.props.details;

    // display marriage validity
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
      <Segment>
        <Grid columns={2} stackable>
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
                  {isValid[0] === true && isValid[1] === true ? (
                    <List.Icon name="check circle" />
                  ) : (
                    <List.Icon name="times circle" />
                  )}
                  <List.Content>
                    <List.Header>Marriage Validity:</List.Header>
                    <List.Description>
                      {marriageValidity.value}
                      <br />({marriageValidity.message})
                    </List.Description>
                  </List.Content>
                </List.Item>
                {(this.props.currentUser ===
                  details.spousesDetails.firstSpouseDetails.address ||
                  this.props.currentUser ===
                    details.spousesDetails.secondSpouseDetails.address) && (
                  <List.Item>
                    <List.Icon name="calculator" />
                    <List.Content>
                      <List.Header>Account Balance:</List.Header>
                      {web3 && (
                        <List.Description>
                          <List.Item as="ol">
                            <List.Item as="li" value="-">
                              {`Joint Account: ${web3.utils.fromWei(
                                details.balance.joint.toString(),
                                "ether"
                              )}  ether`}
                            </List.Item>
                            <List.Item as="li" value="-">
                              {`Savings Account: ${web3.utils.fromWei(
                                details.balance.savings.toString(),
                                "ether"
                              )} ether`}
                            </List.Item>
                            <List.Item as="li" value="-">
                              {`Total Balance: ${web3.utils.fromWei(
                                details.balance.total.toString(),
                                "ether"
                              )} ether`}
                            </List.Item>
                          </List.Item>
                        </List.Description>
                      )}
                    </List.Content>
                  </List.Item>
                )}
              </List>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row textAlign="left">
            {Object.keys(details.spousesDetails).map((spouse, index) => (
              <Grid.Column key={spouse}>
                {details.spousesDetails[spouse].address ===
                this.props.currentUser ? (
                  <Segment secondary>
                    <SpouseList
                      details={details}
                      spouse={spouse}
                      index={index}
                      isValid={isValid}
                      currentUser={true}
                      currentAddress={this.props.currentUser}
                      updateBalance={this.props.updateBalance}
                    />
                  </Segment>
                ) : (
                  <Segment basic>
                    <SpouseList
                      details={details}
                      spouse={spouse}
                      index={index}
                      isValid={isValid}
                      currentUser={false}
                      currentAddress={this.props.currentUser}
                      updateBalance={this.props.updateBalance}
                    />
                  </Segment>
                )}
              </Grid.Column>
            ))}
          </Grid.Row>
        </Grid>
      </Segment>
    );
  }
}

export default DisplayCertificateCheck;
