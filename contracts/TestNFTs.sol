// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestNFTs is ERC721 {
  uint256 private tokenID;

  constructor() ERC721("TestNFTs", "TestNFT") {}

  function mintTestNFT() public {
    _safeMint(msg.sender, tokenID);
    tokenID++;
  }

  function getLastTokenID() public view returns (uint256) {
    require(tokenID > 0, "Nothing minted, yet.");
    return tokenID - 1;
  }
}
