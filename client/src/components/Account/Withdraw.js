import React, { Component } from "react";
import {
  Segment,
  Header,
  Input,
  Grid,
  Divider,
  Image,
  Button,
  Label
} from "semantic-ui-react";

import { withContext, MIN_SCREEN_WIDTH } from "../../config/config";

class Withdraw extends Component {
  state = {
    convertEthToDollars: { fromJoined: 0, fromSavings: 0, toExternal: 0 },
    ethToWithdraw: { fromJoined: "", fromSavings: "" },
    ethToDollarChange: 0,
    requestID: ""
  };

  convertEthToDollars = (event, account) => {
    const value = event.target.value.trim().replace("-", "");
    const ethToWithdraw = { ...this.state.ethToWithdraw };
    ethToWithdraw[account] = value;
    const convertEthToDollars = { ...this.state.convertEthToDollars };
    convertEthToDollars[account] =
      Math.round(
        parseFloat(value) * parseFloat(this.state.ethToDollarChange)
      ) || 0;
    this.setState({
      ethToWithdraw,
      convertEthToDollars
    });
  };

  componentDidMount = async () => {
    // fetches ether price in dollars
    const ethToDollar = await fetch(
      "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
    );
    ethToDollar
      .json()
      .then(price => this.setState({ ethToDollarChange: price["USD"] }));
  };

  render() {
    console.log(this.props.context.screenWidth > MIN_SCREEN_WIDTH);
    return (
      <Segment secondary padded>
        <Header as="h1">
          <Image circular src="/images/eth-thumbnail.png" size="small" />
          Withdraw ETH
        </Header>
        <Divider />
        <Grid columns={3} stackable>
          <Grid.Row>
            <Grid.Column width={7}>
              <Header as="h3">
                <Header.Content>
                  Withdraw ETH from joined account
                  <Header.Subheader>
                    This will be withdrawn immediately
                  </Header.Subheader>
                </Header.Content>
              </Header>
              <Input
                placeholder="Amount..."
                type="number"
                id="input-withdraw-joined"
                value={this.state.ethToWithdraw.fromJoined}
                onChange={event =>
                  this.convertEthToDollars(event, "fromJoined")
                }
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <Label>{`≈ $${
                  this.state.convertEthToDollars.fromJoined
                }`}</Label>
                <input />
                <Button color="teal">Withdraw</Button>
              </Input>
            </Grid.Column>
            <Grid.Column width={2} />
            <Grid.Column width={7}>
              <Header as="h3">
                <Header.Content>
                  Withdraw ETH from savings account
                  <Header.Subheader>
                    This must be approved by the second spouse
                  </Header.Subheader>
                </Header.Content>
              </Header>
              <Input
                placeholder="Amount..."
                type="number"
                id="input-transfer-savings"
                value={this.state.ethToWithdraw.fromSavings}
                onChange={event =>
                  this.convertEthToDollars(event, "fromSavings")
                }
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <Label>{`≈ $${
                  this.state.convertEthToDollars.fromSavings
                }`}</Label>
                <input />
                <Button color="teal">Withdraw</Button>
              </Input>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row
            centered={this.props.context.screenWidth > MIN_SCREEN_WIDTH}
          >
            <Grid.Column
              width={
                this.props.context.screenWidth > MIN_SCREEN_WIDTH ? 10 : 16
              }
              textAlign={
                this.props.context.screenWidth > MIN_SCREEN_WIDTH
                  ? "center"
                  : "left"
              }
            >
              <Header as="h3">
                <Header.Content>
                  Check Withdrawal Request
                  <Header.Subheader>
                    You can accept a withdrawal request here
                  </Header.Subheader>
                </Header.Content>
              </Header>
              <Input
                placeholder="Withdrawal Request Number..."
                type="number"
                id="input-transfer-external"
                value={this.state.requestID}
                onChange={event =>
                  this.setState({ requestID: event.target.value })
                }
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <input />
                <Button color="teal">Check</Button>
              </Input>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    );
  }
}

export default withContext(Withdraw);
