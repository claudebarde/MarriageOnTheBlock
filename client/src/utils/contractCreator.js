//const deployedAddress = "0xDd33862eD2494C340815872632307ecf0ba7e1D4"; // localhost address
const deployedAddress = "0xea556cdccc09d99778fde694a7ce5664e5a38e47"; //Ropsten address
//const deployedAddress = "0x56077ae8e6ca273dd7d6a59e86920dac67ce8acc"; // Rinkeby address

const deployedAbi = require("../contracts/MarriageCertificateCreator.json").abi;

export default { address: deployedAddress, abi: deployedAbi };
