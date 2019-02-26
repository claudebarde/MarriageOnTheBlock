const {
  MNEMONIC,
  ROPSTEN_ENDPOINT,
  RINKEBY_ENDPOINT
} = require("./network-config");
const path = require("path");
const HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "*" // Any network (default: none)
    },
    ropsten: {
      from: "0x0fC3D599C0CC8c8741F9c56170887a39Bb9e1745",
      provider: function() {
        return new HDWalletProvider(MNEMONIC, ROPSTEN_ENDPOINT);
      },
      network_id: 3,
      gasPrice: 2000000000000,
      gas: 3500000
    },
    rinkeby: {
      from: "0x0fC3D599C0CC8c8741F9c56170887a39Bb9e1745",
      provider: function() {
        return new HDWalletProvider(MNEMONIC, RINKEBY_ENDPOINT);
      },
      network_id: 3,
      gasPrice: 2000000000000,
      gas: 3500000
    }
  }
};
