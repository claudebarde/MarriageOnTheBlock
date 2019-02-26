import React, { Component } from "react";
import {
  Menu,
  Dropdown,
  Icon,
  Container,
  Modal,
  Header,
  Button,
  Grid
} from "semantic-ui-react";
import { Link, withRouter } from "react-router-dom";

import { MIN_SCREEN_WIDTH } from "../config/config";

class Navbar extends Component {
  state = {
    minScreenWidth: MIN_SCREEN_WIDTH,
    screenWidth: window.innerWidth,
    navbarHeight: 0,
    onScrollDetected: false,
    blockchain: null,
    blockchainModalOpen: false
  };

  handleWindowSizeChange = () => {
    this.setState({
      screenWidth: window.innerWidth,
      navbarHeight: document.getElementById("navbar").clientHeight
    });
  };

  handleScroll = () => {
    if (document.getElementById("root").scrollTop > 15) {
      this.setState({ onScrollDetected: true });
    } else {
      this.setState({ onScrollDetected: false });
    }
  };

  openBlockchainModal = () => {
    const path = this.props.location.pathname;
    if (
      this.state.blockchain === null &&
      (path.includes("/check") || path.includes("/register")) &&
      (!path.includes("/eth") && !path.includes("/trx"))
    ) {
      this.setState({ blockchainModalOpen: true });
    }
  };

  componentDidMount = () => {
    window.addEventListener("resize", this.handleWindowSizeChange);
    setTimeout(this.handleWindowSizeChange, 100);
    document
      .getElementById("root")
      .addEventListener("scroll", this.handleScroll);
    // displays modal to let user choose blockchain
    this.openBlockchainModal();
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.handleWindowSizeChange);
    window.removeEventListener("scroll", this.handleScroll);
  };

  componentDidUpdate = () => {
    // displays modal to let user choose blockchain
    if (this.state.blockchainModalOpen === false) this.openBlockchainModal();
  };

  render() {
    const navbarPadding = Math.round(
      this.state.navbarHeight + this.state.navbarHeight / 4
    );

    return (
      <>
        <Menu
          size={!this.state.onScrollDetected ? "small" : "mini"}
          id="navbar"
          fixed="top"
          borderless
          fluid
          secondary={!this.state.onScrollDetected}
        >
          <Container>
            <Menu.Item
              className={
                !this.state.onScrollDetected ? "title" : "title-scroll"
              }
            >
              <Link to="/" className="router-link">
                Get Married On The Blockchain!
              </Link>
            </Menu.Item>
            <Menu.Menu position="right">
              <Menu.Item>
                <Dropdown
                  icon="bars"
                  floating
                  button
                  className="icon"
                  size={!this.state.onScrollDetected ? "small" : "mini"}
                >
                  <Dropdown.Menu>
                    <Dropdown.Item>
                      <Link to="/" className="router-link">
                        <Icon name="home" className="navbar-icon" />
                        Home
                      </Link>
                    </Dropdown.Item>
                    <Dropdown.Item>
                      <Link
                        to={
                          this.state.blockchain
                            ? `/register/${this.state.blockchain}`
                            : "/register"
                        }
                        className="router-link"
                      >
                        <Icon name="edit" className="navbar-icon" />
                        Register a certificate
                      </Link>
                    </Dropdown.Item>
                    <Dropdown.Item>
                      <Link
                        to={
                          this.state.blockchain
                            ? `/check/${this.state.blockchain}`
                            : "/check"
                        }
                        className="router-link"
                      >
                        <Icon name="id card outline" className="navbar-icon" />
                        Check a certificate
                      </Link>
                    </Dropdown.Item>
                    <Dropdown.Item>
                      <a
                        href="https://github.com/claudebarde/GetMarriedOnTheBlockchain"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="router-link"
                      >
                        <Icon name="github" className="navbar-icon" />
                        Github Repo
                      </a>
                    </Dropdown.Item>
                    <Dropdown.Item>
                      <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSfN9zRRHz78REQa85JeQvWsp5zHpS6bYRK7PWwHcSY7DR4Jxw/viewform?usp=sf_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="router-link"
                      >
                        <Icon name="wpforms" className="navbar-icon" />
                        Contact form
                      </a>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Menu.Item>
            </Menu.Menu>
          </Container>
        </Menu>
        <div
          id="navbar-padding"
          style={{
            height: navbarPadding
          }}
        />
        {this.state.blockchain === null && (
          <Modal open={this.state.blockchainModalOpen} basic size="small">
            <Header icon="linkify" content="Choose Your Blockchain" as="h2" />
            <Modal.Content>
              <Header as="h3" style={{ color: "white" }}>
                Which blockchain would you like to use?
              </Header>
              <Grid columns={2}>
                <Grid.Column>
                  <Button
                    color="teal"
                    size="big"
                    animated
                    inverted
                    fluid
                    onClick={() =>
                      // this saves the blockchain chosen by the user
                      this.setState(
                        {
                          blockchain: "eth",
                          blockchainModalOpen: false
                        },
                        () => {
                          // we rewrite the URL with the code for the chosen blockchain
                          let newURL = this.props.location.pathname;
                          newURL = newURL
                            .replace(
                              "/check",
                              `/check/${this.state.blockchain}`
                            )
                            .replace(
                              "/register",
                              `/register/${this.state.blockchain}`
                            );
                          this.props.history.push(newURL);
                        }
                      )
                    }
                  >
                    <Button.Content visible>
                      <Icon name="ethereum" /> Ethereum
                    </Button.Content>
                    <Button.Content hidden>Go!</Button.Content>
                  </Button>
                </Grid.Column>
                <Grid.Column>
                  <Button color="red" size="big" animated inverted fluid>
                    <Button.Content visible>
                      <Icon name="cube" /> Tron
                    </Button.Content>
                    <Button.Content hidden>Coming soon!</Button.Content>
                  </Button>
                </Grid.Column>
              </Grid>
            </Modal.Content>
          </Modal>
        )}
      </>
    );
  }
}

export default withRouter(Navbar);
