// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/// @title Escrow contract to exchange ERC721 NFTs
/// @author Mareike Kuehn
/// @notice Safely exchange a set of ERC721 NFTs with a partner. 
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
    //require(_partner[msg.sender] != address(0));
    require(hasBasket());
    _;
  }

  /// @notice Check if caller already has a basket to exchange NFTs
  /// @dev Using msg.sender for check (not tx.origin)
  /// @return True, if the function caller already has a basket, else False
  function hasBasket() public view returns (bool) {
    return (_partner[msg.sender] != address(0));
  }

  /// @notice Create baskets for two addresses to exchange NFTs
  /// @param owner1 Address of participant 1
  /// @param owner2 Address of participant 2
  function createBaskets(address owner1, address owner2) public {
    require(_partner[owner1] == address(0),
    "Owner1 has already a basket.");
    require(_partner[owner2] == address(0),
    "Owner2 has already a basket.");
    _partner[owner1] = owner2;
    _partner[owner2] = owner1;
    _clearBasketFor(owner1);
    _clearBasketFor(owner2);

    emit createdBasket();
  }

  /// @notice Deposit an NFT (ERC721) in callers basket. Approve contract for this token before.
  /// @param tokenAddress Address of contract of token
  /// @param tokenID ID of the token
  function deposit(address tokenAddress, uint256 tokenID) 
  public 
  isBasketOwner
  {
    _clearAgrees();

    ERC721 erc271 = ERC721(tokenAddress);
    require(erc271.ownerOf(tokenID) == msg.sender, 
    "Caller is not Onwer of specified token.");

    require(erc271.getApproved(tokenID) == address(this), 
    "Escrow is not approved for specified token.");

    erc271.safeTransferFrom(msg.sender, address(this), tokenID);

    require(erc271.ownerOf(tokenID) == address(this),
    "Failed to transfer token to Escrow Contract.");

    _baskets[msg.sender].push(NftData({
      tokenAddress: tokenAddress,
      tokenID: tokenID
    }));
    emit successfulDeposit(msg.sender, tokenAddress, tokenID);
  }
  
  /// @notice Cancel this exchange. Will Return all NFTs to previous owners.
  function cancel() public 
  isBasketOwner
  {
    address partner = _partner[msg.sender];
    _transferAfterCancel(msg.sender, partner);
    emit successfulCancel(msg.sender, partner);
  }

  /// @notice Agree to exchange tokens. If both user agree, tokens will be transfered to their new owner.
  function agree() public 
  isBasketOwner
  {
    _agreed[msg.sender] = true;
    emit setAgreed(msg.sender);
    address partner = _partner[msg.sender];
    if (_agreed[partner]) {
      _transferAfterAgree(msg.sender, partner);
    }
  }

  /// @notice View an item in callers basket
  /// @dev returns 0 for id and address if item doesn't exist
  /// @param item index of item to view
  /// @return tokenAddress Adress of the deposited token 
  /// @return tokenID ID of the deposited token
  function viewMyBasket(uint item) public view 
  isBasketOwner
  returns (address tokenAddress, uint256 tokenID) 
  {
    return _viewBasketFromAddress(msg.sender, item);
  }

  /// @notice View an item in caller partners basket
  /// @dev returns 0 for id and address if item doesn't exist
  /// @param item index of item to view
  /// @return tokenAddress Adress of the deposited token 
  /// @return tokenID ID of the deposited token
  function viewPartnerBasket(uint item) public view 
  isBasketOwner
  returns (address tokenAddress, uint256 tokenID) 
  {
    return _viewBasketFromAddress(_partner[msg.sender], item);
  }

  /// @notice Get number of deposited tokens for caller and partner
  /// @return nrTokensCaller number of tokens the caller deposited 
  /// @return nrTokensParter number of tokens the callers partner deposited 
  function viewNumberOfDepositedTokens() public view 
  isBasketOwner
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

  /// @notice View the sate of ongoing callers transaction
  /// @return owner1 address of caller
  /// @return owner2 address of callers partner
  /// @return agree1 True, if caller agreed to exchange tokens, else False
  /// @return agree2 True, if partner agreed to exchange tokens, else False
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
      "Failed to transfer token.");
    }
  }

  function _transferAfterAgree(address caller, address partner) 
  internal 
  {
    _removeBasketOwnerships();
    _clearAgrees();
    _transferAllTokens(caller, partner);
    _transferAllTokens(partner, caller);

  }

  function _transferAfterCancel(address caller, address partner) 
  internal 
  {
    _removeBasketOwnerships();
    _clearAgrees();
    _transferAllTokens(caller, caller);
    _transferAllTokens(partner, partner);

  }

  function _removeBasketOwnerships() internal {
    address partner = _partner[msg.sender];
    _partner[msg.sender] = address(0);
    _partner[partner] = address(0);
    require(_partner[msg.sender] == address(0), "Failed to remove ownership of partner.");
    require(_partner[partner] == address(0), "Failed to remove ownership of caller.");
  }

  function _clearAgrees() internal {
    _agreed[msg.sender] = false;
    _agreed[_partner[msg.sender]] = false;
    require(!_agreed[msg.sender] && !_agreed[_partner[msg.sender]], 
    "Invalidating previous Agreements failed.");
  }

  function _clearBasketFor(address addr) 
  internal 
  {
    _baskets[addr] = emptyNftDataArray;
  }
}
