// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Escrow {

  struct NftData {
    address tokenAddress; 
    uint256 tokenID; 
  }

  struct State {
    address owner1;
    address owner2;
    bool agreed1;
    bool agreed2; 
  }

  mapping(address => State) private _states;
  mapping(address => NftData[]) private _baskets;

  event createdBasket();
  event successfulDeposit(
    address indexed owner,
    address indexed tokenAddress,
    uint256 indexed tokenID);

  modifier isBasketOwner() {
    require(_states[msg.sender].owner1 != address(0));
    _;
  }

  function createBaskets(address owner1, address owner2) public {
    require(_states[owner1].owner1 == address(0),
    "Owner1 has already a basket.");
    require(_states[owner2].owner1 == address(0),
    "Owner2 has already a basket.");
    _states[owner1].owner1 = owner1;
    _states[owner1].owner2 = owner2;
    _states[owner2] = _states[owner1];

    emit createdBasket();
  }

  function deposit(address tokenAddress, uint256 tokenID) 
  public 
  isBasketOwner()
  {
    // check if token is tranfer to Escrow was successful?
    // make contract owner of token -> React app will do?!
    _states[msg.sender].agreed1 = false;
    _states[msg.sender].agreed2 = false;
    require(!_states[msg.sender].agreed1 && !_states[msg.sender].agreed2);
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
  }

  function agree() public {
    // check if msg.sender owns one of the baskets
    // log agreement
    // if both basket owners are currently agreeing:
    // -> start basket swap routine 
  }

  function viewBaskets() public view {
    // check if msg sender is one of the owner? (useless, every body can view internal state)
    // show content of both baskets (in a nice way)
  }

  function viewState() public view 
  returns (address owner1, address owner2, bool agree1, bool agree2){
    owner1 = _states[msg.sender].owner1;
    owner2 = _states[msg.sender].owner2;
    agree1 = _states[msg.sender].agreed1;
    agree2 = _states[msg.sender].agreed2;
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
