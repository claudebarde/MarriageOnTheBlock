pragma solidity ^0.5.0;

contract MarriageCertificateCreator {
    /// @title MarriageCertificateCreator
    /// @author Claude Barde

    MarriageCertificate[] public certificates;
    address payable public owner;
    uint public certificateFee;
    string[3] public lastMarriage;
    
    constructor() public {
        owner = msg.sender;
        certificateFee = 100000000000000000 wei;
    }
    
    event LogNewCertificateCreated(MarriageCertificate newCertificateAddress, uint numberOfCertificates);
    
    modifier onlyOwner {
        require(msg.sender == owner, "You are not allowed to perform this action");
        _;
    }
    
    /** 
        @dev function is called every time someone wants to register a new marriage certificate
        @param spouse1 =  holds JSON string with first spouse details
        @param spouse2 =  holds JSON string with second spouse details
        @param spouse2address = address of second spouse needed to validate the marriage
        @param location =  holds JSON string with location details
    **/
    function createNewCertificate(
        string memory spouse1, string memory spouse2, address spouse2address, string memory location
        ) public payable {
        // certificate fee must be paid
        require(msg.value >= certificateFee, "Insufficient fee");
        // new certificate creation
        MarriageCertificate newCertificate = new MarriageCertificate(
            msg.sender,
            spouse1,
            spouse2,
            spouse2address,
            location);
        // we save the address in array
        certificates.push(newCertificate);
        // we update last marriage array
        lastMarriage = [spouse1, spouse2, location];
        // we return an event for the web3 interface
        emit LogNewCertificateCreated(newCertificate, certificates.length);
    }
    
    /// @dev owner of contract can update the required fee to create a new certificate
    function updateFee(uint newFee) public onlyOwner {
        certificateFee = newFee;
    }
    
    function returnNumberOfContracts() public view returns (uint) {
        return certificates.length;
    }
    
    function getLastMarriage() public view returns (string memory, string memory, string memory) {
        return (lastMarriage[0], lastMarriage[1], lastMarriage[2]);
    }
    
    function returnBalance() public view returns (uint) {
        return address(this).balance;
    }
    
    function withdraw() public onlyOwner {
        owner.transfer(address(this).balance);
    }
    
    function close() public onlyOwner {
        selfdestruct(owner);
    }
    
    function() external payable {}
}

