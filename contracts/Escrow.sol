// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract Escrow is ERC721Holder {

  struct NftData {
    address tokenAddress; 
    uint256 tokenID; 
  }

  NftData[] private emptyNftDataArray;
  mapping(address => address) private _partner;
  mapping(address => NftData[]) private _baskets;
  mapping(address => bool) private _agreed;

  event createdBasket();
  event successfulDeposit(
    address indexed owner,
    address indexed tokenAddress,
    uint256 indexed tokenID);
  event setAgreed(address indexed owner);
  event successfulCancel(address indexed caller, address indexed partner);

  modifier isBasketOwner() {
    require(_partner[msg.sender] != address(0));
    _;
  }

  function createBaskets(address owner1, address owner2) public {
    require(_partner[owner1] == address(0),
    "Owner1 has already a basket.");
    require(_partner[owner2] == address(0),
    "Owner2 has already a basket.");
    _partner[owner1] = owner2;
    _partner[owner2] = owner1;

    emit createdBasket();
  }

  function deposit(address tokenAddress, uint256 tokenID) 
  public 
  isBasketOwner()
  {
    ERC721 erc271 = ERC721(tokenAddress);
    require(erc271.ownerOf(tokenID) == msg.sender, 
    "Caller is not Onwer of specified token.");

    require(erc271.getApproved(tokenID) == address(this), 
    "Escrow is not approved for specified token.");

    erc271.safeTransferFrom(msg.sender, address(this), tokenID);

    require(erc271.ownerOf(tokenID) == address(this),
    "Failed to transfer token to Escrow Contract.");

    _agreed[msg.sender] = false;
    _agreed[_partner[msg.sender]] = false;
    require(!_agreed[msg.sender] && !_agreed[_partner[msg.sender]], 
    "Invalidating previous Agreements failed.");
    _baskets[msg.sender].push(NftData({
      tokenAddress: tokenAddress,
      tokenID: tokenID
    }));
    emit successfulDeposit(msg.sender, tokenAddress, tokenID);
  }
  
  function cancel() public 
  isBasketOwner()
  {
    address partner = _partner[msg.sender];
    _transferAllTokens(msg.sender, msg.sender);
    _transferAllTokens(partner, partner);
    _clearFor(msg.sender);
    _clearFor(partner);
    emit successfulCancel(msg.sender, partner);
  }

  function agree() public 
  isBasketOwner() 
  {
    _agreed[msg.sender] = true;
    emit setAgreed(msg.sender);
    address partner = _partner[msg.sender];
    if (_agreed[partner]) {
      _transferAllTokens(msg.sender, partner);
      _transferAllTokens(partner, msg.sender);
      _clearFor(msg.sender);
      _clearFor(partner);
    }
  }

  function viewMyBasket(uint item) public view 
  isBasketOwner()
  returns (address tokenAddress, uint256 tokenID) 
  {
    return _viewBasketFromAddress(msg.sender, item);
  }

  function viewPartnerBasket(uint item) public view 
  isBasketOwner()
  returns (address tokenAddress, uint256 tokenID) 
  {
    return _viewBasketFromAddress(_partner[msg.sender], item);
  }

  function viewNumberOfDepositedTokens() public view 
  isBasketOwner()
  returns (uint nrTokensCaller, uint nrTokensParter) 
  {
    nrTokensCaller = _baskets[msg.sender].length;
    nrTokensParter = _baskets[_partner[msg.sender]].length;
  }

  function _viewBasketFromAddress(address addr, uint item) internal view
  returns (address tokenAddress, uint256 tokenID) 
  {
    if (item < _baskets[addr].length) {
      tokenAddress = _baskets[addr][item].tokenAddress;
      tokenID = _baskets[addr][item].tokenID;
    } else {
      tokenAddress = address(0);
      tokenID = 0;
    }}

  function viewState() public view 
  returns (address owner1, address owner2, bool agree1, bool agree2){
    if (_partner[msg.sender] == address(0)) {
      owner1 = address(0);
      owner2 = address(0);
      agree1 = false;
      agree2 = false;
    } else {
      owner1 = msg.sender;
      owner2 = _partner[msg.sender];
      agree1 = _agreed[msg.sender];
      agree2 = _agreed[owner2];
    }
  }

  function _transferAllTokens(address toAddress, address basketAddress) 
  internal 
  {
    for (uint i = 0; i < _baskets[basketAddress].length; ++i) {
      address tokenAddress = _baskets[basketAddress][i].tokenAddress;
      uint256 tokenID = _baskets[basketAddress][i].tokenID;
      ERC721 erc271 = ERC721(tokenAddress);
      require(erc271.ownerOf(tokenID) == address(this), 
      "Contract is not Onwer of specified token.");
      erc271.safeTransferFrom(address(this), toAddress, tokenID);
      require(erc271.ownerOf(tokenID) == toAddress,
      "Failed to transfer token to Escrow Contract.");
    }
  }

  function _clearFor(address addr) 
  internal 
  {
    _baskets[addr] = emptyNftDataArray;
    _partner[addr] = address(0);
    _agreed[addr] = false;
  }
}
