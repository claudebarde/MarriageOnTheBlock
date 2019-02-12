pragma solidity ^0.5.0;

contract MarriageCertificateCreator {
    MarriageCertificate[] public certificates;
    address public owner;
    uint public certificateFee;
    string[3] public lastMarriage;
    
    constructor() public {
        owner = msg.sender;
        certificateFee = 100000000000000000 wei;
    }
    
    event NewCertificateCreated(MarriageCertificate newCertificateAddress, uint numberOfCertificates);
    
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
        emit NewCertificateCreated(newCertificate, certificates.length);
    }
    
    /// @dev owner of contract can update the required fee to create a new certificate
    function updateFee(uint newFee) public {
        require(msg.sender == owner, "You are not allowed to perform this action");
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
    
    function withdraw() public {
        require(msg.sender == owner, "You are not allowed to perform this action");
        msg.sender.transfer(address(this).balance);
    }
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
    mapping(uint => withdrawRequestFromSavings) withdrawRequests;
    
    event MarriageValidity(bool[2] validity);
    event NewWithdrawalRequestFromSavings(uint request);
    
    /** 
        @dev function is called every time someone wants to register a new marriage certificate
        @param certificateCreator =  spouse who initiated the contract
        @param newSpouse1 =  holds JSON string with first spouse details
        @param newSpouse2 =  holds JSON string with second spouse details
        @param spouse2address = keeps second spouse address for validation purposes
        @param newLocation =  holds JSON string with location details
    **/
    constructor(
        address certificateCreator, 
        string memory newSpouse1, 
        string memory newSpouse2,
        address spouse2address, 
        string memory newLocation) public {
        require(certificateCreator != spouse2address, "Spouses' addresses cannot be the same!");
        location = newLocation;
        spouse1 = newSpouse1;
        spouse2 = newSpouse2;
        isValid = [true, false];
        spousesAddresses = [certificateCreator, spouse2address];
        timestamp = now;
        accounts["joint"] = 0;
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
        return (address(this).balance, accounts["joint"], accounts["savings"]);
    }
    
    /// @notice allows spouses to change contract state
    function changeMarriageStatus() public onlySpouses {
        if(msg.sender == spousesAddresses[0]){
            isValid[0] = !isValid[0];
        } else if(msg.sender == spousesAddresses[1]){
            isValid[1] = !isValid[1];
        }
        
        emit MarriageValidity(isValid);
    }
    
    /// @notice allows spouses or third parties to deposit money in marriage contract
    function deposit(uint amount, string memory account) public payable {
        // we check the amount sent is the amount required
        require(msg.value == amount, "Wrong amount sent!");
        // we update the balance according to the account type selected
        if(keccak256(abi.encodePacked(account)) == keccak256(abi.encodePacked("joint"))) {
            accounts["joint"] = accounts["joint"] + amount;
        } else if(keccak256(abi.encodePacked(account)) == keccak256(abi.encodePacked("savings"))) {
            accounts["savings"] = accounts["savings"] + amount;
        }
    }
    
    /// @notice allows spouses to withdraw money from the account
    function withdraw(uint amount, string memory account) public onlySpouses {
        // requested amount cannot exceed total balance of account
        if(amount < address(this).balance) {
            // we check if the balance is sufficient for the withdrawal from the joint account
            if(keccak256(abi.encodePacked(account)) == keccak256(abi.encodePacked("joint")) && 
                accounts["joint"] > amount) {
                msg.sender.transfer(amount);
            } else if(keccak256(abi.encodePacked(account)) == keccak256(abi.encodePacked("savings")) && 
                accounts["savings"] > amount) {
                // we create a request that the second spouse must approve in order to allow the transfer
                withdrawRequestFromSavings memory newRequest = withdrawRequestFromSavings({
                    sender: msg.sender,
                    amount: amount,
                    timestamp: now,
                    approved: false
                });
                // we emit the new request with id number that will help find it in requests mapping
                uint requestID = uint(keccak256(abi.encodePacked(msg.sender, amount, now)));
                emit NewWithdrawalRequestFromSavings(requestID);
                // we save the new request in requests mapping
                withdrawRequests[requestID] = newRequest;
            }
        } else {
            revert();
        }
    }
    
    /// @dev returns details about withdrawal request
    function checkWithdrawRequest(uint requestID) public onlySpouses view returns (address, uint, uint, bool) {
        withdrawRequestFromSavings memory request = withdrawRequests[requestID];
        return (request.sender, request.amount, request.timestamp, request.approved);
    }
    
    /** @notice allows spouse to accept withdrawal request from savings
     *          and sends money to the account that created the request
    **/
    function approveWithdrawRequestFromSavings(uint requestID) public onlySpouses {
        withdrawRequestFromSavings storage request = withdrawRequests[requestID];
        // the request cannot have been approved before
        if(request.approved == false) {
            // the spouse approving the request cannot be the one who initiated it
            if((spousesAddresses[0] == msg.sender && spousesAddresses[1] == request.sender) || 
            (spousesAddresses[1] == msg.sender && spousesAddresses[0] == request.sender)) {
                // mark the request as approved
                request.approved = true;
                // deduct amount from accounts mapping
                accounts["savings"] = accounts["savings"] - request.amount;
                // we transfer the money
                request.sender.transfer(request.amount);
            } else {
            revert();
            }
        } else {
            revert();
        }
    }
    
    /// @notice fallback function to send money directly, money stored in deposit account by default
    function() external payable {
        accounts["deposit"] = accounts["deposit"] + msg.value;
    }
}