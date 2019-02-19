import React from "react";
import { Grid, List, Segment } from "semantic-ui-react";
import moment from "moment";

import SpouseList from "./SpouseList";

import { isMarriageValid } from "../utils/functions";

const DisplayCertificateCheck = props => {
  const { details, web3 } = props;

  // display marriage validity
  const marriageValidity = isMarriageValid(details.isMarriageValid);

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
                {marriageValidity.isValid[0] === true &&
                marriageValidity.isValid[1] === true ? (
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
              {(props.currentUser ===
                details.spousesDetails.firstSpouseDetails.address ||
                props.currentUser ===
                  details.spousesDetails.secondSpouseDetails.address) &&
                web3 && (
                  <>
                    <List.Item>
                      <List.Icon name="calculator" />
                      <List.Content>
                        <List.Header>Account Balance:</List.Header>
                        <List.Description>
                          <List.Item as="ol">
                            <List.Item as="li" value="-">
                              {`Joined Account: ${web3.utils.fromWei(
                                details.balance.joined.toString(),
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
                      </List.Content>
                    </List.Item>
                    <List.Item>
                      <List.Icon name="copy" />
                      <List.Content>
                        <List.Header>Copy of the certificate:</List.Header>
                        <List.Description>
                          <a
                            href={`/certificate/${details.address}`}
                            alt="certificate-link"
                          >
                            Click here to download a copy of your certificate
                          </a>
                        </List.Description>
                      </List.Content>
                    </List.Item>
                  </>
                )}
            </List>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row textAlign="left">
          {Object.keys(details.spousesDetails).map((spouse, index) => (
            <Grid.Column key={spouse}>
              {details.spousesDetails[spouse].address === props.currentUser ? (
                <Segment secondary>
                  <SpouseList
                    details={details}
                    spouse={spouse}
                    index={index}
                    isValid={marriageValidity.isValid}
                    currentUser={true}
                    currentAddress={props.currentUser}
                    updateBalance={props.updateBalance}
                  />
                </Segment>
              ) : (
                <Segment basic>
                  <SpouseList
                    details={details}
                    spouse={spouse}
                    index={index}
                    isValid={marriageValidity.isValid}
                    currentUser={false}
                    currentAddress={props.currentUser}
                    updateBalance={props.updateBalance}
                  />
                </Segment>
              )}
            </Grid.Column>
          ))}
        </Grid.Row>
      </Grid>
    </Segment>
  );
};

export default DisplayCertificateCheck;
