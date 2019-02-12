import _ from "lodash";
const newCertificateAbi = require("../contracts/MarriageCertificate.json").abi;

export const checkIfDetailsAreValid = details => {
  // returns false if at least one element is empty
  return Object.keys(details)
    .map(key => details[key].trim().length > 0)
    .reduce((a, b) => a && b);
};

export const checkCertificate = async (certificateAddress, web3) => {
  let result;

  try {
    const certificate = await new web3.eth.Contract(
      newCertificateAbi,
      certificateAddress
    );
    // this makes sure the certificate exists, throws error if not
    await web3.eth.getCode(certificateAddress);
    result = {
      return: "OK",
      isMarriageValid: await certificate.methods.checkIfValid().call(),
      spouse1: await certificate.methods.spouse1().call(),
      spouse2: await certificate.methods.spouse2().call(),
      location: await certificate.methods.location().call(),
      spousesAddresses: await certificate.methods
        .returnSpousesAddresses()
        .call(),
      timestamp: await certificate.methods.timestamp().call(),
      instance: certificate,
      balance: await certificate.methods.returnBalance().call()
    };
  } catch (error) {
    result = {
      return: "error",
      error
    };
  }

  return result;
};

export const lastMarriageDisplay = lastMarriage => {
  const spouse1 = JSON.parse(lastMarriage["0"]);
  const spouse2 = JSON.parse(lastMarriage["1"]);
  const location = JSON.parse(lastMarriage["2"]);

  return `${_.upperFirst(spouse1.firstName)} ${_.upperFirst(
    spouse1.lastName
  )} and ${_.upperFirst(spouse2.firstName)} ${_.upperFirst(
    spouse2.lastName
  )} got married in ${_.upperFirst(location.city)}, ${_.upperFirst(
    location.country
  )}.`;
};

export const MIN_SCREEN_WIDTH = 900;

export const CERTIFICATE_OBJ = {
  address: "0x8b35e59614efc1b4e760f56e8ee66df495822111",
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
