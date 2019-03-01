//const deployedAddress = "0xDd33862eD2494C340815872632307ecf0ba7e1D4"; // localhost address
const deployedAddress = "0xe9c3d70dbd7f1fe63377f7e9992ef7a178a3400d"; //Ropsten address
//const deployedAddress = "0x56077ae8e6ca273dd7d6a59e86920dac67ce8acc"; // Rinkeby address

const deployedAbi = require("../contracts/MarriageCertificateCreator.json").abi;

export default { address: deployedAddress, abi: deployedAbi };
