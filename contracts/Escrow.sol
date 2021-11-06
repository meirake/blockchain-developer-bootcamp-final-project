// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Escrow {

  struct NftData {
    address tokenAddress; 
    uint256 tokenIDd; 
  }

  struct State {
    address owner1;
    address owner2;
    NftData[] basket1;  // where is it stored?
    NftData[] basket2;
    bool agreed1;
    bool agreed2; 
  }

  mapping(address => State) private _states;

  event createdBasket();

  modifier isBasketOwner() {
    // check if msg.sende owns one of the baskest
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

  function deposit(address token) public payable {
    // check if msg.sender owns one of the baskets
    // check if token is actually owned by sender?
    // if yes, invalidate previous agreements and
    // transfer token to the coresponding basket
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
    //
  }

  function _swapBaskets() internal {
    // swap routine, internal function
  }

  function _getNFT(NftData memory nftData) internal {
    //ck_contract = w3.eth.contract(address=w3.toChecksumAddress(ck_token_addr)
    // ABI missing? 
    // return what?
  }
}
