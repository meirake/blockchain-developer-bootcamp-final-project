// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Escrow {

  struct NftData {
    address tokenAddress; 
    uint256 tokenID; 
  }

  mapping(address => address) private _partner;
  mapping(address => NftData[]) private _baskets;
  mapping(address => bool) private _agreed;

  event createdBasket();
  event successfulDeposit(
    address indexed owner,
    address indexed tokenAddress,
    uint256 indexed tokenID);
  event setAgreed(address indexed owner);

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
    // check if token is tranfer to Escrow was successful?
    // make contract owner of token -> React app will do?!
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

  function withdraw() public {
    // check if msg.sender owns one of the baskets
    // if yes, invalidate previous agreements and
    // return all tokens that are in senders basket
    _agreed[msg.sender] = false;
    _agreed[_partner[msg.sender]] = false;
  }

  function agree() public 
  isBasketOwner() 
  {
    // if both basket owners are currently agreeing:
    // -> start basket swap routine 
    _agreed[msg.sender] = true;

    emit setAgreed(msg.sender);
  }

  function viewBaskets() public view {
    // check if msg sender is one of the owner? (useless, every body can view internal state)
    // show content of both baskets (in a nice way)
  }

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

  function _swapBaskets() internal {
    // swap routine, internal function
    // make opposite owner to token owner
  }

  function _getNFT(NftData memory nftData) internal {
    //ck_contract = w3.eth.contract(address=w3.toChecksumAddress(ck_token_addr)
    // ABI missing? 
    // return what?
  }
}
