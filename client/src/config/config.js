import React from "react";

export const MIN_SCREEN_WIDTH = 768;

export const CERTIFICATE_OBJ = {
  address: "",
  timestamp: "",
  location: "",
  isMarriageValid: {},
  spousesDetails: {
    firstSpouseDetails: {
      firstName: "",
      lastName: "",
      idNumber: "",
      idType: "",
      address: ""
    },
    secondSpouseDetails: {
      firstName: "",
      lastName: "",
      idNumber: "",
      idType: "",
      address: ""
    }
  },
  error: null
};

export const etherescan_APIKEY = "S2IHBR3AZ3JFGMARDPSKJBU2FSJKG3FQUK";

export const NETWORK = "ropsten";

const GlobalState = React.createContext();
export const GlobalStateProvider = GlobalState.Provider;
export const withContext = WrappedComponent => {
  return class extends React.Component {
    render() {
      return (
        <GlobalState.Consumer>
          {context => <WrappedComponent context={context} {...this.props} />}
        </GlobalState.Consumer>
      );
    }
  };
};
