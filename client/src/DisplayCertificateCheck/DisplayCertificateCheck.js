import React from "react";
import { Grid, List, Segment } from "semantic-ui-react";
import moment from "moment";

import SpouseList from "./SpouseList";
import TransactionsHistory from "./TransactionsHistory";

import { isMarriageValid } from "../utils/functions";
import { GlobalStateConsumer } from "../config/config";

const DisplayCertificateCheck = props => {
  const { details, web3, balance } = props;

  // display marriage validity
  const marriageValidity = isMarriageValid(details.isMarriageValid);

  return (
    <GlobalStateConsumer>
      {context => (
        <Segment>
          <Grid columns={3} widths="equal" stackable>
            <Grid.Row textAlign="left">
              <Grid.Column>
                <List size="small" relaxed>
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
                              <List
                                style={{ marginLeft: "10px", marginTop: "5px" }}
                                size="small"
                                horizontal
                                relaxed
                              >
                                <List.Item>
                                  <List.Header>Joined</List.Header>
                                  <List.Content>{`${web3.utils.fromWei(
                                    details.balance.joined.toString(),
                                    "ether"
                                  )}  eth`}</List.Content>
                                </List.Item>
                                <List.Item>
                                  <List.Header>Savings</List.Header>
                                  <List.Content>{`${web3.utils.fromWei(
                                    details.balance.savings.toString(),
                                    "ether"
                                  )}  eth`}</List.Content>
                                </List.Item>
                                <List.Item>
                                  <List.Header>Total</List.Header>
                                  <List.Content>{`${web3.utils.fromWei(
                                    details.balance.total.toString(),
                                    "ether"
                                  )}  eth`}</List.Content>
                                </List.Item>
                              </List>
                            </List.Description>
                          </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Icon name="history" />
                          <List.Content>
                            <List.Header>Transactions History:</List.Header>
                            <List.Description>
                              <TransactionsHistory
                                spousesAddresses={props.spousesAddresses}
                                web3={props.web3}
                                creationTimestamp={details.timestamp}
                                certificateAddress={details.address}
                              />
                            </List.Description>
                          </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Icon name="linkify" />
                          <List.Content>
                            <List.Header>Certificate link:</List.Header>
                            <List.Description>
                              <a
                                href={`https://${
                                  context.network
                                }.etherscan.io/address/${details.address}`}
                                alt="certificate-link"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                See your certificate on Etherscan.io
                              </a>
                            </List.Description>
                          </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Icon name="copy" />
                          <List.Content>
                            <List.Header>Copy of the certificate:</List.Header>
                            <List.Description>
                              <a
                                href={`/certificate/${context.blockchain}/${
                                  details.address
                                }`}
                                alt="certificate-link"
                              >
                                Click here to download a copy of your
                                certificate
                              </a>
                            </List.Description>
                          </List.Content>
                        </List.Item>
                      </>
                    )}
                </List>
              </Grid.Column>
              {Object.keys(details.spousesDetails).map((spouse, index) => (
                <Grid.Column key={spouse}>
                  {details.spousesDetails[spouse].address ===
                  props.currentUser ? (
                    <Segment secondary>
                      <SpouseList
                        details={details}
                        spouse={spouse}
                        index={index}
                        isValid={marriageValidity.isValid}
                        currentUser={true}
                        currentAddress={props.currentUser}
                        updateBalance={props.updateBalance}
                        balance={balance}
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
                        balance={balance}
                      />
                    </Segment>
                  )}
                </Grid.Column>
              ))}
            </Grid.Row>
          </Grid>
        </Segment>
      )}
    </GlobalStateConsumer>
  );
};

export default DisplayCertificateCheck;
