import React, { Component } from "react";
import {
  Message,
  Segment,
  Dimmer,
  Loader,
  Icon,
  Label,
  Accordion,
  Image
} from "semantic-ui-react";
import moment from "moment";

import firebase from "firebase/app";
import "firebase/firebase-functions";
import "firebase/auth";

import { truncateAddress } from "../../utils/functions";
import { withContext } from "../../config/config";

class TransactionsHistory extends Component {
  state = {
    activeIndex: 0,
    transactionsHistory: {},
    loadingTxHistory: true,
    errorLoadingHistory: ""
  };

  txSwitch = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;

    this.setState({ activeIndex: newIndex });
  };

  txLink = txHash => (
    <div>
      Transaction Hash:
      <br />
      <a
        href={`https://${this.props.context.network}.etherscan.io/tx/${txHash}`}
        alt="certificate-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {txHash}
      </a>
    </div>
  );

  displayTransactions = () => {
    const txHistory = this.state.transactionsHistory;

    return Object.keys(txHistory)
      .sort((a, b) => b - a)
      .map((tx, index) => {
        let title = "";
        let content = "";
        switch (txHistory[tx].type) {
          case "statusUpdate":
            // checks if data are corrupted
            if (
              Array.isArray(txHistory[tx].previousState) &&
              txHistory[tx].previousState.length === 2 &&
              Array.isArray(txHistory[tx].newState) &&
              txHistory[tx].newState.length === 2
            ) {
              const previousState = txHistory[tx].previousState.reduce(
                (a, b) => a && b
              );
              const newState = txHistory[tx].newState.reduce((a, b) => a && b);
              title = (
                <Label color="teal">
                  <Icon name="redo" /> Marriage Status Update
                  <Label.Detail>{moment.unix(tx / 1000).from()}</Label.Detail>
                </Label>
              );
              content = (
                <div>
                  <Segment attached="top">{`On ${moment
                    .unix(tx / 1000)
                    .format("MMMM Do YYYY, h:mm:ss a")}`}</Segment>
                  <Segment attached>{`From ${
                    previousState ? "valid" : "invalid"
                  } status to ${
                    newState ? "valid" : "invalid"
                  } status`}</Segment>
                  <Segment
                    size="tiny"
                    style={{ wordBreak: "break-word" }}
                    attached="bottom"
                  >
                    {this.txLink(txHistory[tx].txHash)}
                  </Segment>
                </div>
              );
            } else {
              title = "Error";
              content = "The transaction data are corrupted.";
            }
            break;
          case "deposit":
            title = (
              <Label color="green">
                <Icon name="arrow down" /> New Deposit
                <Label.Detail>{moment.unix(tx / 1000).from()}</Label.Detail>
              </Label>
            );
            content = (
              <div>
                <Segment attached="top">{`On ${moment
                  .unix(tx / 1000)
                  .format("MMMM Do YYYY, h:mm:ss a")}`}</Segment>
                <Segment attached>{`${this.props.web3.utils.fromWei(
                  txHistory[tx].amount.toString()
                )} ether deposited to ${
                  txHistory[tx].account
                } account from ${truncateAddress(
                  txHistory[tx].from
                )}`}</Segment>
                <Segment
                  size="tiny"
                  style={{ wordBreak: "break-word" }}
                  attached="bottom"
                >
                  {this.txLink(txHistory[tx].txHash)}
                </Segment>
              </div>
            );
            break;
          case "withdrawal":
            title = (
              <Label color="orange">
                <Icon name="arrow up" /> New Withdrawal
                <Label.Detail>{moment.unix(tx / 1000).from()}</Label.Detail>
              </Label>
            );
            content = (
              <div>
                <Segment attached="top">{`On ${moment
                  .unix(tx / 1000)
                  .format("MMMM Do YYYY, h:mm:ss a")}`}</Segment>
                <Segment attached>{`${this.props.web3.utils.fromWei(
                  txHistory[tx].amount.toString()
                )} ether withdrawn from ${
                  txHistory[tx].account
                } account to ${truncateAddress(txHistory[tx].from)}`}</Segment>
                <Segment
                  size="tiny"
                  style={{ wordBreak: "break-word" }}
                  attached="bottom"
                >
                  {this.txLink(txHistory[tx].txHash)}
                </Segment>
              </div>
            );
            break;
          case "withdrawalRequest":
            title = (
              <Label color="yellow">
                <Icon name="clock" /> New Withdrawal Request
                <Label.Detail>{moment.unix(tx / 1000).from()}</Label.Detail>
              </Label>
            );
            content = (
              <div>
                <Segment attached="top">{`On ${moment
                  .unix(tx / 1000)
                  .format("MMMM Do YYYY, h:mm:ss a")}`}</Segment>
                <Segment attached>{`${this.props.web3.utils.fromWei(
                  txHistory[tx].amount.toString()
                )} ether to be withdrawn from ${
                  txHistory[tx].account
                } account to ${truncateAddress(txHistory[tx].from)}`}</Segment>
                <Segment attached>
                  Request ID: {txHistory[tx].requestID}
                </Segment>
                <Segment
                  size="tiny"
                  style={{ wordBreak: "break-word" }}
                  attached="bottom"
                >
                  {this.txLink(txHistory[tx].txHash)}
                </Segment>
              </div>
            );
            break;
          case "approvedRequest":
            title = (
              <Label color="orange">
                <Icon name="arrow up" /> Withdrawal Request Approval
                <Label.Detail>{moment.unix(tx / 1000).from()}</Label.Detail>
              </Label>
            );
            content = (
              <div>
                <Segment attached="top">{`On ${moment
                  .unix(tx / 1000)
                  .format("MMMM Do YYYY, h:mm:ss a")}`}</Segment>
                <Segment attached>{`${this.props.web3.utils.fromWei(
                  txHistory[tx].amount.toString()
                )} ether withdrawn from savings account to ${truncateAddress(
                  txHistory[tx].to
                )}`}</Segment>
                <Segment
                  size="tiny"
                  style={{ wordBreak: "break-word" }}
                  attached="bottom"
                >
                  {this.txLink(txHistory[tx].txHash)}
                </Segment>
              </div>
            );
            break;
          case "sendToExternal":
            title = (
              <Label color="green">
                <Icon name="arrow down" /> New Payment
                <Label.Detail>{moment.unix(tx / 1000).from()}</Label.Detail>
              </Label>
            );
            content = (
              <div>
                <Segment attached="top">{`On ${moment
                  .unix(tx / 1000)
                  .format("MMMM Do YYYY, h:mm:ss a")}`}</Segment>
                <Segment attached>{`${this.props.web3.utils.fromWei(
                  txHistory[tx].amount.toString()
                )} ether were paid to ${
                  txHistory[tx].account
                } account from ${truncateAddress(
                  txHistory[tx].from
                )}`}</Segment>
                <Segment
                  size="tiny"
                  style={{ wordBreak: "break-word" }}
                  attached="bottom"
                >
                  {this.txLink(txHistory[tx].txHash)}
                </Segment>
              </div>
            );
            break;
          default:
            break;
        }

        return (
          <React.Fragment key={`accordion-${txHistory[tx].type}-${index}`}>
            <Accordion.Title
              active={this.state.activeIndex === index}
              index={index}
              onClick={this.txSwitch}
            >
              <Icon name="dropdown" />
              {title}
            </Accordion.Title>
            <Accordion.Content active={this.state.activeIndex === index}>
              {content}
            </Accordion.Content>
          </React.Fragment>
        );
      });
  };

  fetchTxHistory = () => {
    this.setState({ loadingTxHistory: true }, async () => {
      const { spousesAddresses, web3, certificateAddress } = this.props;
      // we fetch transaction history if one of the two spouses checks the contract
      const currentUser = web3.eth.accounts.currentProvider.selectedAddress.toLowerCase();
      if (
        spousesAddresses.includes(currentUser) &&
        firebase.auth().currentUser
      ) {
        const idToken = await firebase.auth().currentUser.getIdToken(true);
        const fetchTxHistory = firebase
          .functions()
          .httpsCallable("fetchTxHistory");
        const txHistory = await fetchTxHistory({ certificateAddress, idToken });
        if (txHistory.data.status === "OK") {
          this.setState(
            {
              transactionsHistory: txHistory.data.data,
              errorLoadingHistory: ""
            },
            () => this.setState({ loadingTxHistory: false })
          );
        } else if (txHistory.data.status === "error") {
          this.setState({
            loadingTxHistory: false,
            errorLoadingHistory: txHistory.data.message
          });
        }
      }
    });
  };

  componentDidMount = async () => {
    await this.fetchTxHistory();
  };

  render() {
    const { activeIndex, transactionsHistory } = this.state;

    if (this.state.errorLoadingHistory)
      return (
        <Message
          header="Warning!"
          content={this.state.errorLoadingHistory}
          warning
        />
      );

    if (this.state.loadingTxHistory)
      return (
        <Segment>
          <Dimmer active inverted>
            <Loader inverted content="Loading Transaction History" />
          </Dimmer>
          <Image src="/images/short-paragraph.png" />
        </Segment>
      );

    return (
      <Segment
        secondary
        padded
        style={{ maxHeight: "400px", overflow: "auto" }}
      >
        <Accordion fluid styled>
          {this.displayTransactions()}
          <Accordion.Title
            active={activeIndex === Object.keys(transactionsHistory).length + 1}
            index={Object.keys(transactionsHistory).length + 1}
            onClick={this.txSwitch}
          >
            <Icon name="dropdown" />
            <Label color="blue">
              <Icon name="calendar check" /> Certificate Creation
              <Label.Detail>
                {moment.unix(this.props.creationTimestamp).from()}
              </Label.Detail>
            </Label>
          </Accordion.Title>
          <Accordion.Content
            active={activeIndex === Object.keys(transactionsHistory).length + 1}
          >
            On{" "}
            {moment
              .unix(this.props.creationTimestamp)
              .format("MMMM Do YYYY, h:mm:ss a")}
          </Accordion.Content>
        </Accordion>
      </Segment>
    );
  }
}

export default withContext(TransactionsHistory);
