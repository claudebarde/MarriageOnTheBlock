const MarriageCertificateCreator = artifacts.require(
  "./MarriageCertificateCreator.sol"
);

module.exports = function(deployer) {
  deployer.deploy(MarriageCertificateCreator);
};
