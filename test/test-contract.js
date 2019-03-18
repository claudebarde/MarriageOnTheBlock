let certificateABI = require("../client/src/contracts/MarriageCertificate.json");
certificateABI = certificateABI.abi;

const Factory = artifacts.require("./MarriageCertificateCreator.sol");

contract("MarriageCertificateCreator", async accounts => {
  let contract;
  let certificateAddress;

  before(async () => {
    contract = await Factory.deployed();
  });

  it("Should return correct current fee", async () => {
    const fee = await contract.certificateFee.call();
    assert.equal(fee, 100000000000000000);
  });

  it("Should not update the fee", async () => {
    const newFee = web3.eth.abi.encodeParameter(
      "uint256",
      "200000000000000000"
    );
    try {
      await contract.updateFee(newFee, { from: accounts[1] });
    } catch (error) {
      assert("error", error);
    }
  });

  it("Should update the fee", async () => {
    const newFee = web3.eth.abi.encodeParameter("uint256", "50000000000000000");
    try {
      await contract.updateFee(newFee, { from: accounts[0] });
      const fee = await contract.certificateFee.call();
      assert.equal(fee, 50000000000000000);
    } catch (error) {
      console.log(error);
    }
  });

  it("Should create a new marriage certificate", async () => {
    const fee = web3.eth.abi.encodeParameter("uint256", "150000000000000000");
    const certificate = await contract.createNewCertificate(
      `{"firstName":"Ted","lastName":"Mosby","idNumber":"55555","idType":"passport","address":${
        accounts[2]
      }}`,
      `{"firstName":"Tracy","lastName":"McConnell","idNumber":"666666","idType":"id","address":${
        accounts[3]
      }}`,
      accounts[3],
      '{"city":"New York","country":"USA"}',
      { from: accounts[2], value: fee }
    );
    certificateAddress = certificate.logs[0].args.newCertificateAddress;
    assert.equal(certificate.logs[0].event, "LogNewCertificateCreated");
    assert.isTrue(web3.utils.isAddress(certificateAddress));
    assert.equal(certificate.logs[0].args.numberOfCertificates, 1);
  });

  it("Should return false as certificate is not validated yet", async () => {
    const certificate = new web3.eth.Contract(
      certificateABI,
      certificateAddress
    );
    const marriageStatus = await certificate.methods.checkIfValid().call();
    assert.isFalse(marriageStatus[0] && marriageStatus[1]);
  });

  it("Second spouse updates the marriage status", async () => {
    const certificate = new web3.eth.Contract(
      certificateABI,
      certificateAddress
    );
    // must fail
    try {
      await certificate.methods
        .changeMarriageStatus()
        .send({ from: accounts[4] });
    } catch (error) {
      assert("error", error);
    }
    //must pass
    try {
      await certificate.methods
        .changeMarriageStatus()
        .send({ from: accounts[3] });
    } catch (error) {
      console.log(error);
    }
    const marriageStatus = await certificate.methods.checkIfValid().call();
    assert.isTrue(marriageStatus[0] && marriageStatus[1]);
  });
});
