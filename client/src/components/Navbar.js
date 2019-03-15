import React, { Component } from "react";
import { Menu, Dropdown, Icon, Container } from "semantic-ui-react";
import { Link } from "react-router-dom";

import { MIN_SCREEN_WIDTH, withContext } from "../config/config";
import SignInModal from "./SignInModal";

class Navbar extends Component {
  state = {
    minScreenWidth: MIN_SCREEN_WIDTH,
    screenWidth: window.innerWidth,
    navbarHeight: 0,
    onScrollDetected: false,
    authError: { open: false, message: "" },
    email: "",
    password: ""
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

  componentDidMount = () => {
    window.addEventListener("resize", this.handleWindowSizeChange);
    setTimeout(this.handleWindowSizeChange, 100);
    document
      .getElementById("root")
      .addEventListener("scroll", this.handleScroll);
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.handleWindowSizeChange);
    window.removeEventListener("scroll", this.handleScroll);
  };

  render() {
    const navbarPadding = Math.round(
      this.state.navbarHeight + this.state.navbarHeight / 4
    );

    const { context } = this.props;

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
                Marriage On The Block
              </Link>
            </Menu.Item>
            <Menu.Menu position="right">
              <Menu.Item>
                <Dropdown
                  icon="bars"
                  floating
                  button
                  closeOnBlur
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
                      <Link to="/register" className="router-link">
                        <Icon name="edit" className="navbar-icon" />
                        Register a certificate
                      </Link>
                    </Dropdown.Item>
                    <Dropdown.Item>
                      {context.userCertificate ? (
                        <Link
                          to={`/check/${context.userCertificate}`}
                          className="router-link"
                        >
                          <Icon
                            name="id card outline"
                            className="navbar-icon"
                          />
                          Check a certificate
                        </Link>
                      ) : (
                        <Link to="/check" className="router-link">
                          <Icon
                            name="id card outline"
                            className="navbar-icon"
                          />
                          Check a certificate
                        </Link>
                      )}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item>
                      <a
                        href="https://github.com/claudebarde/MarriageOnTheBlock"
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
                    <Dropdown.Item>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="router-link"
                      >
                        <Icon name="medium m" className="navbar-icon" />
                        Smart Contract Details
                      </a>
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    {context.loggedInUser ? (
                      <>
                        <Dropdown.Item>
                          <Link to="/account" className="router-link">
                            <Icon name="user" className="navbar-icon" />
                            Your account
                          </Link>
                        </Dropdown.Item>
                        <Dropdown.Item as="a" onClick={context.signOutUser}>
                          <Icon name="sign-out" className="navbar-icon" />
                          Sign Out
                        </Dropdown.Item>
                      </>
                    ) : (
                      <SignInModal />
                    )}
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
      </>
    );
  }
}

export default withContext(Navbar);
