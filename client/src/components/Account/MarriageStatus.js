import React, { Component } from "react";
import {
  Segment,
  Message,
  Button,
  Grid,
  Header,
  Divider
} from "semantic-ui-react";
import moment from "moment";

import SpouseInfoComponent from "./SpouseInfoComponent";

import { estimateTxTime } from "../../utils/functions";
import { TransactionModal, transactionModalData } from "../TransactionModal";

const countries = require("country-data").countries;

class MarriageStatus extends Component {
  state = {
    loading: false,
    errorSend: { joint: false, savings: false, external: false },
    transactionModal: {
      open: false,
      icon: "spinner",
      loading: true,
      header: "Waiting for confirmation...",
      txHash: null,
      message:
        "Your transaction is being confirmed on the blockchain, please wait.",
      estimateTime: null
    }
  };

  closeTxModal = (status, txHash) => {
    if (status === true) {
      this.setState({
        transactionModal: transactionModalData("confirmed", txHash)
      });
      setTimeout(
        () =>
          this.setState({
            transactionModal: transactionModalData("pending", txHash)
          }),
        3000
      );
    } else {
      this.setState({
        transactionModal: transactionModalData("error", txHash)
      });
    }
  };

  changeMarriageStatus = async () => {
    // the user address must be locked to avoid tempering during tx process
    const userAddress = this.props.userAddress;
    const estimateTime = await estimateTxTime();
    let transactionHash;

    await this.props.certificate.instance.methods
      .changeMarriageStatus()
      .send({ from: userAddress, gas: this.props.gasForTx })
      .on("transactionHash", txHash => {
        transactionHash = txHash;
        console.log("Tx hash: ", txHash);
        // the state is updated
        this.setState({
          transactionModal: {
            ...this.state.transactionModal,
            open: true,
            txHash,
            estimateTime
          }
        });
      })
      .on("receipt", receipt => {
        // when the tx is processed, we display a message to the user and close the modal
        this.closeTxModal(receipt.status, receipt.transactionHash);
      })
      .on("error", error => {
        console.log(error);
        this.closeTxModal("error", transactionHash);
      });
  };

  render() {
    const { certificate, spousesAddresses, userAddress, network } = this.props;
    // we arrange spouses choices in an array
    const spousesChoices = {};
    spousesChoices[spousesAddresses[0]] = certificate.isMarriageValid[0];
    spousesChoices[spousesAddresses[1]] = certificate.isMarriageValid[1];
    // we extract spouses details in more convenient variables
    const firstSpouseDetails = certificate.spousesDetails.firstSpouseDetails;
    const secondSpouseDetails = certificate.spousesDetails.secondSpouseDetails;

    return (
      <Segment secondary padded>
        <Header as="h1">Marriage Information</Header>
        <Divider />
        <Grid columns={2} stackable>
          <Grid.Row>
            <Grid.Column width={8}>
              <Message
                icon="globe"
                header="Place of registration"
                content={`${certificate.location.city}, ${
                  countries[certificate.location.country]
                    ? countries[certificate.location.country].name
                    : "invalid country"
                }`}
              />
            </Grid.Column>
            <Grid.Column width={8}>
              <Message
                icon="calendar alternate"
                header="Date of registration"
                content={moment
                  .unix(certificate.timestamp)
                  .format("dddd, MMMM Do YYYY, h:mm:ss a")}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={8}>
              <SpouseInfoComponent
                spouse={firstSpouseDetails}
                approved={certificate.isMarriageValid[0]}
              />
            </Grid.Column>
            <Grid.Column width={8}>
              <SpouseInfoComponent
                spouse={secondSpouseDetails}
                approved={certificate.isMarriageValid[1]}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={8}>
              <Message
                header="Certificate Link"
                content={
                  <a
                    href={
                      network === "main"
                        ? `https://etherscan.io/address/${certificate.address}`
                        : `https://${network}.etherscan.io/address/${
                            certificate.address
                          }`
                    }
                    alt="certificate-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    See your certificate on Etherscan.io
                  </a>
                }
              />
            </Grid.Column>
            <Grid.Column width={8}>
              <Message
                header="Copy of the certificate"
                content={
                  <a
                    href={`/certificate/${certificate.address}`}
                    alt="certificate-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click here to download a copy of your certificate
                  </a>
                }
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={16}>
              {spousesChoices.hasOwnProperty(userAddress) &&
                (spousesChoices[userAddress] ? (
                  <Button fluid onClick={this.changeMarriageStatus}>
                    Petition for divorce
                  </Button>
                ) : (
                  <Button fluid onClick={this.changeMarriageStatus}>
                    Validate the marriage
                  </Button>
                ))}
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <TransactionModal {...this.state.transactionModal} />
      </Segment>
    );
  }
}

export default MarriageStatus;
