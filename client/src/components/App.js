import React, { Component } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Segment,
  Header,
  List,
  Button,
  Image
} from "semantic-ui-react";

class App extends Component {
  render() {
    return (
      <Container text>
        <Segment textAlign="center" className="front-page-block" padded basic>
          <Header as="h1" className="front-page-header">
            WHAT ABOUT TYING THE KNOT IN A BLOCK?
          </Header>
          <Header as="h2" className="front-page-subheader">
            Spread your love from node to node on the blockchain!
          </Header>
        </Segment>
        <Segment padded="very">
          <Image src="/images/undraw_wedding_t1yl.svg" size="medium" centered />
          <Header as="h3">
            Here are a few benefits of registering your marriage on the
            blockchain:
          </Header>
          <br />
          <List bulleted>
            <List.Item>
              <List.Content>
                <List.Header>
                  Have access to your marriage certificate anywhere at any time!
                </List.Header>
                <List.Description>
                  Because your marriage certificate lives on the blockchain, you
                  can read it and get a copy of it in seconds.
                </List.Description>
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Content>
                <List.Header>Save a lot of time and money!</List.Header>
                <List.Description>
                  It takes only a few minutes to register a new certificate for
                  a minimal price. No more standing in line to get married, to
                  get the certificate or to update the marriage status.
                </List.Description>
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Content>
                <List.Header>Handle your marriage yourself!</List.Header>
                <List.Description>
                  Your marriage smart contract allows you to update your
                  marriage status in a few seconds, including divorcing.
                </List.Description>
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Content>
                <List.Header>Become your own bank!</List.Header>
                <List.Description>
                  The smart contract keeps tract of two different accounts: a
                  "joined account" where you can both deposit and withdraw money
                  and a "savings account" where you can both deposit money but
                  must both agree before a withdrawal.
                </List.Description>
              </List.Content>
            </List.Item>
          </List>
          <Link to="/register">
            <Button fluid>What are you waiting for? Get married now!</Button>
          </Link>
        </Segment>
      </Container>
    );
  }
}

export default App;
