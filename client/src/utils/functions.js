import _ from "lodash";
import getWeb3 from "./getWeb3";

const countries = require("country-data").countries;

const newCertificateAbi = require("../contracts/MarriageCertificate.json").abi;

export const truncateAddress = address => {
  if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const checkIfDetailsAreValid = details => {
  try {
    // returns false if at least one element is empty
    if (Object.keys(details).length > 0) {
      return Object.keys(details)
        .map(key => details[key].trim().length > 0)
        .reduce((a, b) => a && b);
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const checkCertificate = async certificateAddress => {
  return getWeb3()
    .then(async web3 => {
      let result;

      try {
        const certificate = await new web3.eth.Contract(
          newCertificateAbi,
          certificateAddress
        );
        // this makes sure the certificate exists, throws error if not
        const getCode = await web3.eth.getCode(certificateAddress);
        if (getCode === "0x")
          throw new Error("The certificate does not exist!");

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
          balance: {}
        };
        // balance for each account must be formatted for easier reading
        const balances = await certificate.methods.returnBalances().call();
        result.balance = {
          total: balances[0],
          joint: balances[1],
          savings: balances[2]
        };
      } catch (error) {
        result = {
          return: "error",
          error
        };
      }

      return result;
    })
    .catch(error => ({
      return: "error",
      error
    }));
};

export const lastMarriageDisplay = lastMarriage => {
  const spouse1 = JSON.parse(lastMarriage["0"]);
  const spouse2 = JSON.parse(lastMarriage["1"]);
  const location = JSON.parse(lastMarriage["2"]);

  return `${_.upperFirst(spouse1.firstName)} ${_.upperFirst(
    spouse1.lastName
  )} and ${_.upperFirst(spouse2.firstName)} ${_.upperFirst(
    spouse2.lastName
  )} got married in ${_.upperFirst(location.city)}, ${
    countries[location.country].name
  }.`;
};

export const isMarriageValid = marriageValidityData => {
  // display marriage validity
  let marriageValidity = { value: 0, message: "error" };
  const isValid = Object.keys(marriageValidityData).map(
    key => marriageValidityData[key]
  );
  switch (true) {
    case isValid[0] === true && isValid[1] === false:
      marriageValidity = {
        value: "Not Valid",
        message: "Second spouse did not approve or disapproved the marriage",
        isValid
      };
      break;
    case isValid[0] === true && isValid[1] === true:
      marriageValidity = {
        value: "Valid",
        message: "The marriage has been approved by both spouses",
        isValid
      };
      break;
    case isValid[0] === false && isValid[1] === true:
      marriageValidity = {
        value: "Not Valid",
        message: "First spouse disapproved the marriage",
        isValid
      };
      break;
    case isValid[0] === false && isValid[1] === false:
      marriageValidity = {
        value: "Not Valid",
        message: "The spouses have divorced",
        isValid
      };
      break;
    default:
      break;
  }

  return marriageValidity;
};

export const estimateTxTime = async () => {
  const web3 = await getWeb3();
  const span = 1000;
  // we fetch the current block and the block 100 places before
  const blockNumber = await web3.eth.getBlockNumber();
  const currentBlock = await web3.eth.getBlock(blockNumber);
  const pastBlock = await web3.eth.getBlock(blockNumber - span);
  // we get the difference in their timestamps
  const diff = currentBlock.timestamp - pastBlock.timestamp;
  const estimateTime = diff / span;

  return Math.round(estimateTime);
};
