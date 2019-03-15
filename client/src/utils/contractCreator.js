//const deployedAddress = "0xDd33862eD2494C340815872632307ecf0ba7e1D4"; // localhost address
const deployedAddress = "0x4d4cfa71ad9eba21d4a32c29d355567fe63cba53"; //Ropsten address
//const deployedAddress = "0x56077ae8e6ca273dd7d6a59e86920dac67ce8acc"; // Rinkeby address

const deployedAbi = require("../contracts/MarriageCertificateCreator.json").abi;

export default { address: deployedAddress, abi: deployedAbi };
