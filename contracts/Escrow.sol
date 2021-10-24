// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Escrow {
  constructor(address owner1, address owner2) public {
    // make baskets for 2 parties
  }

  modifier isBasketOwner() {
    // check if msg.sende owns one of the baskest
    _;
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

  function swapBaskets() internal {
    // swap routine, internal function
  }
}
