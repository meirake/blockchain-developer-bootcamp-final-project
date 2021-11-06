let Escrow = artifacts.require("Escrow");
let TestNFTs = artifacts.require("TestNFTs");
let { catchRevert } = require("./exceptionsHelpers.js");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Escrow", function (accounts) {
  const nrNfts = 10;
  const [_owner, harry, ron, draco] = accounts;
  var harrysNfts = [];
  var ronsNfts = [];

  let NFTs;
  let nftAddress;

  let testee;

  before(async () => {
    NFTs = await TestNFTs.deployed();
    nftAddress = NFTs.address;

    for (let i = 0; i < nrNfts; ++i) {
      await NFTs.mintTestNFT({from: harry});
      const harrysNft = await NFTs.getLastTokenID.call();
      harrysNfts.push(harrysNft.toNumber());

      await NFTs.mintTestNFT({from: ron});
      const ronsNft = await NFTs.getLastTokenID.call();
      ronsNfts.push(ronsNft.toNumber());
    }
    // console.log(ronsNfts);
  });

  beforeEach(async () => {
    testee = await Escrow.new();
  });

  describe("Test Preparation", () => {
    it("Each participant has correct number of NFTs", async () => {
      assert.equal(harrysNfts.length, nrNfts, 
        "Didn't mint correctly for Harry.");
      assert.equal(ronsNfts.length, nrNfts, 
        "Didn't mint correctly for Ron.");
    });
  });

  describe("Create Baskets", () => {
    it("can create a basket", async () => {
      const tx = await testee.createBaskets(harry, ron, {from: harry});
      //console.log(tx);
      assert.equal(tx.logs[0].event, "createdBasket");
    });
    it("cannot create 2nd baskets", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      await catchRevert(testee.createBaskets(ron, harry, {from: ron}));
    });
  });
});
