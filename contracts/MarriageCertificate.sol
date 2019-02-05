pragma solidity ^0.5.0;

contract MarriageCertificate {
    /// @title Contract allows people to get married on the blockchain!
    /// @author Claude Barde 
    address public owner;
    uint public certificateFee;
    uint public certificateTotal;
    
    /// @dev stores all certificates
    mapping(bytes32 => Certificate) certificates;
    
    /// @dev struct for marriage certificate info
    struct Certificate {
        bytes32 id;
        string country;
        string city;
        uint creationTime;
        Spouse spouse1;
        Spouse spouse2;
        bool[2] validated;
    }
    
    /// @dev struct for spouse info
    struct Spouse {
        address spouseAddress;
        string spouseID;
        string spouseFirstName;
        string spouseLastName;
    }
    
    constructor() public {
        owner = msg.sender;
        certificateFee = 0.21 ether;
        certificateTotal = 0;
    }
    
    /// @dev function is called every time someone wants to register a new marriage certificate
    /// @param firstName = first name of the spouse initiating the certificate
    /// @param lastName = last name of the spouse initiating the certificate
    /// @param id = id provided by spouse initiating the certificate
    /// @param country = country where the marriage is registered
    /// @param city = city where the marriage is registered
    /// @param otherSpouseAddress = address of other spouse from which the confirmation has to come
    /// @param otherSpouseFirstName = first name of the other spouse
    /// @param otherSpouseLastName = last name of the other spouse
    /// @param otherSpouseID = ID of the other spouse
    function createNewCertificate(
        string memory firstName, 
        string memory lastName, 
        string memory id, 
        string memory country, 
        string memory city, 
        address otherSpouseAddress,
        string memory otherSpouseFirstName,
        string memory otherSpouseLastName,
        string memory otherSpouseID) public payable returns (bytes32) {
        require(msg.value >= certificateFee, "Invalid certificate fee");
        /// @notice creates struct with info from first spouse initiating the certificate
        Spouse memory spouse1 = Spouse({
            spouseAddress: msg.sender,
            spouseID: id,
            spouseFirstName: firstName,
            spouseLastName: lastName
        });
        
        /// @notice creates struct with info from first spouse about the second spouse
        Spouse memory spouse2 = Spouse({
            spouseAddress: otherSpouseAddress,
            spouseID: otherSpouseID,
            spouseFirstName: otherSpouseFirstName,
            spouseLastName: otherSpouseLastName
        });
        
        /// @notice creates new certificate
        bytes32 certificateID = keccak256(abi.encodePacked(firstName, lastName, id, country, city, otherSpouseAddress));
        Certificate memory c = Certificate({
            id: certificateID,
            country: country,
            city: city,
            creationTime: now,
            spouse1: spouse1,
            spouse2: spouse2,
            validated: [true, false]
        });
        
        // pushes new certificate into certificates mapping
        certificates[certificateID] = c;
        
        // increment variable to keep track of certificate number
        certificateTotal++;
        
        return certificateID;
    }
    
    /// @notice returns one certificate information
    /// @param key is the certificate id
    function getCertificateInfo(bytes32 key) public view returns (bytes32, string memory, string memory, uint, bool[2] memory) {
        Certificate memory c = certificates[key];
        return (c.id, c.country, c.city, c.creationTime, c.validated);
    }
    
    /// @notice returns certificate information about spouse1
    /// @param key is the certificate id
    function getSpouse1Info(bytes32 key) public view returns (address, string memory, string memory, string memory) {
        Certificate memory c = certificates[key];
        return(c.spouse1.spouseAddress, c.spouse1.spouseID, c.spouse1.spouseFirstName, c.spouse1.spouseLastName);
    }
    
    /// @notice returns certificate information about spouse2
    /// @param key is the certificate id
    function getSpouse2Info(bytes32 key) public view returns (address, string memory, string memory, string memory) {
        Certificate memory c = certificates[key];
        return(c.spouse2.spouseAddress, c.spouse2.spouseID, c.spouse2.spouseFirstName, c.spouse2.spouseLastName);
    }
    
    /// @notice 2nd spouse confirms the marriage certificate and makes it valid
    /// @param key is the certificate id
    function confirmMarriage(bytes32 key) public {
        Certificate memory c = certificates[key];
        // checks if 2nd spouse is confirming the certificate
        require(msg.sender == c.spouse2.spouseAddress, "The second spouse registered in the certificate must be the one validating it!");
        
        // we update the value
        c.validated = [true, true];
        // we modify the certificate
        certificates[key] = c;
    }
    
    // returns contract balance
    function returnBalance() public view returns (uint) {
        return address(this).balance;
    }
}