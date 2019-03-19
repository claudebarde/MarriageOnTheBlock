let certificateABI = require("../client/src/contracts/MarriageCertificate.json");
certificateABI = certificateABI.abi;

const Factory = artifacts.require("./MarriageCertificateCreator.sol");

contract("MarriageCertificateCreator", async accounts => {
  let contract, certificateAddress, certificateInstance, requestID;
  const firstSpouseAccount = accounts[2];
  const secondSpouseAccount = accounts[3];
  const gasForTx = 1000000;

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
      //console.log("Pass: ", error.message);
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
      `{"firstName":"Ted","lastName":"Mosby","idNumber":"55555","idType":"passport","address":${firstSpouseAccount}}`,
      `{"firstName":"Tracy","lastName":"McConnell","idNumber":"666666","idType":"id","address":${secondSpouseAccount}}`,
      secondSpouseAccount,
      '{"city":"New York","country":"USA"}',
      { from: firstSpouseAccount, value: fee }
    );
    certificateAddress = certificate.logs[0].args.newCertificateAddress;
    certificateInstance = new web3.eth.Contract(
      certificateABI,
      certificateAddress
    );
    assert.equal(certificate.logs[0].event, "LogNewCertificateCreated");
    assert.isTrue(web3.utils.isAddress(certificateAddress));
    assert.equal(certificate.logs[0].args.numberOfCertificates, 1);
  });

  it("Should return false as certificate is not validated yet", async () => {
    const marriageStatus = await certificateInstance.methods
      .checkIfValid()
      .call();
    assert.isFalse(marriageStatus[0] && marriageStatus[1]);
  });

  it("Second spouse updates the marriage status", async () => {
    // must fail
    try {
      await certificateInstance.methods
        .changeMarriageStatus()
        .send({ from: accounts[4], gas: gasForTx });
    } catch (error) {
      //console.log("Pass: ", error.message);
      assert("error", error);
    }
    //must pass
    try {
      await certificateInstance.methods
        .changeMarriageStatus()
        .send({ from: secondSpouseAccount, gas: gasForTx });
    } catch (error) {
      console.log(error);
    }
    const marriageStatus = await certificateInstance.methods
      .checkIfValid()
      .call();
    assert.isTrue(marriageStatus[0] && marriageStatus[1]);
  });

  it("First spouse deposits 0.1 ether in joint account", async () => {
    const account = web3.utils.fromAscii("joint");
    // we fetch current balance that must be 0
    const balances = await certificateInstance.methods.returnBalances().call();
    assert.equal(
      parseInt(balances[0]) + parseInt(balances[1]) + parseInt(balances[2]),
      0
    );
    const rightValue = web3.eth.abi.encodeParameter(
      "uint256",
      "100000000000000000"
    );
    const wrongValue = web3.eth.abi.encodeParameter(
      "uint256",
      "60000000000000000"
    );
    // we try to deposit money from a different account
    try {
      await certificateInstance.methods
        .deposit(rightValue, account)
        .send({ from: accounts[4], gas: gasForTx, value: rightValue });
    } catch (error) {
      //console.log("Pass: ", error.message);
      assert("error", error);
    }
    // we sent amount that doesnt match value
    try {
      await certificateInstance.methods
        .deposit(rightValue, account)
        .send({ from: firstSpouseAccount, gas: gasForTx, value: wrongValue });
    } catch (error) {
      //console.log("Pass: ", error.message);
      assert("error", error);
    }
    // we sent correct value
    try {
      const response = await certificateInstance.methods
        .deposit(rightValue, account)
        .send({ from: firstSpouseAccount, gas: gasForTx, value: rightValue });
      assert.property(response.events, "LogBalance");
      assert.propertyVal(
        response.events.LogBalance.returnValues,
        "total",
        "100000000000000000"
      );
      assert.propertyVal(
        response.events.LogBalance.returnValues,
        "joint",
        "100000000000000000"
      );
      assert.propertyVal(
        response.events.LogBalance.returnValues,
        "savings",
        "0"
      );
    } catch (error) {
      console.log(error);
    }
  });

  it("Second spouse deposits 0.1 ether in savings, first spouse tries to withdraw", async () => {
    const account = web3.utils.fromAscii("savings");
    // we fetch current balance that must be 0
    let balances = await certificateInstance.methods.returnBalances().call();
    assert.equal(
      parseInt(balances[1]) + parseInt(balances[2]),
      100000000000000000
    );
    const value = web3.eth.abi.encodeParameter("uint256", "100000000000000000");
    // we deposit money in savings account
    try {
      await certificateInstance.methods
        .deposit(value, account)
        .send({ from: secondSpouseAccount, gas: gasForTx, value });

      balances = await certificateInstance.methods.returnBalances().call();
      assert.equal(
        parseInt(balances[1]) + parseInt(balances[2]),
        200000000000000000
      );
      assert.propertyVal(balances, "0", "200000000000000000");
    } catch (error) {
      console.log(error);
    }
    // external account tries to withdraw from savings account
    try {
      await certificateInstance.methods
        .withdraw(value, account)
        .send({ from: accounts[4], gas: gasForTx });
    } catch (error) {
      //console.log("Pass: ", error.message);
      assert("error", error);
    }
    // first spouse tries to withdraw money from savings
    try {
      const withdraw = await certificateInstance.methods
        .withdraw(value, account)
        .send({ from: firstSpouseAccount, gas: gasForTx });
      requestID =
        withdraw.events.LogNewWithdrawalRequestFromSavings.returnValues.request;
      assert.property(withdraw.events, "LogNewWithdrawalRequestFromSavings");
      assert.isNotNaN(requestID);
    } catch (error) {
      console.log(error);
    }
  });

  it("Second spouse approves withdrawal from savings, first spouse balance is incremented", async () => {
    const firstSpousePreviousBalance = await web3.eth.getBalance(
      firstSpouseAccount
    );
    // we check if first spouse is able to accept the withdrawal
    try {
      await certificateInstance.methods
        .approveWithdrawRequestFromSavings(requestID)
        .send({ from: firstSpouseAccount, gas: gasForTx });
    } catch (error) {
      //console.log("Pass: ", error.message);
      assert("error", error);
    }
    // second spouse enters wrong request ID
    try {
      await certificateInstance.methods
        .approveWithdrawRequestFromSavings(123456789)
        .send({ from: secondSpouseAccount, gas: gasForTx });
    } catch (error) {
      //console.log("Pass: ", error.message);
      assert("error", error);
    }
    // second spouse accepts the withdrawal
    try {
      const response = await certificateInstance.methods
        .approveWithdrawRequestFromSavings(requestID)
        .send({ from: secondSpouseAccount, gas: gasForTx });
      assert.property(response.events, "LogBalance");
      assert.propertyVal(
        response.events.LogBalance.returnValues,
        "total",
        "100000000000000000"
      );
      assert.propertyVal(
        response.events.LogBalance.returnValues,
        "joint",
        "100000000000000000"
      );
      assert.propertyVal(
        response.events.LogBalance.returnValues,
        "savings",
        "0"
      );
      const firstSpouseNewBalance = await web3.eth.getBalance(
        firstSpouseAccount
      );
      assert.isAbove(
        parseInt(firstSpousePreviousBalance) - gasForTx + 100000000000000000,
        parseInt(firstSpouseNewBalance)
      );
    } catch (error) {
      console.log(error);
    }
  });

  it("First spouse sends money to external account", async () => {
    const value = web3.eth.abi.encodeParameter("uint256", "100000000000000000");
    const wrongValue = web3.eth.abi.encodeParameter(
      "uint256",
      "200000000000000000"
    );
    const recipientBalance = await web3.eth.getBalance(accounts[4]);
    // we send money to invalid address
    try {
      await certificateInstance.methods
        .pay(123456, value)
        .send({ from: firstSpouseAccount, gas: gasForTx });
    } catch (error) {
      //console.log("Pass: ", error.message);
      assert("error", error);
    }
    // we try to send an amount that exceeds available balance in joint account
    try {
      await certificateInstance.methods
        .pay(accounts[4], wrongValue)
        .send({ from: firstSpouseAccount, gas: gasForTx });
    } catch (error) {
      //console.log("Pass: ", error.message);
      assert("error", error);
    }
    // we send the right parameters
    try {
      const response = await certificateInstance.methods
        .pay(accounts[4], value)
        .send({ from: firstSpouseAccount, gas: gasForTx });
      assert.property(response.events, "LogBalance");
      assert.propertyVal(response.events.LogBalance.returnValues, "total", "0");
      assert.propertyVal(response.events.LogBalance.returnValues, "joint", "0");
      assert.propertyVal(
        response.events.LogBalance.returnValues,
        "savings",
        "0"
      );
      const recipientNewBalance = await web3.eth.getBalance(accounts[4]);
      assert.strictEqual(
        parseInt(recipientNewBalance),
        parseInt(recipientBalance) + 100000000000000000
      );
    } catch (error) {
      console.log(error);
    }
  });

  it("External account sends money to smart contract", async () => {
    const previousBalances = await certificateInstance.methods
      .returnBalances()
      .call();
    try {
      await web3.eth.sendTransaction({
        from: accounts[4],
        to: certificateAddress,
        value: "1000000000000000000"
      });
      // we check if the account was updated properly
      const balances = await certificateInstance.methods
        .returnBalances()
        .call();
      assert.equal(balances[0], "1000000000000000000");
      assert.equal(balances[1], "1000000000000000000");
      assert.equal(balances[2], "0");
    } catch (error) {
      console.log(error);
    }
  });
});
