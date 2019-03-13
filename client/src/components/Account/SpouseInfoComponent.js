import React, { Component } from "react";
import { Message, Popup, Input } from "semantic-ui-react";
import { upperFirst } from "lodash";
import CryptoJS from "crypto-js";

import { withContext, MIN_SCREEN_WIDTH } from "../../config/config";

class SpouseInfoComponent extends Component {
  state = {
    displayIdNumber: "••••••••••••••••••",
    decryptInput: { error: false, length: 0 }
  };

  decryptIdNumber = event => {
    const key = event.target.value;
    const { spouse } = this.props;
    // decrypts first spouse id
    try {
      const decrypt = CryptoJS.AES.decrypt(
        spouse.idNumber.toString(),
        key.toString()
      ).toString(CryptoJS.enc.Utf8);
      // we update the Id Number field according to results
      if (key.length > 0 && decrypt) {
        this.setState({ decryptInput: { error: false, length: key.length } });
        // we update the state with the id numbers
        this.setState({
          displayIdNumber: decrypt
        });
      } else if (key.length === 0 && !decrypt) {
        this.setState({ decryptInput: { error: false, length: 0 } });
      } else {
        this.setState({ decryptInput: { error: true, length: key.length } });
      }
    } catch (error) {
      this.setState({ decryptInput: { error: true, length: key.length } });
    }
  };

  render() {
    const { spouse, approved } = this.props;
    const options = this.props.approved
      ? { success: true, error: false }
      : { success: false, error: true };
    // checks if mobile version
    const mobile = this.state.screenWidth <= MIN_SCREEN_WIDTH;

    return (
      <Message {...options} size={mobile ? "tiny" : "small"}>
        <Message.Header>{`${upperFirst(spouse.firstName)} ${upperFirst(
          spouse.lastName
        )}`}</Message.Header>
        <Message.List>
          <Message.Item>Certificate Creator</Message.Item>
          <Popup
            trigger={
              <Message.Item>{`${upperFirst(spouse.idType)} Number: ${
                this.state.displayIdNumber
              }`}</Message.Item>
            }
            content={
              <Input
                type="password"
                placeholder="Enter security key"
                icon={
                  !this.state.decryptInput.error &&
                  this.state.decryptInput.length > 0
                    ? "thumbs up outline"
                    : "search"
                }
                onChange={this.decryptIdNumber}
                error={this.state.decryptInput.error}
                autoFocus
              />
            }
            on="click"
            position="top left"
            onClose={() =>
              this.setState({
                decryptInput: { error: false, length: 0 }
              })
            }
          />

          <Message.Item>{`Address: ${spouse.address}`}</Message.Item>
          {approved ? (
            <Message.Item>Spouse approved the marriage.</Message.Item>
          ) : (
            <Message.Item>Spouse disapproved the marriage.</Message.Item>
          )}
        </Message.List>
      </Message>
    );
  }
}

export default withContext(SpouseInfoComponent);
