let Escrow = artifacts.require("Escrow");
let TestNFTs = artifacts.require("TestNFTs");
let { catchRevert } = require("./exceptionsHelpers.js");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Escrow", function (accounts) {
  const [_owner, harry, ron, draco] = accounts;

  const emptyAddress = "0x0000000000000000000000000000000000000000";

  const defaultTokenID = 0;
  let NFTs;
  let nftAddress;

  let testee;

  before(async () => {
    NFTs = await TestNFTs.deployed();
    nftAddress = NFTs.address;
  });

  async function getNftHarry() {
      await NFTs.mintTestNFT({from: harry});
      const harrysNft = await NFTs.getLastTokenID.call();
      return harrysNft.toNumber();
  }

  async function getNftHarryApproved() {
    const tokenID = await getNftHarry();
    await NFTs.approve(testee.address, tokenID, {from: harry});
    return tokenID;
  }

  async function getNftRon() {
      await NFTs.mintTestNFT({from: ron});
      const harrysNft = await NFTs.getLastTokenID.call();
      return harrysNft.toNumber();
  }

  async function getNftRonApproved() {
    const tokenID = await getNftRon();
    await NFTs.approve(testee.address, tokenID, {from: ron});
    return tokenID;
  }

  beforeEach(async () => {
    testee = await Escrow.new();
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
      await catchRevert(testee.createBaskets(harry, ron, {from: harry}));
    });
  });

  describe("Check if address has basket", () => {
    it("has no basket", async () => {
      const hasBasket = await testee.hasBasket.call({from: harry});
      assert.isFalse(hasBasket, "Returned True although Harry has no basket.")
    });
    it("has basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const hasBasketH = await testee.hasBasket.call({from: harry});
      assert.isTrue(hasBasketH, "Returned False although Harry has a basket.")
      const hasBasketR = await testee.hasBasket.call({from: ron});
      assert.isTrue(hasBasketR, "Returned False although Ron has a basket.")
    });
  });

  describe("View State", () => {
    it("Get correct data for existing State", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const result = await testee.viewState.call({from: harry});
      assert.equal(result[0], harry, "Owner1 is not harry.");
      assert.equal(result[1], ron, "Owner2 is not Ron.");
      assert.isFalse(result[2], "Agree1 is not False.");
      assert.isFalse(result[3], "Agree2 is not False.");
    });
    it("Get empty state for caller without basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const result = await testee.viewState.call({from: draco});
      assert.equal(result[0], emptyAddress, "Owner1 is not 0x0.");
      assert.equal(result[1], emptyAddress, "Owner2 is not 0x0.");
      assert.isFalse(result[2], "Agree1 is not False.");
      assert.isFalse(result[3], "Agree2 is not False.")
    });
  });

  describe("Deposit", () => {
    it("Correct deposition for existing basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const hTokenID = await getNftHarryApproved();
      const txH = await testee.deposit(nftAddress, hTokenID, {from: harry});
      assert.equal(txH.logs[0].event, "successfulDeposit", 
      "Expected successfullDeposit Event for Harry");
      const rTokenID = await getNftRonApproved();
      const txR = await testee.deposit(nftAddress, rTokenID, {from: ron});
      assert.equal(txR.logs[0].event, "successfulDeposit", 
      "Expected successfullDeposit Event for Ron");
      const harryTokenOwner = await NFTs.ownerOf(hTokenID);
      assert.equal(harryTokenOwner, testee.address, 
        "Token is not property of Escrow contract (Harry).");
      const ronTokenOwner = await NFTs.ownerOf(rTokenID);
      assert.equal(ronTokenOwner, testee.address, 
        "Token is not property of Escrow contract (Ron).")
    });
    it("Cannot deposit without basket", async () => {
      const tokenID = await getNftHarryApproved();
      await catchRevert(testee.deposit(nftAddress, tokenID, {from: harry}));
    });
    it("Cannot deposit NFT that is not mine", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const tokenID = await getNftHarryApproved();
      await catchRevert(testee.deposit(nftAddress, tokenID, {from: ron}));
    });
    it("Cannot deposit NFT that is not approved", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const tokenID = await getNftHarry();
      await catchRevert(testee.deposit(nftAddress, tokenID, {from: harry}));
    });
  });

  describe("Agree", () => {
    it("Proper use of agree", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const tx = await testee.agree({from: ron});
      const result = await testee.viewState.call({from: ron});
      assert.isTrue(result[2], "Agree1 is not true (Ron's agreement).");
      assert.isFalse(result[3], "Agree2 is not false (Harry's agreement).");
      assert.equal(tx.logs[0].event, "setAgreed");
    });
    it("Agree without basket fails", async () => {
      await catchRevert(testee.agree({from: draco}));
    }) 
    it("Invalidate agreement after deposit", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      for (const account of [harry, ron]) {
        let tokenID;
        if (account == harry) {
          tokenID = await getNftHarryApproved();
        } else {
          tokenID = await getNftRonApproved();
        }
        await testee.agree({from: harry});
        const agreeBefore = await testee.viewState.call({from: ron});
        assert.isTrue(agreeBefore[3], "Agree2 (Harry) is not True.");
        await testee.deposit(nftAddress, tokenID, {from: account});
        const agreeAfter = await testee.viewState.call({from: ron});
        assert.isFalse(agreeAfter[3], "Agree2 (Harry) is not False.");
      }
    })
  });

  describe("View Baskets", () => {
    it("View own basket, valid index", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const tokenID = await getNftHarryApproved();
      await testee.deposit(nftAddress, tokenID, {from: harry});
      const result = await testee.viewMyBasket.call(0, {from: harry});
      assert.equal(result[0], nftAddress, "Returned wrong address.");
      assert.equal(result[1], tokenID, "Returned wrong Index");
    });
    it("View own basket, invalid index", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const result = await testee.viewMyBasket.call(71, {from: harry});
      assert.equal(result[0], emptyAddress, "Returned wrong address.");
      assert.equal(result[1], defaultTokenID, "Returned wrong Index");
    });
    it("View partner basket, valid index", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const tokenID = await getNftRonApproved();
      await testee.deposit(nftAddress, tokenID, {from: ron});
      const result = await testee.viewPartnerBasket.call(0, {from: harry});
      assert.equal(result[0], nftAddress, "Returned wrong address.");
      assert.equal(result[1], tokenID, "Returned wrong Index");
    });
    it("View partner basket, invalid index", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const result = await testee.viewPartnerBasket.call(71, {from: harry});
      assert.equal(result[0], emptyAddress, "Returned wrong address.");
      assert.equal(result[1], defaultTokenID, "Returned wrong Index");
    });
    it("Has no basket, view own basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      await catchRevert(testee.viewMyBasket.call(1, {from: draco}));
    });
    it("Has no basket, view partner basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      await catchRevert(testee.viewPartnerBasket.call(1, {from: draco}));
    });
    it("Check number of tokens in basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const tokenID = await getNftRonApproved();
      await testee.deposit(nftAddress, tokenID, {from: ron});
      const nrTokens = await testee.viewNumberOfDepositedTokens.call({from: harry});
      assert.equal(nrTokens[0], 0, "Harry shouldn't have any deposited tokens.");
      assert.equal(nrTokens[1], 1, "Ron should have on depostied token.");
    });
  });

  describe("Cancel", () => {
    it("Proper Canceling", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const hTokenID = await getNftHarryApproved();
      await testee.deposit(nftAddress, hTokenID, {from: harry});
      const rTokenID = await getNftRonApproved();
      await testee.deposit(nftAddress, rTokenID, {from: ron});
      const tx = await testee.cancel({from: ron});
      const hTokenOwner = await NFTs.ownerOf(hTokenID);
      assert.equal(hTokenOwner, harry, "Harry didn't get back his token.");
      const rTokenOwner = await NFTs.ownerOf(rTokenID);
      assert.equal(rTokenOwner, ron, "Ron dind't get back his token.");
      assert(tx.logs[0].event, "successfulCancel");
      await catchRevert(testee.viewMyBasket.call(0, {from: harry}), 
      "Harry shouldn't have a basket after canceling.");
      await catchRevert(testee.viewMyBasket.call(0, {from: ron}), 
      "Ron shouldn't have a basket after canceling.");

      const stateNoBasket = await testee.viewState.call({from: harry});
      assert.equal(stateNoBasket[0], emptyAddress, "Owner1 should be 0x0.");
      assert.equal(stateNoBasket[1], emptyAddress, "Owner2 should be 0x0.");

      await testee.createBaskets(harry, ron, {from: harry});
      const stateWithBasket = await testee.viewState.call({from: harry});
      assert.isFalse(stateWithBasket[2], "Agreed1 should be False.");
      assert.isFalse(stateWithBasket[3], "Agreed2 should be False.");
      const nrTokens = await testee.viewNumberOfDepositedTokens.call({from: harry});
      assert.equal(nrTokens[0], 0, "Harrys basket is not empyt.");
      assert.equal(nrTokens[1], 0, "Rons basket is not empty.")
    });
    it("Canceling without having a basket", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      await catchRevert(testee.cancel({from: draco}));
    });
  });

  describe("Swap tokens", () => {
    it("Both agree and automatic token swap", async () => {
      await testee.createBaskets(harry, ron, {from: harry});
      const hTokenID1 = await getNftHarryApproved();
      await testee.deposit(nftAddress, hTokenID1, {from: harry});
      const hTokenID2 = await getNftHarryApproved();
      await testee.deposit(nftAddress, hTokenID2, {from: harry});
      const rTokenID = await getNftRonApproved();
      await testee.deposit(nftAddress, rTokenID, {from: ron});

      await testee.agree({from: harry});

      const ownerHToken1Before = await NFTs.ownerOf(hTokenID1);
      const ownerHToken2Before = await NFTs.ownerOf(hTokenID2);
      const ownerRTokenBefore= await NFTs.ownerOf(rTokenID);

      assert.equal(ownerHToken1Before, testee.address, 
        "Harrys 1st token is not owned by Escrow contract.");
      assert.equal(ownerHToken2Before, testee.address, 
        "Harrys 2nd token is not owned by Escrow contract.");
      assert.equal(ownerRTokenBefore, testee.address, 
        "Rons token is not owned by Escrow contract.");

      await testee.agree({from: ron});

      const ownerHToken1After = await NFTs.ownerOf(hTokenID1);
      const ownerHToken2After = await NFTs.ownerOf(hTokenID2);
      const ownerRTokenAfter = await NFTs.ownerOf(rTokenID);

      assert.equal(ownerHToken1After, ron, 
        "Harrys 1st token was not transfered to Ron.");
      assert.equal(ownerHToken2After, ron, 
        "Harrys 2nd token was not transfered to Ron.");
      assert.equal(ownerRTokenAfter, harry, 
        "Rons token was not transfered to Harry.");
      await catchRevert(testee.viewMyBasket.call(0, {from: harry}), 
        "Harry shouldn't have a basket after token swap.");
      await catchRevert(testee.viewMyBasket.call(0, {from: ron}), 
        "Ron shouldn't have a basket after token swap.");
      
    });
  });
});
