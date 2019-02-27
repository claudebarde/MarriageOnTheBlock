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

const GlobalState = React.createContext();
export const GlobalStateProvider = GlobalState.Provider;
export const GlobalStateConsumer = GlobalState.Consumer;
