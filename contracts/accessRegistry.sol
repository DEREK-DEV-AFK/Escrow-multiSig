pragma solidity ^0.8.0; //SPDX-License-Identifier: UNLICENSED

/**
 *    Here owner refers to `Owner` refers to owner of the contract.
 *    & `Partner` refers to new member of multi sig wallet.
 */
contract accessRegistry {
    address payable public seller;
    bool isPausedForAll; // 1 bytes

    struct partnerInfo {
        bool isPartner;
        bool hasVoted;
    }

    mapping(address => partnerInfo) isPartner;
    address[] partners;

    // event for announcing new contract owner
    event ContractOwnerChange(address indexed currentOwner,address indexed newOwner);

    // event for announcing new partner
    event newPartner(address indexed newPartner);

     /**
     * @dev assigning _seller address to owner
     */
    constructor (address payable _seller) {
        seller = _seller; 
        isPartner[_seller].isPartner = true; 
        partners.push(_seller);
    }

     // to check address is owner or not
    modifier onlyContractOwner() {
        require(msg.sender == seller,"only owner can access this function !");
        _;
    }

    // to check address is partner or not
    modifier onlyPartners() {
        require(isPartner[msg.sender].isPartner,"caller is not an partner !!");
        _;
    }

    // to check that owner has paused or not
    modifier hasNotPaused() {
        require(!isPausedForAll,"owner has paused the access");
        _;
    }

    /**
     * @dev to get the current owner
     */
    function getContractOwner() public view returns(address){
        return seller;
    }

    /**
     * @dev to check address is partner or not
     * @param user to check
     */
    function isPartnerOrNot(address user) public view returns(bool){
        require(user != address(0),"invalid address");
        return isPartner[user].isPartner;
    }

    /**
     *@dev to assign new owner
     * @param newOwner address of new owner
     */
    function setContractOwner(address payable newOwner) external onlyContractOwner {
        require(newOwner != address(0),"invalid address");
        emit ContractOwnerChange(msg.sender, newOwner);
        seller = newOwner;
    }

    /**
     * @dev to pause access of partners
     */
    function pauseAllPartners() external onlyContractOwner {
        isPausedForAll = true;
    }

    /**
     * @dev to unpause access of partners
     */
    function unpauseAllPartners() external onlyContractOwner {
        isPausedForAll = false;
    }

}