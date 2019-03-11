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

class Deposit extends Component {
  state = {
    convertEthToDollars: { toJoined: 0, toSavings: 0, toExternal: 0 },
    ethToTransfer: { toJoined: "", toSavings: "", toExternal: "" },
    ethToDollarChange: 0
  };

  convertEthToDollars = (event, account) => {
    const value = event.target.value.trim().replace("-", "");
    const ethToTransfer = { ...this.state.ethToTransfer };
    ethToTransfer[account] = value;
    const convertEthToDollars = { ...this.state.convertEthToDollars };
    convertEthToDollars[account] =
      Math.round(
        parseFloat(value) * parseFloat(this.state.ethToDollarChange)
      ) || 0;
    this.setState({
      ethToTransfer,
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
    return (
      <Segment secondary padded>
        <Header as="h1">
          <Image circular src="/images/eth-thumbnail.png" size="small" />
          Send and deposit ETH
        </Header>
        <Divider />
        <Grid columns={3} stackable>
          <Grid.Row>
            <Grid.Column width={7}>
              <Header as="h3">Deposit ETH to joined account</Header>
              <Input
                placeholder="Amount..."
                type="number"
                id="input-transfer-joined"
                value={this.state.ethToTransfer.toJoined}
                onChange={event => this.convertEthToDollars(event, "toJoined")}
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <Label>{`≈ $${this.state.convertEthToDollars.toJoined}`}</Label>
                <input />
                <Button color="teal">Deposit</Button>
              </Input>
            </Grid.Column>
            <Grid.Column width={2} />
            <Grid.Column width={7}>
              <Header as="h3">Deposit ETH to savings account</Header>
              <Input
                placeholder="Amount..."
                type="number"
                id="input-transfer-savings"
                value={this.state.ethToTransfer.toSavings}
                onChange={event => this.convertEthToDollars(event, "toSavings")}
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <Label>{`≈ $${
                  this.state.convertEthToDollars.toSavings
                }`}</Label>
                <input />
                <Button color="teal">Deposit</Button>
              </Input>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={9}>
              <Header as="h3">
                <Header.Content>
                  Send ETH to external address
                  <Header.Subheader>
                    This will be sent from your joined account
                  </Header.Subheader>
                </Header.Content>
              </Header>
              <Input placeholder="Address..." fluid />
            </Grid.Column>
            <Grid.Column width={7} verticalAlign="bottom">
              <Input
                placeholder="Amount..."
                type="number"
                id="input-transfer-external"
                value={this.state.ethToTransfer.toExternal}
                onChange={event =>
                  this.convertEthToDollars(event, "toExternal")
                }
                labelPosition="left"
                autoComplete="off"
                fluid
                action
              >
                <Label>{`≈ $${
                  this.state.convertEthToDollars.toExternal
                }`}</Label>
                <input />
                <Button color="teal">Send</Button>
              </Input>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    );
  }
}

export default Deposit;
