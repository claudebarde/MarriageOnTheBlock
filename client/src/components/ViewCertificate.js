import React, { Component } from "react";
import {
  Segment,
  Dimmer,
  Loader,
  Image,
  Container,
  Header,
  Grid,
  Button,
  Message
} from "semantic-ui-react";
import _ from "lodash";
import moment from "moment";
import domtoimage from "dom-to-image";

import { checkCertificate, isMarriageValid } from "../utils/functions";

class ViewCertificate extends Component {
  state = {
    address: "",
    certificate: null,
    loading: true,
    error: { status: false, message: "" }
  };

  componentDidMount = async () => {
    // we fetch the address from the url
    const { address } = this.props.match.params;
    if (address) {
      // we load the certificate info
      const certificate = await checkCertificate(address);
      if (certificate.return === "OK") {
        certificate.spouse1 = JSON.parse(certificate.spouse1);
        certificate.spouse2 = JSON.parse(certificate.spouse2);
        certificate.location = JSON.parse(certificate.location);
        this.setState({ address, certificate, loading: false });
      } else {
        this.setState({
          loading: false,
          error: { status: true, message: certificate.error.message }
        });
      }
    } else {
      this.setState({
        loading: false,
        error: { status: true, message: "No address provided!" }
      });
    }
  };

  render() {
    if (this.state.error.status) {
      return (
        <Container>
          <Message
            header="An error has occurred"
            content={this.state.error.message}
            error
          />
        </Container>
      );
    }

    if (this.state.loading) {
      return (
        <Container>
          <Segment>
            <Dimmer active inverted>
              <Loader inverted content="Loading" />
            </Dimmer>
            <Image src="/images/short-paragraph.png" />
          </Segment>
        </Container>
      );
    }

    const { spouse1, spouse2 } = this.state.certificate;
    const { city, country } = this.state.certificate.location;
    const segmentSize = "huge";

    return (
      <Container>
        <Segment textAlign="center" padded raised attached>
          <div id="certificate" className="certificate-view">
            {[
              { bottom: "0", left: "0" },
              {
                top: "0",
                left: "0",
                transform: "rotate(90deg)"
              },
              {
                top: "0",
                right: "0",
                transform: "rotate(180deg)"
              },
              {
                bottom: "0",
                right: "0",
                transform: "rotate(-90deg)"
              }
            ].map((style, index) => (
              <img
                key={`image-corner-${index}`}
                src="/images/certificate-corner.png"
                alt="corner"
                style={{ position: "absolute", width: "150px", ...style }}
              />
            ))}
            <Header as="h1" className="certificate-view-title">
              Certificate of Marriage
            </Header>
            <Segment size={segmentSize} className="certificate-view-text" basic>
              This certifies that
              <br />
              {_.upperFirst(spouse1.firstName)} {_.upperFirst(spouse1.lastName)}{" "}
              & {_.upperFirst(spouse2.firstName)}{" "}
              {_.upperFirst(spouse2.lastName)}
              <br />
              were joined in marriage before the blockchain.
              <br />
              <br />
              This day,{" "}
              {moment
                .unix(this.state.certificate.timestamp)
                .format("dddd, MMMM Do YYYY")}{" "}
              at{" "}
              {moment
                .unix(this.state.certificate.timestamp)
                .format("h:mm:ss a")}
              <br />
              In {city}, {country}.
              <br />
              <br />
              The marriage certificate is{" "}
              {isMarriageValid(
                this.state.certificate.isMarriageValid
              ).value.toLowerCase()}
              <br />
              at the following address: <br />
              {this.state.address}.
              <br />
              <br />
              <Grid columns="equal" stackable>
                <Grid.Column>
                  <Segment className="certificate-view-text" basic>
                    {_.upperFirst(spouse1.firstName)}{" "}
                    {_.upperFirst(spouse1.lastName)}
                    <br />
                    <span className="certificate-view-address">
                      {_.upperFirst(spouse1.address)}
                    </span>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment className="certificate-view-text" basic>
                    {_.upperFirst(spouse2.firstName)}{" "}
                    {_.upperFirst(spouse2.lastName)}
                    <br />
                    <span className="certificate-view-address">
                      {_.upperFirst(spouse2.address)}
                    </span>
                  </Segment>
                </Grid.Column>
              </Grid>
            </Segment>
            <Segment basic size="tiny">
              <a
                href="https://www.marriageontheblock.com"
                style={{ color: "grey", fontStyle: "italic" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                https://www.marriageontheblock.com
              </a>
            </Segment>
          </div>
        </Segment>
        <Button
          attached="bottom"
          onClick={() => {
            domtoimage
              .toJpeg(document.getElementById("certificate"), { quality: 1 })
              .then(function(dataUrl) {
                var link = document.createElement("a");
                link.download = "marriage-certificate.jpeg";
                link.href = dataUrl;
                link.click();
              });
          }}
        >
          Download a copy of the certificate
        </Button>
        <br />
      </Container>
    );
  }
}

export default ViewCertificate;
