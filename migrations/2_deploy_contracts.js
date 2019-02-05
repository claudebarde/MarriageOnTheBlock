var MarriageCertificate = artifacts.require("./MarriageCertificate.sol");

module.exports = function(deployer) {
  deployer.deploy(MarriageCertificate);
};
