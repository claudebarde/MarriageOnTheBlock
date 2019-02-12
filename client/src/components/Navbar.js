import React, { Component } from "react";
import { Container, Menu, Image, Dropdown, Icon } from "semantic-ui-react";
import { Link } from "react-router-dom";

import { MIN_SCREEN_WIDTH } from "../utils/functions";

class Navbar extends Component {
  state = {
    minScreenWidth: MIN_SCREEN_WIDTH,
    screenWidth: window.innerWidth,
    navbarHeight: 0
  };

  handleWindowSizeChange = () => {
    this.setState({
      screenWidth: window.innerWidth,
      navbarHeight: document.getElementById("navbar").clientHeight
    });
  };

  componentDidMount = () => {
    window.addEventListener("resize", this.handleWindowSizeChange);
    setTimeout(this.handleWindowSizeChange, 100);
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.handleWindowSizeChange);
  };

  render() {
    const navbarPadding = Math.round(
      this.state.navbarHeight + this.state.navbarHeight / 4
    );

    if (this.state.screenWidth >= MIN_SCREEN_WIDTH) {
      // LARGE SCREENS
      return (
        <>
          <Menu size="huge" borderless fixed="top" fluid id="navbar">
            <Container>
              <Menu.Item className="title">
                <Link to="/" className="router-link">
                  Get Married On The Blockchain!
                </Link>
              </Menu.Item>
              <Menu.Item>
                <Image src="/images/undraw_wedding_t1yl.svg" size="small" />
              </Menu.Item>

              <Menu.Menu position="right">
                <Menu.Item>
                  <Dropdown icon="bars" floating button className="icon">
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
                        <Link to="/check" className="router-link">
                          <Icon
                            name="id card outline"
                            className="navbar-icon"
                          />
                          Check a certificate
                        </Link>
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <Link to="/" className="router-link">
                          <Icon name="wpforms" className="navbar-icon" />
                          Contact form
                        </Link>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Menu.Item>
              </Menu.Menu>
            </Container>
          </Menu>
          <div
            style={{
              height: navbarPadding
            }}
          />
        </>
      );
    } else {
      // SMALL SCREENS
      return (
        <>
          <Menu size="mini" borderless fixed="top" fluid id="navbar">
            <Menu.Item>
              <Dropdown item floating icon="bars" className="mobile-hamburger">
                <Dropdown.Menu>
                  <Dropdown.Item>
                    <Link to="/" className="router-link">
                      <Icon name="home" />
                      Home
                    </Link>
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <Link to="/register" className="router-link">
                      <Icon name="edit" />
                      Register a certificate
                    </Link>
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <Link to="/check" className="router-link">
                      <Icon name="id card outline" />
                      Check certificate
                    </Link>
                  </Dropdown.Item>
                  <Dropdown.Item icon="wpforms" text="Contact Form" />
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Item>
            <Menu.Item className="title-mobile">
              Get Married <wbr />
              On The Blockchain!
            </Menu.Item>
            <Menu.Menu position="right">
              <Menu.Item>
                <Image src="/images/undraw_wedding_t1yl.svg" size="tiny" />
              </Menu.Item>
            </Menu.Menu>
          </Menu>
          <div style={{ height: navbarPadding }} />
        </>
      );
    }
  }
}

export default Navbar;
