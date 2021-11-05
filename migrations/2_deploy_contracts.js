var TestNFTs = artifacts.require("./TestNFTs.sol");
var Escrow = artifacts.require("./Escrow.sol");

module.exports = function(deployer) {
  deployer.deploy(TestNFTs);
  deployer.deploy(Escrow);
};