contract MarriageCertificate {
    string public location;
    string public spouse1;
    string public spouse2;
    bool[2] public isValid;
    address[2] public spousesAddresses;
    uint public timestamp;
    mapping(bytes32 => uint) public accounts;
    struct withdrawRequestFromSavings {
        address payable sender;
        uint amount;
        uint timestamp;
        bool approved;
    }
    mapping(uint => withdrawRequestFromSavings) public withdrawRequests;
    
    event LogMarriageValidity(bool[2] validity);
    event LogNewWithdrawalRequestFromSavings(uint request);
    event LogBalance(uint total, uint joined, uint savings);
    
    /** 
        @dev function is called every time someone wants to register a new marriage certificate
        @param certificateCreator =  spouse who initiated the contract
        @param _spouse1 =  holds JSON string with first spouse details
        @param _spouse2 =  holds JSON string with second spouse details
        @param spouse2address = keeps second spouse address for validation purposes
        @param _location =  holds JSON string with location details
    **/
    constructor(
        address certificateCreator, 
        string memory _spouse1, 
        string memory _spouse2,
        address spouse2address, 
        string memory _location) public {
        require(certificateCreator != spouse2address, "Spouses' addresses cannot be the same!");
        
        location = _location;
        spouse1 = _spouse1;
        spouse2 = _spouse2;
        isValid = [true, false];
        spousesAddresses = [certificateCreator, spouse2address];
        timestamp = now;
        accounts["joined"] = 0;
        accounts["savings"] =  0;
    }
    
    /// @dev some functions can only be accessed by one of the two spouses
    modifier onlySpouses {
        require (
            msg.sender == spousesAddresses[0] || msg.sender == spousesAddresses[1], "The contract status can only be changed by one of the spouses."
            );
        _;
    }
    
    function checkIfValid() public view returns (bool, bool) {
        return (isValid[0], isValid[1]);
    }
    
    function returnSpousesAddresses() public view returns (address, address) {
        return (spousesAddresses[0], spousesAddresses[1]);
    }
    
    /// @dev only the two spouses have access to this function
    function returnBalances() public view returns (uint, uint, uint) {
        return (address(this).balance, accounts["joined"], accounts["savings"]);
    }
    
    /// @notice allows spouses to change contract state
    function changeMarriageStatus() public onlySpouses {
        if(msg.sender == spousesAddresses[0]){
            isValid[0] = !isValid[0];
        } else if(msg.sender == spousesAddresses[1]){
            isValid[1] = !isValid[1];
        }
        
        emit LogMarriageValidity(isValid);
    }
    
    /// @notice allows spouses or third parties to deposit money in marriage contract
    function deposit(uint amount, bytes32 account) public payable onlySpouses {
        // we check the amount sent is the amount required
        require(msg.value == amount, "Wrong amount sent!");
        // we update the balance according to the account type selected
        if(stringsAreEqual(account, "joined")) {
            accounts["joined"] += amount;
        } else if(stringsAreEqual(account, "savings")) {
            accounts["savings"] += amount;
        } else {
            revert("This is not a valid account.");
        }
        // we make sure the sum of the joined and savings accounts is equal to the total sum
        assert(accounts["joined"] + accounts["savings"] == address(this).balance);
        // we log the new balance
        emit LogBalance(address(this).balance, accounts["joined"], accounts["savings"]);
    }
    
    /// @notice allows spouses to withdraw money from the account
    function withdraw(uint amount, bytes32 account) public onlySpouses {
        require(accounts[account] >= amount, "Withdrawal request exceeds account balance!");
        
        // we check if the balance is sufficient for the withdrawal from the joined account
        if(stringsAreEqual(account, "joined") && 
            accounts["joined"] >= amount) {
            // we substract the amount from the joined account amount
            accounts["joined"] -= amount;
            // we send the money
            msg.sender.transfer(amount);
        } else if(stringsAreEqual(account, "savings") && 
            accounts["savings"] >= amount) {
            // we create a request number
            uint requestID = uint(now + block.difficulty + block.number);
            // we save the new request in requests mapping
            withdrawRequests[requestID] = withdrawRequestFromSavings({
                sender: msg.sender,
                amount: amount,
                timestamp: now,
                approved: false
            });
            // we emit the new request with id number that will help find it in requests mapping
            emit LogNewWithdrawalRequestFromSavings(requestID);
        } else {
            revert("Invalid account or requested amount exceeds available balance.");
        }
        // we make sure the sum of the joined and savings accounts is equal to the total sum
        assert(accounts["joined"] + accounts["savings"] == address(this).balance);
        // we log the new balance
        emit LogBalance(address(this).balance, accounts["joined"], accounts["savings"]);
    }
    
    /** @notice allows spouse to accept withdrawal request from savings
     *          and sends money to the account that created the request
    **/
    function approveWithdrawRequestFromSavings(uint requestID) public onlySpouses {
        withdrawRequestFromSavings storage request = withdrawRequests[requestID];
        // code makes sure there are enough funds to withdraw
        require(request.amount <= accounts["savings"], "There are not enough funds to process the request.");
        // the request cannot have been approved before
        if(request.approved == false) {
            // the spouse approving the request cannot be the one who initiated it
            if((spousesAddresses[0] == msg.sender && spousesAddresses[1] == request.sender) || 
            (spousesAddresses[1] == msg.sender && spousesAddresses[0] == request.sender)) {
                // mark the request as approved
                request.approved = true;
                // deduct amount from accounts mapping
                accounts["savings"] -= request.amount;
                // we make sure the sum of the joined and savings accounts is equal to the total sum
                assert(accounts["joined"] + accounts["savings"] == address(this).balance);
                // we transfer the money
                request.sender.transfer(request.amount);
                // we log the new balance
                emit LogBalance(address(this).balance, accounts["joined"], accounts["savings"]);
            } else {
            revert("The request cannot be approved by the same person who created it!");
            }
        } else {
            revert("This request has already been approved!");
        }
    }
    
    /// @notice allows spouses to use the deposit account for payments
    function pay(address payable _address, uint amount) public payable onlySpouses {
        require(amount <= accounts["joined"], "There are not enough funds to proceed with transaction");
        
        accounts["joined"] -= amount;
        // we make sure the sum of the joined and savings accounts is equal to the total sum
        assert(accounts["joined"] + accounts["savings"] == address(this).balance);
        // we transfer the money to the provided address
        _address.transfer(amount);
        // we log the new balance
        emit LogBalance(address(this).balance, accounts["joined"], accounts["savings"]);
    }
    
    /// @notice fallback function to send money directly, money stored in deposit account by default
    function() external payable {
        accounts["joined"] += msg.value;
    }
    
    function closeCertificate() public onlySpouses {
        // we cast spouses' addresses to payable addresses
        address payable _spouse1address = address(uint160(spousesAddresses[0]));
        address payable _spouse2address = address(uint160(spousesAddresses[1]));
        // we transfer half the balance to each spouse
        _spouse1address.transfer(address(this).balance/2);
        _spouse2address.transfer(address(this).balance);
        // we destruct the contract and send the remaining weis to the spouse who created the contract
        selfdestruct(_spouse1address);
    }

    /// @dev compares two strings
    function stringsAreEqual(bytes32 str1, bytes32 str2) pure private returns (bool) {
        return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
    }
}