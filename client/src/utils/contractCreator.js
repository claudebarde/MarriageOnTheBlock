const deployedAddress = "0x630Fae5A0d764b43c77e32005F5A9E6EcdC45D7B"; // localhost address
//const deployedAddress = "0x56077ae8e6ca273dd7d6a59e86920dac67ce8acc"; //Ropsten address

const deployedAbi = require("../contracts/MarriageCertificateCreator.json").abi;

export default { address: deployedAddress, abi: deployedAbi };
