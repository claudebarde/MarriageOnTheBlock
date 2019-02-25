pragma solidity ^0.5.0;

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
        
        emit MarriageValidity(isValid);
    }
    
    /// @notice allows spouses or third parties to deposit money in marriage contract
    function deposit(uint amount, string memory account) public payable onlySpouses {
        // we check the amount sent is the amount required
        require(msg.value == amount, "Wrong amount sent!");
        // we update the balance according to the account type selected
        if(stringsAreEqual(account, "joined")) {
            accounts["joined"] = accounts["joined"] + amount;
        } else if(stringsAreEqual(account, "savings")) {
            accounts["savings"] = accounts["savings"] + amount;
        } else {
            revert("This is not a valid account.");
        }
        // we make sure the sum of the joined and savings accounts is equal to the total sum
        assert(accounts["joined"] + accounts["savings"] == address(this).balance);
    }
    
    /// @notice allows spouses to withdraw money from the account
    function withdraw(uint amount, string memory account) public onlySpouses {
        // requested amount cannot exceed total balance of account
        if(amount < address(this).balance) {
            // we check if the balance is sufficient for the withdrawal from the joined account
            if(stringsAreEqual(account, "joined") && 
                accounts["joined"] > amount) {
                // we substract the amount from the joined account amount
                accounts["joined"] = accounts["joined"] - amount;
                // we send the money
                msg.sender.transfer(amount);
            } else if(stringsAreEqual(account, "savings") && 
                accounts["savings"] > amount) {
                // we create a request that the second spouse must approve in order to allow the transfer
                withdrawRequestFromSavings memory newRequest = withdrawRequestFromSavings({
                    sender: msg.sender,
                    amount: amount,
                    timestamp: now,
                    approved: false
                });
                // we emit the new request with id number that will help find it in requests mapping
                uint requestID = uint(keccak256(abi.encodePacked(msg.sender, amount, now, block.difficulty)));
                emit NewWithdrawalRequestFromSavings(requestID);
                // we save the new request in requests mapping
                withdrawRequests[requestID] = newRequest;
            } else {
                revert("Invalid account or requested amount exceeds available balance.");
            }
            // we make sure the sum of the joined and savings accounts is equal to the total sum
            assert(accounts["joined"] + accounts["savings"] == address(this).balance);
        } else {
            revert("The amount you are trying to withdraw exceeds the total balance of the account.");
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
            revert("The request cannot be approved by the same person who created it!");
            }
        } else {
            revert("This request has already been approved!");
        }
    }
    
    /// @notice fallback function to send money directly, money stored in deposit account by default
    function() external payable {
        accounts["deposit"] = accounts["deposit"] + msg.value;
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
    function stringsAreEqual(string memory str1, string memory str2) pure private returns (bool) {
        return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
    }
}