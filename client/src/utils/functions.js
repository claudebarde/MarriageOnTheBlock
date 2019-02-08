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
    result = {
      return: "OK",
      isMarriageValid: await certificate.methods.checkIfValid().call(),
      spouse1: await certificate.methods.spouse1().call(),
      spouse2: await certificate.methods.spouse2().call(),
      location: await certificate.methods.location().call(),
      spousesAddresses: await certificate.methods
        .returnSpousesAddresses()
        .call(),
      timestamp: await certificate.methods.timestamp().call()
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
